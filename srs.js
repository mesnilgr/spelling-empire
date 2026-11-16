// Spaced repetition in the style of Anki (SM-2), adapted to a spelling game.
//
// Each word is a card: new → learning (short steps within the session) → review (intervals in days
// that grow with the card's "ease") → back to relearning after a lapse.
// Grades come from what the child did, not from buttons:
//   again — a wrong spelling;
//   hard  — right, but only after a miss (or copied): the card stays in (re)learning;
//   good  — right first time;
//   easy  — right first time and quickly.

export const SRS = {
  learningSteps: [10], // minutes before a new word comes back once in the session
  relearnSteps: [10], // minutes before a missed word comes back
  graduatingDays: 1,
  easyDays: 4,
  startEase: 2.5,
  minEase: 1.3,
  easyBonus: 1.3,
  lapseFactor: 0.5, // a lapsed card's next interval is half the old one (at least 1 day)
  maxDays: 365,
  newPerDay: 15,
};
const MIN = 60000;
const DAY = 86400000;

// Make sure a word stat has card fields (also upgrades the older box-based stats).
export function ensureCard(s, now = Date.now()) {
  if (s.state) return s;
  const BOX_DAYS = [1, 3, 7, 14, 30];
  if (s.box > 0) { s.state = 'review'; s.interval = BOX_DAYS[Math.min(s.box, 5) - 1]; s.due ??= now; }
  else if ((s.correct ?? 0) > 0 && (s.wrong ?? 0) === 0) { s.state = 'review'; s.interval = 1; s.due = (s.lastSeen || now) + DAY; }
  else if ((s.correct ?? 0) + (s.wrong ?? 0) > 0) { s.state = 'learning'; s.step = 0; s.due ??= now; }
  else s.state = 'new';
  s.ease ??= SRS.startEase;
  s.interval ??= 0;
  s.lapses ??= 0;
  s.reps ??= 0;
  return s;
}

const fuzz = (days, rnd) => (days < 3 ? days : Math.round(days * (0.95 + rnd() * 0.1)));

// Apply a grade to a card. Returns the card (mutated).
export function grade(s, g, now = Date.now(), rnd = Math.random) {
  ensureCard(s, now);
  s.reps += 1;
  s.lastGrade = g;
  if (g === 'again') {
    if (s.state === 'review') {
      s.lapses += 1;
      s.ease = Math.max(SRS.minEase, s.ease - 0.2);
      s.interval = Math.max(1, Math.round(s.interval * SRS.lapseFactor));
      s.state = 'relearning';
    } else if (s.state === 'new') s.state = 'learning';
    s.step = 0;
    s.due = now + (s.state === 'relearning' ? SRS.relearnSteps[0] : SRS.learningSteps[0]) * MIN;
    return s;
  }
  if (g === 'hard') {
    // Right after a miss: come back again soon, in the session.
    if (s.state === 'new') s.state = 'learning';
    if (s.state === 'review') { s.ease = Math.max(SRS.minEase, s.ease - 0.15); s.interval = Math.max(1, Math.round(s.interval * 1.2)); s.due = now + fuzz(s.interval, rnd) * DAY; return s; }
    s.step = 0;
    s.due = now + (s.state === 'relearning' ? SRS.relearnSteps[0] : SRS.learningSteps[0]) * MIN;
    return s;
  }
  // good / easy
  if (s.state === 'new' || s.state === 'learning' || s.state === 'relearning') {
    const steps = s.state === 'relearning' ? SRS.relearnSteps : SRS.learningSteps;
    const wasNew = s.state === 'new';
    if (g === 'easy') {
      s.interval = s.state === 'relearning' ? Math.max(s.interval, 1) + 1 : SRS.easyDays;
      s.state = 'review';
    } else if (wasNew) {
      // A new word right first time: see it once more later in the session.
      s.state = 'learning'; s.step = 0;
      s.due = now + steps[0] * MIN;
      return s;
    } else if ((s.step ?? 0) + 1 < steps.length) {
      s.step += 1;
      s.due = now + steps[s.step] * MIN;
      return s;
    } else {
      s.interval = s.state === 'relearning' ? Math.max(1, s.interval) : SRS.graduatingDays;
      s.state = 'review';
    }
    s.due = now + s.interval * DAY;
    return s;
  }
  // Review card.
  const late = Math.max(0, (now - (s.due ?? now)) / DAY);
  if (g === 'easy') {
    s.ease += 0.15;
    s.interval = Math.min(SRS.maxDays, Math.max(s.interval + 1, Math.round((s.interval + late) * s.ease * SRS.easyBonus)));
  } else {
    s.interval = Math.min(SRS.maxDays, Math.max(s.interval + 1, Math.round((s.interval + late / 2) * s.ease)));
  }
  s.interval = Math.min(SRS.maxDays, fuzz(s.interval, rnd));
  s.due = now + s.interval * DAY;
  return s;
}

// Grade from what happened in the spelling window.
export function gradeFromAttempt({ ok, firstTry, copied, ms, length, drawing }) {
  if (!ok) return 'again';
  if (!firstTry || copied) return 'hard';
  const quick = (drawing ? 4000 : 1800) * Math.max(2, length) + 3000;
  return ms > 0 && ms < quick ? 'easy' : 'good';
}

// Choose the next word among `words` (one level's list), Anki-style:
// learning cards due → review cards due → new words (daily limit) → practice of known words.
// stats: key → stat; key(w) gives the stats key. newToday: new words already started today.
export function chooseWord(words, stats, key, { now = Date.now(), newToday = 0, newPerDay = SRS.newPerDay, avoid = '', rnd = Math.random } = {}) {
  const cards = words.filter((w) => w.word !== avoid).map((w) => ({ w, s: stats[key(w)] }));
  const isNew = (c) => !c.s || ensureCard(c.s, now).state === 'new';
  const due = (c) => !isNew(c) && c.s.due <= now;
  const learning = cards.filter((c) => due(c) && c.s.state !== 'review').sort((a, b) => a.s.due - b.s.due);
  if (learning.length) return { w: learning[0].w, why: 'learning' };
  const reviews = cards.filter((c) => due(c) && c.s.state === 'review');
  if (reviews.length) {
    // Most overdue relative to its interval first (the one most at risk of being forgotten).
    const risk = (c) => (now - c.s.due) / ((c.s.interval || 1) * DAY);
    reviews.sort((a, b) => risk(b) - risk(a));
    return { w: reviews[0].w, why: 'review' };
  }
  const fresh = cards.filter(isNew);
  if (fresh.length && newToday < newPerDay) return { w: fresh[Math.floor(rnd() * fresh.length)].w, why: 'new' };
  // Nothing due and no new allowed: practise known words, the hardest (lowest ease) first.
  const known = cards.filter((c) => !isNew(c)).sort((a, b) => a.s.ease - b.s.ease || a.s.due - b.s.due);
  if (known.length) return { w: known[Math.floor(rnd() * Math.min(5, known.length))].w, why: 'practice' };
  if (fresh.length) return { w: fresh[Math.floor(rnd() * fresh.length)].w, why: 'new' };
  return null;
}
