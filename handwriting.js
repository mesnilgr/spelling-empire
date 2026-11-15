// Handwritten letter recognition, entirely on the device.
// A small neural network (trained on synthetic handwriting, see tools/handwriting) reads the
// letter; accents (é è ê ë à â ù û î ï ô ç) are read from the little marks above or below it.

let model = null;

export async function loadModel() {
  if (model) return model;
  const { default: m } = await import('./handwriting-model.js');
  model = {
    letters: m.letters,
    size: m.size,
    box: m.box,
    layers: m.layers.map((L) => {
      const bin = atob(L.w);
      const w = new Int8Array(bin.length);
      for (let i = 0; i < bin.length; i++) w[i] = (bin.charCodeAt(i) << 24) >> 24;
      return { in: L.in, out: L.out, scale: L.scale, w, b: Float32Array.from(L.b) };
    }),
  };
  return model;
}

// Forward pass: dense layers with ReLU, softmax at the end.
export function forward(m, x) {
  let a = x;
  m.layers.forEach((L, li) => {
    const out = new Float32Array(L.out);
    for (let o = 0; o < L.out; o++) {
      let s = 0;
      const row = o * L.in;
      for (let i = 0; i < L.in; i++) s += L.w[row + i] * a[i];
      s = s * L.scale + L.b[o];
      out[o] = li < m.layers.length - 1 ? Math.max(0, s) : s;
    }
    a = out;
  });
  const max = Math.max(...a);
  const e = a.map((v) => Math.exp(v - max));
  const sum = e.reduce((p, v) => p + v, 0);
  return e.map((v) => v / sum);
}

// Same preparation as in training: scale the ink so its longest side is `box` px, centre its
// bounding box in a size×size image, draw the strokes, then average 4×4 blocks.
export function rasterize(strokes, size = 28, box = 20) {
  const pts = strokes.flat();
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pts) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
  const scale = box / Math.max(maxX - minX, maxY - minY, 1e-6);
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const SS = 4;
  const c = document.createElement('canvas');
  c.width = c.height = size * SS;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = '#fff'; g.fillStyle = '#fff';
  g.lineWidth = 2.4 * SS; g.lineCap = 'round'; g.lineJoin = 'round';
  for (const s of strokes) {
    const P = s.map(([x, y]) => [((x - cx) * scale + size / 2) * SS, ((y - cy) * scale + size / 2) * SS]);
    g.beginPath();
    g.moveTo(P[0][0], P[0][1]);
    if (P.length === 1) g.lineTo(P[0][0] + 0.1, P[0][1]);
    for (const [x, y] of P.slice(1)) g.lineTo(x, y);
    g.stroke();
  }
  const data = g.getImageData(0, 0, c.width, c.height).data;
  const out = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let s = 0;
      for (let dy = 0; dy < SS; dy++) for (let dx = 0; dx < SS; dx++) s += data[((y * SS + dy) * c.width + (x * SS + dx)) * 4];
      out[y * size + x] = s / (SS * SS * 255);
    }
  }
  return out;
}

const bbox = (pts) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pts) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
};

// Split off small marks above (accents, dots) or below (cedilla) the main letter.
function splitMarks(strokes) {
  if (strokes.length < 2) return { body: strokes, above: [], below: [] };
  const boxes = strokes.map((s) => bbox(s));
  // The main body: the stroke with the largest extent, plus every stroke overlapping it vertically.
  const main = boxes.reduce((bi, b, i) => (b.w + b.h > boxes[bi].w + boxes[bi].h ? i : bi), 0);
  const mb = boxes[main];
  const H = Math.max(mb.h, mb.w, 1);
  const body = [], above = [], below = [];
  strokes.forEach((s, i) => {
    const b = boxes[i];
    const small = Math.max(b.w, b.h) < H * 0.45;
    if (i !== main && small && b.maxY < mb.minY + H * 0.12) above.push(s);
    else if (i !== main && small && b.minY > mb.maxY - H * 0.12) below.push(s);
    else body.push(s);
  });
  return { body, above, below, H };
}

function accentKind(marks, H) {
  if (!marks.length) return null;
  const sizes = marks.map((s) => { const b = bbox(s); return Math.max(b.w, b.h); });
  if (marks.length >= 2 && sizes.every((v) => v < H * 0.2)) return 'trema';
  const s = marks.reduce((a, b) => (b.length > a.length ? b : a));
  const b = bbox(s);
  if (Math.max(b.w, b.h) < H * 0.12) return 'dot';
  // A corner in the middle (^) → circumflex.
  const [x0, y0] = s[0], [x1, y1] = s[s.length - 1];
  const chord = Math.hypot(x1 - x0, y1 - y0) || 1;
  let far = 0, farPt = s[0];
  for (const [x, y] of s) {
    const d = Math.abs((y1 - y0) * x - (x1 - x0) * y + x1 * y0 - y1 * x0) / chord;
    if (d > far) { far = d; farPt = [x, y]; }
  }
  if (far > chord * 0.28 && farPt[1] < Math.min(y0, y1)) return 'circ';
  // Rising to the right (or drawn the other way) → acute; falling to the right → grave.
  return (x1 - x0) * (y1 - y0) < 0 ? 'acute' : 'grave';
}

const ACCENTS = {
  e: { acute: 'é', grave: 'è', circ: 'ê', trema: 'ë' },
  a: { grave: 'à', circ: 'â', acute: 'à' },
  u: { grave: 'ù', circ: 'û', acute: 'ù', trema: 'ü' },
  i: { circ: 'î', trema: 'ï' },
  o: { circ: 'ô', acute: 'ô' },
};
export const ACCENTED = { e: ['é', 'è', 'ê'], a: ['à', 'â'], u: ['ù', 'û'], i: ['î', 'ï'], o: ['ô'], c: ['ç'] };

// Letters the network can mix up because they share a shape, while a child spelling a word
// would not swap them (unlike b/d, o/au or s/c, which are left alone on purpose).
const LOOKALIKE = { a: 'qdg', q: 'agd', d: 'a', g: 'aq', i: 'lj', l: 'i', j: 'i', h: 'n', n: 'h', u: 'v', v: 'u' };

// A drawing made only of small marks just above the previous letter: a late dot or accent.
// Returns the corrected previous letter, or null when the marks are not that.
export function lateMark(strokes, prevBox, prevLetter, lang = 'fr') {
  if (!prevBox || !prevLetter || !strokes.length) return null;
  const H = Math.max(prevBox.h, prevBox.w * 0.6, 1);
  const b = bbox(strokes.flat());
  if (Math.max(b.w, b.h) > H * 0.45 || b.maxY > prevBox.minY + H * 0.2) return null;
  if (b.minX > prevBox.maxX + H * 0.4 || b.maxX < prevBox.minX - H * 0.4) return null;
  const kind = accentKind(strokes, H);
  const base = prevLetter.normalize('NFD')[0];
  // A stick with any small mark over it is an i (a finger dot is often a short dash).
  if (base === 'l' || base === 'i') return kind === 'circ' && lang === 'fr' ? 'î' : kind === 'trema' && lang === 'fr' ? 'ï' : 'i';
  if (lang === 'fr' && ACCENTS[base]?.[kind]) return ACCENTS[base][kind];
  return null;
}
export const inkBox = (strokes) => bbox(strokes.flat());

// strokes: arrays of [x, y] in screen pixels (y down). Returns best letter + alternatives.
// `expected` (the letter the word needs next) only settles a tie between two lookalike shapes.
export async function recognize(strokes, lang = 'fr', expected = null) {
  const m = await loadModel();
  const { body, above, below, H } = splitMarks(strokes);
  const accent = accentKind(above, H);
  // i and j keep their dot: classify with it.
  const withDot = accent === 'dot' ? [...body, ...above] : body;
  const p = forward(m, rasterize(withDot.length ? withDot : strokes, m.size, m.box));
  const ranked = [...p].map((v, i) => [m.letters[i], v]).sort((a, b) => b[1] - a[1]);
  let best = ranked[0][0];
  // A bare stick: with a dot it's an i, without one it's an l (the other stays one tap away).
  if (best === 'i' && accent !== 'dot' && strokes.length === 1) {
    best = 'l';
    const li = ranked.findIndex(([ch]) => ch === 'l');
    if (li > 0) { const [it] = ranked.splice(li, 1); ranked.unshift(it); }
    if (!ranked.some(([ch]) => ch === 'i')) ranked.push(['i', 0]);
  }
  // Lookalike shapes (a/q, i/l, n/h…): when the network hesitates, the word decides.
  const eb = expected?.normalize('NFD')[0];
  if (eb && eb !== best && LOOKALIKE[best]?.includes(eb)) {
    const k = ranked.findIndex(([ch]) => ch === eb);
    if (k > 0 && k < 4 && ranked[k][1] >= 0.04) { best = eb; const [it] = ranked.splice(k, 1); ranked.unshift(it); }
  }
  // A stick with a mark over it that was not neat enough to be read as a dot is still an i.
  if (best === 'l' && above.length && !ACCENTS.i[accent]) best = 'i';
  if (lang === 'fr') {
    if (accent && accent !== 'dot' && ACCENTS[best]?.[accent]) best = ACCENTS[best][accent];
    else if (accent === 'dot' && best === 'l') best = 'i';
    if (below.length && best === 'c') best = 'ç';
  }
  // Alternatives for one-tap correction: the next guesses, plus accented forms of the best one.
  const base = best.normalize('NFD')[0];
  const alts = [];
  const push = (ch) => { if (ch !== best && !alts.includes(ch)) alts.push(ch); };
  if (lang === 'fr') (ACCENTED[base] ?? []).forEach(push);
  if (lang === 'fr' && base !== best) push(base);
  ranked.slice(1, 4).forEach(([ch]) => push(ch));
  return { letter: best, confidence: ranked[0][1], alternatives: alts.slice(0, 5) };
}
