// Programme de la semaine: themed words on set dates, asked by a parent for the class work of the
// week (pronouns, then être / avoir / aller, then the -er verbs in the present).
// While a theme runs, about one word in two comes from it; the rest stays the usual practice.
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
    name: 'Les verbes en -er', blurb: 'je joue, tu joues, nous jouons…',
    intro: 'Cette semaine, les verbes qui finissent par -er : je joue, tu joues, nous jouons ! Attention aux lettres qu’on n’entend pas à la fin.',
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
const V = (verb, prefix, word, sentence) => P(`${prefix}${prefix.endsWith('’') ? '' : ' '}${word}`, word, {
  prefix, verb, say: `${prefix}${prefix.endsWith('’') ? '' : ' '}${word}`, sentence,
});
const ETRE_AVOIR_ALLER = [
  V('être', 'je', 'suis', 'Je suis dans le jardin.'),
  V('être', 'tu', 'es', 'Tu es dans la maison.'),
  V('être', 'il', 'est', 'Il est dans la forêt.'),
  V('être', 'elle', 'est', 'Elle est sur le pont.'),
  V('être', 'nous', 'sommes', 'Nous sommes au village.'),
  V('être', 'vous', 'êtes', 'Vous êtes à la ferme.'),
  V('avoir', 'j’', 'ai', 'J’ai un chien.'),
  V('avoir', 'tu', 'as', 'Tu as une épée.'),
  V('avoir', 'il', 'a', 'Il a un cheval.'),
  V('avoir', 'elle', 'a', 'Elle a un chat.'),
  V('avoir', 'nous', 'avons', 'Nous avons une maison.'),
  V('avoir', 'vous', 'avez', 'Vous avez des moutons.'),
  V('aller', 'je', 'vais', 'Je vais au cinéma.'),
  V('aller', 'tu', 'vas', 'Tu vas à la mine.'),
  V('aller', 'il', 'va', 'Il va à l’école.'),
  V('aller', 'elle', 'va', 'Elle va à la plage.'),
  V('aller', 'nous', 'allons', 'Nous allons au château.'),
  V('aller', 'vous', 'allez', 'Vous allez à la rivière.'),
];

// -er verbs with no spelling trap in the present (no -ger, -cer, -yer, no e → è).
const ER_VERBS = [
  ['jouer', 'au ballon'], ['chanter', 'une chanson'], ['danser', 'avec Fer'], ['parler', 'à Alaric'],
  ['marcher', 'dans la forêt'], ['regarder', 'les étoiles'], ['sauter', 'très haut'], ['dessiner', 'un dragon'],
  ['aimer', 'les moutons'], ['écouter', 'une histoire'],
];
const ER_PERSONS = [['je', 'e'], ['tu', 'es'], ['il', 'e'], ['elle', 'e'], ['nous', 'ons'], ['vous', 'ez']];
const cap = (s) => s[0].toLocaleUpperCase('fr-FR') + s.slice(1);
const PREMIER_GROUPE = ER_VERBS.flatMap(([inf, end]) => ER_PERSONS.map(([pro, ending]) => {
  const form = inf.slice(0, -2) + ending;
  const prefix = pro === 'je' && /^[aeiouéèh]/.test(inf) ? 'j’' : pro;
  const said = `${prefix}${prefix.endsWith('’') ? '' : ' '}${form}`;
  return V(inf, prefix, form, `${cap(said)} ${end}.`);
}));

// The sentences of the mini-sentence week (served once SENTENCES_READY is true).
export const MINI_PHRASES = [
  'Je vais au cinéma.', 'Tu es énervé ?', 'Nous avons une maison.', 'Il est dans la forêt.',
  'Elle a un chat.', 'Vous allez à la mine ?', 'Je suis content.', 'Tu as un chien ?',
  'Nous allons au château.', 'Elle va à la plage.', 'Vous êtes mes amis.', 'Il a une épée.',
];

export const PROGRAMME_WORDS = {
  pronoms: PRONOUNS,
  'etre-avoir-aller': ETRE_AVOIR_ALLER,
  'premier-groupe': PREMIER_GROUPE,
  'mini-phrases': [],
};

// Which theme runs on a given day ('YYYY-MM-DD'): the calendar ('auto'), a theme the parents
// picked, or none ('off').
export function themeFor(dateISO, setting = 'auto') {
  if (setting === 'off') return null;
  if (setting && setting !== 'auto') return PROGRAMME.find((p) => p.id === setting) ?? null;
  return PROGRAMME.find((p) => p.from <= dateISO && dateISO <= p.to) ?? null;
}

// The words a theme serves (a theme that needs sentences falls back until they are ready).
export function themeWords(theme, { sentences = SENTENCES_READY } = {}) {
  if (!theme) return [];
  if (theme.needs === 'sentences' && !sentences) return themeWords(PROGRAMME.find((p) => p.id === theme.fallback));
  return PROGRAMME_WORDS[theme.id] ?? [];
}

// The next themes on the calendar after a day (for the parents' corner).
export function upcomingThemes(dateISO) {
  return PROGRAMME.filter((p) => p.to >= dateISO);
}
