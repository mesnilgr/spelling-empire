// "Le village qui oubliait ses mots": chapters, objectives and dialogue (French first;
// English falls back to the French text for now).

// Who speaks: portrait and name.
export const SPEAKERS = {
  narrator: { emoji: '📜', name: { fr: 'Le conteur', en: 'Storyteller' } },
  mage: { emoji: '🧙', name: { fr: 'Alaric le mage', en: 'Alaric the mage' } },
  mimot: { emoji: '🐣', name: { fr: 'Le Mimot', en: 'The Mimot' } },
  page: { emoji: '📄', name: { fr: 'La page arrachée', en: 'The torn page' } },
};

// Dialogue scenes: lists of [speaker, French line].
export const SCENES = {
  intro: [
    ['narrator', 'Ce matin, au village, il s’est passé quelque chose de bizarre…'],
    ['narrator', 'Les panneaux des maisons sont tout blancs : les mots se sont envolés !'],
    ['narrator', 'Va voir Alaric le mage. Il est près de la fontaine.'],
  ],
  mage1: [
    ['mage', 'Ah, te voilà ! Les mots s’envolent du village, un par un…'],
    ['mage', 'Sans leur nom, les maisons s’endorment. Regarde leurs panneaux !'],
    ['mage', 'Prends mon vieux grimoire. Quand tu écris un mot juste, il revient.'],
    ['mage', 'Commence par les panneaux : touche le panneau devant une maison.'],
  ],
  signsDone: [
    ['narrator', 'Bravo ! Les maisons se réveillent et leurs fenêtres brillent.'],
    ['narrator', 'Oh ! Regarde près de la fontaine : une petite créature !'],
    ['mage', 'C’est un Mimot : un mot qui s’est échappé et qui a pris vie. Écris son mot pour l’apprivoiser.'],
  ],
  mimot1: [
    ['mimot', 'Mi-mot ! Mi-mot !'],
    ['narrator', 'Le Mimot saute de joie et file se cacher dans ton album.'],
    ['narrator', 'Il a laissé tomber quelque chose près de la fontaine… une page !'],
  ],
  page1: [
    ['page', '« … lune, pont, maman, soleil, gâteau… Je dois tout écrire, vite, pour ne jamais oublier. A. »'],
    ['narrator', 'Qui a écrit cette page ? L’écriture est toute penchée…'],
    ['narrator', 'D’autres Mimots se cachent dans le village. Et la forêt des sapins t’attend bientôt !'],
  ],
};

// Chapters: objectives in order. `count` objectives finish after that many steps.
export const CHAPTERS = [
  {
    id: 1,
    title: { fr: 'Chapitre 1 · Les panneaux effacés', en: 'Chapter 1 · The blank signs' },
    objectives: [
      { id: 'talkMage', text: { fr: 'Va parler à Alaric le mage 🧙', en: 'Go and talk to Alaric the mage 🧙' } },
      { id: 'signs', count: 3, text: { fr: 'Rends leur nom aux maisons 🪧', en: 'Give the houses back their names 🪧' } },
      { id: 'mimot', text: { fr: 'Apprivoise le Mimot près de la fontaine 🐣', en: 'Tame the Mimot by the fountain 🐣' } },
      { id: 'page', text: { fr: 'Ramasse la page arrachée 📄', en: 'Pick up the torn page 📄' } },
    ],
    end: 'page1',
  },
  {
    id: 2,
    title: { fr: 'Chapitre 2 · La forêt des sapins', en: 'Chapter 2 · The pine forest' },
    objectives: [
      { id: 'soon', text: { fr: 'La suite arrive bientôt ! En attendant, trouve les autres Mimots 🐣', en: 'More soon! Meanwhile, find the other Mimots 🐣' } },
    ],
  },
];

// The three house signs of chapter 1 and the word each one needs (by age).
export const SIGNS = [
  { house: 'tavern', word: { 5: 't', 6: 'taverne' } },
  { house: 'blacksmith', word: { 5: 'f', 6: 'forge' } },
  { house: 'tower', word: { 5: 't', 6: 'tour' } },
];
const LETTER_NAMES = { t: 'té', f: 'èfe' };
export function signWord(sign, age) {
  const full = sign.word[6];
  if (age <= 5) return { word: sign.word[5], level: 'story', say: `La lettre ${LETTER_NAMES[sign.word[5]]}… comme dans ${full}.` };
  return { word: full, level: 'story', say: `${full}.` };
}

// Mimots in the village: where they wander. The fountain one appears in chapter 1.
export const MIMOTS = [
  { id: 'fontaine', x: 3.2, z: -3, color: 0xffc94a, story: true },
  { id: 'mare', x: -11, z: -21, color: 0x7ad0ff },
  { id: 'champ', x: 4, z: 18.5, color: 0xff8ab0 },
  { id: 'carriere', x: 17, z: -12, color: 0xb08aff },
];
export const PAGE_SPOT = { x: 2.2, z: -2.2 };
