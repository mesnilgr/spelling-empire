// Programme de la semaine: themed words on set dates, asked by a parent for the class work of the
// week (pronouns, then être / avoir / aller, then the -er verbs in the present).
// While a theme runs, about one word in two comes from it; the rest stays the usual practice.
// Each theme opens progressively (field "day" on an item: days after the start of the theme), so
// a child never meets everything at once: être first, then avoir, then aller; four -er verbs, then
// seven, then ten; faire / dire / venir with je, tu, il, elle before nous and vous.
// Parents follow the calendar ('auto'), pick a theme, or turn it off in the parents' corner.
// French only: in English the programme is off.

// Mini-sentences ("Je vais au cinéma.") need the sentence layout of the "Mini-phrases défi"
// release; until then their week falls back to être / avoir / aller.
export const SENTENCES_READY = false;

export const PROGRAMME_SHARE = 0.5;

export const PROGRAMME = [
  {
    id: 'pronoms', from: '2026-11-23', to: '2026-11-25', emoji: '🙋',
    name: 'Les pronoms', blurb: 'je, tu, il, elle, nous, vous',
    intro: 'Cette semaine, on apprend les petits mots qui disent qui fait l’action : je, tu, il, elle, nous, vous. Regarde bien l’image : elle te montre qui parle !',
  },
  {
    id: 'etre-avoir-aller', from: '2026-11-26', to: '2026-11-29', emoji: '🏃',
    name: 'Être, avoir, aller', blurb: 'je suis, j’ai, je vais…',
    intro: 'Nouveau défi : les verbes être, avoir et aller ! Le petit mot est déjà écrit, à toi d’écrire le verbe : nous… sommes, tu… as, il… va.',
  },
  {
    id: 'mini-phrases', from: '2026-11-30', to: '2026-12-06', emoji: '💬', needs: 'sentences', fallback: 'etre-avoir-aller',
    name: 'Mini-phrases', blurb: 'Je vais au cinéma. Tu es énervé ?',
    intro: 'Cette semaine, tu écris de vraies petites phrases, avec une majuscule au début et un point à la fin !',
  },
  {
    id: 'premier-groupe', from: '2026-12-07', to: '2026-12-13', emoji: '🎵',
    name: 'Les verbes en -er', blurb: 'je joue, tu donnes, nous parlons…',
    intro: 'Cette semaine, les verbes qui finissent par -er : je joue, tu joues, nous jouons ! Attention aux lettres qu’on n’entend pas à la fin.',
  },
  {
    id: 'faire-dire-venir', from: '2026-12-14', to: '2026-12-20', emoji: '🛠️',
    name: 'Faire, dire, venir', blurb: 'je fais, tu dis, il vient…',
    intro: 'Cette semaine, trois verbes qu’on dit tout le temps : faire, dire et venir. Je fais, tu dis, il vient : écoute bien la dernière lettre, on ne l’entend pas !',
  },
];

const P = (id, word, extra) => ({ id, word, level: 'programme', ...extra });

const PRONOUNS = [
  P('je', 'je', { pic: '🙋', who: 'moi', say: 'je. Je joue avec mon chien.', sentence: 'Je joue avec mon chien.' }),
  P('tu', 'tu', { pic: '👉', who: 'toi', say: 'tu. Tu cours très vite !', sentence: 'Tu cours très vite !' }),
  P('il', 'il', { pic: '👦', who: 'lui, un garçon', say: 'il. Il mange une pomme.', sentence: 'Il mange une pomme.' }),
  P('elle', 'elle', { pic: '👧', who: 'elle, une fille', say: 'elle. Elle lit un livre.', sentence: 'Elle lit un livre.' }),
  P('nous', 'nous', { pic: '🙋👫', who: 'moi et mes amis', say: 'nous. Nous jouons ensemble.', sentence: 'Nous jouons ensemble.' }),
  P('vous', 'vous', { pic: '👉👫', who: 'toi et tes amis', say: 'vous. Vous chantez très bien.', sentence: 'Vous chantez très bien.' }),
];

// Pronoun written in grey (prefix), the child writes the verb.
const V = (verb, prefix, word, sentence, day = 0) => P(`${prefix}${prefix.endsWith('’') ? '' : ' '}${word}`, word, {
  prefix, verb, say: `${prefix}${prefix.endsWith('’') ? '' : ' '}${word}`, sentence, day,
});
const ETRE_AVOIR_ALLER = [
  V('être', 'je', 'suis', 'Je suis dans le jardin.'),
  V('être', 'tu', 'es', 'Tu es dans la maison.'),
  V('être', 'il', 'est', 'Il est dans la forêt.'),
  V('être', 'elle', 'est', 'Elle est sur le pont.'),
  V('être', 'nous', 'sommes', 'Nous sommes au village.'),
  V('être', 'vous', 'êtes', 'Vous êtes à la ferme.'),
  V('avoir', 'j’', 'ai', 'J’ai un chien.', 1),
  V('avoir', 'tu', 'as', 'Tu as une épée.', 1),
  V('avoir', 'il', 'a', 'Il a un cheval.', 1),
  V('avoir', 'elle', 'a', 'Elle a un chat.', 1),
  V('avoir', 'nous', 'avons', 'Nous avons une maison.', 1),
  V('avoir', 'vous', 'avez', 'Vous avez des moutons.', 1),
  V('aller', 'je', 'vais', 'Je vais au cinéma.', 2),
  V('aller', 'tu', 'vas', 'Tu vas à la mine.', 2),
  V('aller', 'il', 'va', 'Il va à l’école.', 2),
  V('aller', 'elle', 'va', 'Elle va à la plage.', 2),
  V('aller', 'nous', 'allons', 'Nous allons au château.', 2),
  V('aller', 'vous', 'allez', 'Vous allez à la rivière.', 2),
];

// -er verbs: the ten most frequent regular ones that a child uses (Éduscol frequency list of written
// French, abstract ones such as penser or rester left out), with no spelling trap in the present
// (no -ger, -cer, -yer, -eler, -eter, no e → è: those come later, in CE2). They open by stages.
const ER_VERBS = [
  ['jouer', 'au ballon', 0], ['aimer', 'les moutons', 0], ['regarder', 'les étoiles', 0], ['donner', 'une pomme au cheval', 0],
  ['parler', 'à Alaric', 2], ['trouver', 'un trésor', 2], ['chercher', 'Cocotte', 2],
  ['demander', 'de l’aide', 4], ['arriver', 'au village', 4], ['tomber', 'dans la neige', 4],
];
const ER_PERSONS = [['je', 'e'], ['tu', 'es'], ['il', 'e'], ['elle', 'e'], ['nous', 'ons'], ['vous', 'ez']];
const cap = (s) => s[0].toLocaleUpperCase('fr-FR') + s.slice(1);
const PREMIER_GROUPE = ER_VERBS.flatMap(([inf, end, day]) => ER_PERSONS.map(([pro, ending]) => {
  const form = inf.slice(0, -2) + ending;
  const prefix = pro === 'je' && /^[aeiouéèh]/.test(inf) ? 'j’' : pro;
  const said = `${prefix}${prefix.endsWith('’') ? '' : ' '}${form}`;
  return V(inf, prefix, form, `${cap(said)} ${end}.`, day);
}));

// Faire, dire, venir (the irregular verbs of CE1): je, tu, il, elle first, nous and vous from day 3.
const FAIRE_DIRE_VENIR = [
  V('faire', 'je', 'fais', 'Je fais un gâteau.'),
  V('faire', 'tu', 'fais', 'Tu fais un dessin.'),
  V('faire', 'il', 'fait', 'Il fait un bonhomme de neige.'),
  V('faire', 'elle', 'fait', 'Elle fait une cabane.'),
  V('faire', 'nous', 'faisons', 'Nous faisons un château.', 3),
  V('faire', 'vous', 'faites', 'Vous faites du vélo.', 3),
  V('dire', 'je', 'dis', 'Je dis bonjour.'),
  V('dire', 'tu', 'dis', 'Tu dis merci.'),
  V('dire', 'il', 'dit', 'Il dit au revoir.'),
  V('dire', 'elle', 'dit', 'Elle dit oui.'),
  V('dire', 'nous', 'disons', 'Nous disons bonjour à Alaric.', 3),
  V('dire', 'vous', 'dites', 'Vous dites merci.', 3),
  V('venir', 'je', 'viens', 'Je viens avec toi.'),
  V('venir', 'tu', 'viens', 'Tu viens jouer ?'),
  V('venir', 'il', 'vient', 'Il vient à la ferme.'),
  V('venir', 'elle', 'vient', 'Elle vient au village.'),
  V('venir', 'nous', 'venons', 'Nous venons demain.', 3),
  V('venir', 'vous', 'venez', 'Vous venez avec nous ?', 3),
];

// The sentences of the mini-sentence week (served once SENTENCES_READY is true): three words
// for the first two days, then four or five.
export const MINI_PHRASES = [
  { text: 'Je suis là.', day: 0 }, { text: 'Il est là.', day: 0 }, { text: 'Elle va bien.', day: 0 },
  { text: 'Tu as faim ?', day: 0 }, { text: 'Nous allons jouer.', day: 0 }, { text: 'Vous êtes là ?', day: 0 },
  { text: 'Je vais au cinéma.', day: 2 }, { text: 'Tu es énervé ?', day: 2 }, { text: 'Nous avons une maison.', day: 2 },
  { text: 'Il est dans la forêt.', day: 2 }, { text: 'Elle a un chat.', day: 2 }, { text: 'Vous allez à la mine ?', day: 2 },
  { text: 'Je suis content.', day: 2 }, { text: 'Tu as un chien ?', day: 2 }, { text: 'Nous allons au château.', day: 2 },
  { text: 'Elle va à la plage.', day: 2 }, { text: 'Vous êtes mes amis.', day: 2 }, { text: 'Il a une épée.', day: 2 },
];

export const PROGRAMME_WORDS = {
  pronoms: PRONOUNS,
  'etre-avoir-aller': ETRE_AVOIR_ALLER,
  'premier-groupe': PREMIER_GROUPE,
  'faire-dire-venir': FAIRE_DIRE_VENIR,
  'mini-phrases': [],
};

// Which theme runs on a given day ('YYYY-MM-DD'): the calendar ('auto'), a theme the parents
// picked, or none ('off').
export function themeFor(dateISO, setting = 'auto') {
  if (setting === 'off') return null;
  if (setting && setting !== 'auto') return PROGRAMME.find((p) => p.id === setting) ?? null;
  return PROGRAMME.find((p) => p.from <= dateISO && dateISO <= p.to) ?? null;
}

// The words a theme serves on a given day of the theme (0 = its first day): items open by stages.
// A theme that needs sentences falls back until they are ready (with everything of the fallback open).
export function themeWords(theme, { sentences = SENTENCES_READY, day = Infinity } = {}) {
  if (!theme) return [];
  if (theme.needs === 'sentences' && !sentences) return themeWords(PROGRAMME.find((p) => p.id === theme.fallback));
  const all = PROGRAMME_WORDS[theme.id] ?? [];
  return day === Infinity ? all : all.filter((w) => (w.day ?? 0) <= day);
}

// Day of a theme (0 = first day) for a date, counted from its start or from when the parents picked it.
export function themeDay(theme, dateISO, since) {
  const start = since ?? theme.from;
  return Math.max(0, Math.round((Date.parse(dateISO) - Date.parse(start)) / 864e5));
}

// The next themes on the calendar after a day (for the parents' corner).
export function upcomingThemes(dateISO) {
  return PROGRAMME.filter((p) => p.to >= dateISO);
}
