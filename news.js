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
  // Programme de la semaine (programme.js): dated cards, shown from their day on, in French only.
  {
    id: 'prog-pronoms', programme: 'pronoms', day: 4, date: '2026-11-23', from: '2026-11-23', only: 'fr', emoji: '🙋', show: null,
    title: { fr: 'Le programme de la semaine : les pronoms', en: 'This week: pronouns' },
    text: {
      fr: 'Cette semaine, on apprend les petits mots qui disent qui fait l’action : je, tu, il, elle, nous, vous. Regarde bien l’image : elle te montre qui parle !',
      en: 'This week: the little words that tell who does the action.',
    },
    riddle: {
      q: { fr: 'Quel petit mot dis-tu pour parler de toi ?', en: 'Which little word do you say to talk about yourself?' },
      a: { fr: 'Je !', en: 'I!' },
    },
  },
  {
    id: 'prog-etre-avoir-aller', programme: 'etre-avoir-aller', day: 7, date: '2026-11-26', from: '2026-11-26', only: 'fr', emoji: '🏃', show: null,
    title: { fr: 'Le programme de la semaine : être, avoir, aller', en: 'This week: to be, to have, to go' },
    text: {
      fr: 'Nouveau défi : les verbes être, avoir et aller ! Le petit mot est déjà écrit, à toi d’écrire le verbe : nous… sommes, tu… as, il… va.',
      en: 'New challenge: the verbs to be, to have and to go.',
    },
    riddle: {
      q: { fr: 'Je suis, tu es, il… ?', en: 'I am, you are, he… ?' },
      a: { fr: 'Il est !', en: 'He is!' },
    },
  },
  {
    id: 'prog-premier-groupe', programme: 'premier-groupe', day: 18, date: '2026-12-07', from: '2026-12-07', only: 'fr', emoji: '🎵', show: null,
    title: { fr: 'Le programme de la semaine : les verbes en -er', en: 'This week: -er verbs' },
    text: {
      fr: 'Cette semaine, les verbes qui finissent par -er : je joue, tu joues, nous jouons ! Attention aux lettres qu’on n’entend pas à la fin. Chaque jour, de nouveaux verbes arrivent.',
      en: 'This week: French verbs ending in -er, a few more each day.',
    },
    riddle: {
      q: { fr: 'Je joue, tu joues… Quelle lettre se cache à la fin de « tu joues » ?', en: 'Which silent letter ends “tu joues”?' },
      a: { fr: 'Un S, qu’on n’entend pas !', en: 'An S, which you can’t hear!' },
    },
  },
  {
    id: 'prog-faire-dire-venir', programme: 'faire-dire-venir', day: 25, date: '2026-12-14', from: '2026-12-14', only: 'fr', emoji: '🛠️', show: null,
    title: { fr: 'Le programme de la semaine : faire, dire, venir', en: 'This week: faire, dire, venir' },
    text: {
      fr: 'Cette semaine, trois verbes qu’on dit tout le temps : faire, dire et venir. Je fais, tu dis, il vient : écoute bien, la dernière lettre ne s’entend pas !',
      en: 'This week: three verbs we use all the time.',
    },
    riddle: {
      q: { fr: 'Je fais, tu fais, il… ?', en: 'Je fais, tu fais, il… ?' },
      a: { fr: 'Il fait, avec un T !', en: 'Il fait, with a T!' },
    },
  },
  {
    id: '1.22.0-album', day: 4, date: '2026-11-23', emoji: '📖', show: 'albumstand',
    title: { fr: 'Ton album de collection', en: 'Your collection album' },
    text: {
      fr: 'Voici ton album ! Il t’attend à côté de ta chaumière. Chaque animal, chaque lieu, chaque boss va s’y coller : épelle son nom pour coller la vignette. Remplis la page découverte pour gagner un costume !',
      en: 'Here is your album! It is waiting next to your cottage. Every animal, every place, every boss goes in it: spell its name to stick the sticker. Fill the discovery page to win an outfit!',
    },
    riddle: {
      q: { fr: 'J’ai des feuilles, mais je ne suis pas un arbre. Qui suis-je ?', en: 'I have leaves, but I am not a tree. What am I?' },
      a: { fr: 'Un livre !', en: 'A book!' },
    },
  },
  {
    id: '1.23.0-pouvoirs', day: 5, date: '2026-11-24', emoji: '⚡', show: 'powerstone',
    title: { fr: 'Les pouvoirs des mots', en: 'Word powers' },
    text: {
      fr: 'Les mots ont des pouvoirs ! Touche la pierre des pouvoirs, au bout du chemin, devant ta chaumière. Réussis un mot difficile et tu pourras courir comme le vent, sauter jusqu’aux nuages… et plus tard devenir géant et planer !',
      en: 'Words have powers! Touch the power stone, at the end of the path, in front of your cottage. Get a hard word right and you can run like the wind, jump up to the clouds… and later become a giant and glide!',
    },
    riddle: {
      q: { fr: 'Qu’est-ce qui monte et ne redescend jamais ?', en: 'What goes up and never comes down?' },
      a: { fr: 'Ton âge !', en: 'Your age!' },
    },
  },
  {
    id: 'prog-articles', programme: 'articles', day: 5, date: '2026-11-24', from: '2026-11-24', only: 'fr', emoji: '🔤', show: null,
    title: { fr: 'Le programme : les articles', en: 'Programme: articles' },
    text: {
      fr: 'Nouveau : les petits mots qui vont devant les noms ! La maison, le chat… Regarde l’image et écoute bien : le ou la ?',
      en: 'New: the little words that go before nouns.',
    },
    riddle: {
      q: { fr: 'Le chat, la maison… Et pour la lune, on dit le ou la ?', en: 'Le chat, la maison… and for the moon?' },
      a: { fr: 'La lune !', en: 'La lune!' },
    },
  },
  {
    id: 'prog-couleurs', programme: 'couleurs', day: 12, date: '2026-12-01', from: '2026-12-01', only: 'fr', emoji: '🎨', show: null,
    title: { fr: 'Le programme : les couleurs', en: 'Programme: colours' },
    text: {
      fr: 'Cette semaine, les couleurs ! Le mouton est blanc, la lune est blanche : avec « la », la couleur prend souvent un e à la fin.',
      en: 'This week: colours, and how they change with « la ».',
    },
    riddle: {
      q: { fr: 'Le mouton est blanc. Et la neige ?', en: 'The sheep is « blanc ». And the snow?' },
      a: { fr: 'La neige est blanche !', en: 'La neige est blanche!' },
    },
  },
  {
    id: '1.24.0-golem-cuivre', day: 6, date: '2026-11-25', emoji: '🤖', show: 'anvil',
    title: { fr: 'Ton petit golem de cuivre', en: 'Your little copper golem' },
    text: {
      fr: 'Les golems des boss se réveillent un peu : ils marchent dans leur repaire ! Et tu peux fabriquer ton propre petit golem de cuivre, sur l’enclume à côté de la forge. Il est un peu maladroit… mais il connaît des coffres secrets ! Et quand tu planes : un deltaplane !',
      en: 'The bosses’ golems are waking up a little: they walk around their lair! And you can build your own little copper golem, on the anvil next to the forge. He is a bit clumsy… but he knows about secret chests! And when you glide: a hang-glider!',
    },
    riddle: {
      q: { fr: 'Pourquoi les golems ne gagnent jamais à cache-cache ?', en: 'Why do golems never win at hide-and-seek?' },
      a: { fr: 'Parce qu’on les entend venir : bong, bong, bong !', en: 'Because you can hear them coming: bong, bong, bong!' },
    },
  },
  {
    id: '1.25.0-golem-neige', day: 7, date: '2026-11-26', emoji: '⛄', show: 'snowgolem',
    title: { fr: 'Bataille de boules de neige !', en: 'Snowball fight!' },
    text: {
      fr: 'Dans la montagne, un golem de neige veut jouer : il s’appelle Flocon ! Évite ses boules de neige et renvoie-lui les tiennes avec le bouton ❄️. Ensuite, construis ton propre bonhomme de neige !',
      en: 'On the mountain, a snow golem wants to play: his name is Flake! Dodge his snowballs and throw yours back with the ❄️ button. Then, build your very own snowman!',
    },
    riddle: {
      q: { fr: 'Quel est le plat préféré du bonhomme de neige ?', en: 'What is a snowman’s favourite food?' },
      a: { fr: 'Les frites… bien glacées !', en: 'Chilli… very, very chilly!' },
    },
  },
  {
    // (v1.26.1: the mine became a world of its own, with barriers to spell; a new id so the card shows again.)
    id: '1.26.1-wagonnet', day: 8, date: '2026-11-27', emoji: '🛒', show: 'minecart',
    title: { fr: 'Le wagonnet de la mine', en: 'The mine cart' },
    text: {
      fr: 'Monte dans le wagonnet : il t’emmène sous la terre, dans la mine ! Il roule tout seul ; devant chaque barrière, épelle le mot pour l’ouvrir. Au bout, le trésor de diamants ! Attention aux chauves-souris… et accroche-toi bien !',
      en: 'Get in the mine cart: it takes you down under the ground, into the mine! It rides on its own; at each barrier, spell the word to open it. At the end, the diamond treasure! Watch out for the bats… and hold on tight!',
    },
    riddle: {
      q: { fr: 'Qu’est-ce qui a des dents mais ne mord jamais ?', en: 'What has teeth but never bites?' },
      a: { fr: 'Un peigne !', en: 'A comb!' },
    },
  },
  {
    // v1.26.3: a bonus world, the parent's pick (the Moon).
    id: '1.26.3-lune', day: 8, date: '2026-11-27', emoji: '🚀', show: 'rocket',
    title: { fr: 'La fusée pour la Lune', en: 'The rocket to the Moon' },
    text: {
      fr: 'À côté de la tour d’Alaric, une fusée attend ! Épelle le mot pour allumer les moteurs : trois, deux, un… Décollage ! Sur la Lune, on saute très très haut. Aide Bip, le petit robot, attrape les étoiles tombées et plante le drapeau de l’Empire !',
      en: 'Next to Alaric’s tower, a rocket is waiting! Spell the word to start the engines: three, two, one… Lift-off! On the Moon, you jump really, really high. Help Bip the little robot, catch the fallen stars and plant the flag of the Empire!',
    },
    riddle: {
      q: { fr: 'Je suis ronde et blanche, je brille la nuit, mais je ne suis pas une lampe. Qui suis-je ?', en: 'I am round and white, I shine at night, but I am not a lamp. What am I?' },
      a: { fr: 'La Lune !', en: 'The Moon!' },
    },
  },
];
