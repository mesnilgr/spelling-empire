// "Quoi de neuf ?": every release is presented to the child by Alaric, written and read aloud, the
// first time the game is opened after it. The notes stay in the journal 📜 (newest first).
// show: what the "Show me!" button points the golden arrow at ('mage', 'golem', 'jumpchest', … or {x, z}).
// riddle: Alaric's riddle at the end of the card ({ q: {fr, en}, a: {fr, en} }); "The answer?" reads a.
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
  {
    id: '1.20.0-defis', day: 2, date: '2026-11-21', emoji: '🎯', show: 'jumpchest',
    title: { fr: 'Les défis du jour et le coffre sauteur', en: 'Daily challenges and the jumping chest' },
    text: {
      fr: 'Nouveau ! Chaque jour, trois défis le matin et trois défis le soir. Réussis-les et attrape le coffre sauteur… s’il se laisse faire ! Et regarde bien : Cocotte la poule s’est cachée quelque part.',
      en: 'New! Every day, three challenges in the morning and three in the evening. Do them and catch the jumping chest… if it lets you! And look carefully: Cocotte the hen is hiding somewhere.',
    },
    riddle: {
      q: { fr: 'Plus j’ai de gardiens, moins je suis gardé. Qui suis-je ?', en: 'The more people keep me, the less I am kept. What am I?' },
      a: { fr: 'Un secret !', en: 'A secret!' },
    },
  },
  {
    id: '1.21.0-flamme', day: 3, date: '2026-11-22', emoji: '🔥', show: 'flame',
    title: { fr: 'Flammèche, la flamme des jours', en: 'Flammèche, the flame of the days' },
    text: {
      fr: 'Voici Flammèche, ta flamme magique ! Elle t’attend dans la cheminée de ta chaumière : épelle FEU pour l’allumer, et chaque mot réussi la fait grandir. Reviens chaque jour : au septième jour, une grosse surprise pour ton chien !',
      en: 'Meet Flammèche, your magic flame! She is waiting in your cottage chimney: spell FIRE to light her, and every good word makes her grow. Come back every day: on the seventh day, a big surprise for your dog!',
    },
    riddle: {
      q: { fr: 'Je mange tout, mais si je bois, je m’éteins. Qui suis-je ?', en: 'I eat everything, but if I drink, I go out. What am I?' },
      a: { fr: 'Le feu !', en: 'Fire!' },
    },
  },
];
