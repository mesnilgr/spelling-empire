// "Quoi de neuf ?": every release is presented to the child by Alaric, written and read aloud, the
// first time the game is opened after it. The notes stay in the journal 📜 (newest first).
// show: what the "Show me!" button points the golden arrow at ('mage', 'golem', … or {x, z}).
// Add one entry (or two) per release, at the END of the list.
export const NEWS = [
  {
    id: '1.19.0-alaric', day: 1, date: '2026-11-20', emoji: '🧙', show: 'mage',
    title: { fr: 'Alaric te raconte les nouveautés', en: 'Alaric tells you what is new' },
    text: {
      fr: 'Bonjour ! C’est moi, Alaric. Chaque fois que l’Empire des Mots grandit, je viendrai te raconter la nouveauté. Touche « Montre-moi » pour y aller, ou retrouve tout dans le journal 📜.',
      en: 'Hello! It’s me, Alaric. Every time the Empire of Words grows, I’ll come and tell you what’s new. Touch “Show me” to go there, or find everything in the journal 📜.',
    },
  },
  {
    id: '1.19.0-golem', day: 1, date: '2026-11-20', emoji: '🤖', show: 'golem',
    title: { fr: 'Fer, le golem de fer', en: 'Iron, the iron golem' },
    text: {
      fr: 'Un gardien est arrivé au village : Fer, le golem de fer ! Il fait le tour de la place, et la nuit il écrase les zombies qui s’approchent des maisons. Va lui dire bonjour : il a peut-être une fleur pour toi.',
      en: 'A guardian has come to the village: Iron, the iron golem! He walks round the square, and at night he crushes the zombies that come near the houses. Go and say hello: he may have a flower for you.',
    },
  },
];
