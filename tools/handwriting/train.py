"""Generate synthetic handwritten letters from stroke templates, train a small neural network,
and export it (int8 weights) as a JavaScript module the game loads on demand."""
import base64
import json
import math
import sys
import time

import numpy as np
from PIL import Image, ImageDraw
from sklearn.neural_network import MLPClassifier

from letters import LETTERS, all_templates

RNG = np.random.default_rng(7)
SS = 4  # supersampling factor for rendering
SIZE = 28
BOX = 20.0


def resample(stroke, step=0.02):
    pts = [np.array(stroke[0], float)]
    for p in stroke[1:]:
        p = np.array(p, float)
        d = np.linalg.norm(p - pts[-1])
        n = max(1, int(d / step))
        for i in range(1, n + 1):
            pts.append(pts[-1] + (p - pts[-1]) * (1 / (n - i + 1)))
    return np.array(pts)


def augment(strokes, rng):
    out = []
    rot = math.radians(rng.normal(0, 9))
    shear = rng.normal(0, 0.18)
    sx, sy = rng.uniform(0.75, 1.25), rng.uniform(0.85, 1.15)
    ca, sa = math.cos(rot), math.sin(rot)
    for s in strokes:
        p = resample(s)
        n = len(p)
        # trim / extend the ends a little
        if n > 6:
            a = int(rng.uniform(0, 0.08) * n)
            b = n - int(rng.uniform(0, 0.08) * n)
            p = p[a:max(a + 2, b)]
        # low-frequency wobble along the stroke
        t = np.linspace(0, 1, len(p))
        for _ in range(2):
            amp = rng.uniform(0.004, 0.022)
            f = rng.uniform(0.5, 3)
            ph = rng.uniform(0, 6.3)
            p = p + np.stack([amp * np.sin(2 * np.pi * f * t + ph), amp * np.cos(2 * np.pi * f * t + ph * 1.3)], 1)
        p = p + rng.normal(0, 0.025, 2)  # strokes don't meet exactly
        x, y = p[:, 0] - 0.5, p[:, 1] - 0.5
        x = x * sx + shear * y
        y = y * sy
        p = np.stack([x * ca - y * sa, x * sa + y * ca], 1)
        out.append(p)
    # occasionally a small lead-in or exit stroke (joined-up habit)
    if rng.random() < 0.15:
        s0 = out[0][0]
        out[0] = np.vstack([[s0 + np.array([-rng.uniform(0.05, 0.15), rng.uniform(0, 0.12)])], out[0]])
    return out


def normalize(strokes):
    """Scale the ink so its longest side is BOX px and centre its bounding box in SIZE×SIZE.
    Exactly mirrored in handwriting.js."""
    allp = np.vstack(strokes)
    mn, mx = allp.min(0), allp.max(0)
    w, h = mx - mn
    scale = BOX / max(w, h, 1e-6)
    c = (mn + mx) / 2
    return [(s - c) * scale + SIZE / 2 for s in strokes]


def render(strokes, width):
    img = Image.new('L', (SIZE * SS, SIZE * SS), 0)
    d = ImageDraw.Draw(img)
    for s in strokes:
        pts = [(float(x) * SS, float(y) * SS) for x, y in s]
        if len(pts) == 1:
            pts = pts * 2
        d.line(pts, fill=255, width=max(1, int(round(width * SS))), joint='curve')
        r = width * SS / 2
        for x, y in (pts[0], pts[-1]):
            d.ellipse([x - r, y - r, x + r, y + r], fill=255)
    a = np.asarray(img, dtype=np.float32) / 255.0
    return a.reshape(SIZE, SS, SIZE, SS).mean(axis=(1, 3))


def make_set(n_per, seed):
    rng = np.random.default_rng(seed)
    T = all_templates()
    X, y = [], []
    for li, letter in enumerate(LETTERS):
        variants = T[letter]
        for _ in range(n_per):
            v = variants[rng.integers(len(variants))]
            strokes = augment(v, rng)
            # kids sometimes forget the dot on i / j
            if letter in 'ij' and len(strokes) > 1 and rng.random() < 0.12:
                strokes = strokes[:-1]
            img = render(normalize(strokes), rng.uniform(1.7, 3.1))
            X.append(img.ravel())
            y.append(li)
    return np.array(X, np.float32), np.array(y)


if __name__ == '__main__':
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 2000
    t0 = time.time()
    X, y = make_set(n, 1)
    Xt, yt = make_set(250, 99)
    print(f'data {X.shape} in {time.time() - t0:.0f}s', flush=True)
    clf = MLPClassifier(hidden_layer_sizes=(256, 128), activation='relu', alpha=1e-4, batch_size=256,
                        learning_rate_init=1e-3, max_iter=60, early_stopping=True, n_iter_no_change=6, verbose=False, random_state=0)
    clf.fit(X, y)
    acc = clf.score(Xt, yt)
    print(f'held-out accuracy {acc:.4f} after {clf.n_iter_} epochs, {time.time() - t0:.0f}s', flush=True)
    # top confusions
    pred = clf.predict(Xt)
    conf = {}
    for a, b in zip(yt, pred):
        if a != b:
            conf[(LETTERS[a], LETTERS[b])] = conf.get((LETTERS[a], LETTERS[b]), 0) + 1
    print('top confusions', sorted(conf.items(), key=lambda kv: -kv[1])[:12])
    proba = clf.predict_proba(Xt)
    top3 = np.mean([yt[i] in np.argsort(-proba[i])[:3] for i in range(len(yt))])
    print(f'top-3 accuracy {top3:.4f}')

    # Export: per-layer int8 weights with a float scale, float biases.
    layers = []
    for W, b in zip(clf.coefs_, clf.intercepts_):
        s = float(np.abs(W).max() / 127.0)
        q = np.clip(np.round(W / s), -127, 127).astype(np.int8)
        layers.append({'in': W.shape[0], 'out': W.shape[1], 'scale': s,
                       'w': base64.b64encode(q.T.copy().tobytes()).decode(),  # row-major [out][in]
                       'b': [round(float(v), 6) for v in b]})
    model = {'letters': LETTERS, 'size': SIZE, 'box': BOX, 'accuracy': round(acc, 4), 'layers': layers}
    js = ('// Handwritten-letter recognizer: a small neural network trained on synthetic strokes\n'
          '// (generated from stroke templates in tools/handwriting). int8 weights, base64.\n'
          'export default ' + json.dumps(model) + ';\n')
    open(sys.argv[2] if len(sys.argv) > 2 else 'handwriting-model.js', 'w').write(js)
    # A few reference vectors to check the JS port gives the same answers.
    ref = {'inputs': [base64.b64encode((Xt[i] * 255).round().astype(np.uint8).tobytes()).decode() for i in range(0, len(Xt), 650)],
           'expected': [int(v) for v in clf.predict((Xt[::650] * 255).round() / 255)]}
    json.dump(ref, open('reference.json', 'w'))
    print('exported', len(js) // 1024, 'KB')
