// "Le village qui oubliait ses mots": chapters, objectives and dialogue (French first;
// English falls back to the French text for now).

// Who speaks: portrait and name.
export const SPEAKERS = {
  narrator: { emoji: '📜', name: { fr: 'Le conteur', en: 'Storyteller' } },
  mage: { emoji: '🧙', name: { fr: 'Alaric le mage', en: 'Alaric the mage' } },
  choice: { emoji: '💭', name: { fr: 'À toi de choisir', en: 'Your choice' } },
  mimot: { emoji: '🐣', name: { fr: 'Le Mimot', en: 'The Mimot' } },
  page: { emoji: '📄', name: { fr: 'La page arrachée', en: 'The torn page' } },
  forester: { emoji: '🪓', name: { fr: 'Sylvain le forestier', en: 'Sylvain the forester' } },
  fisher: { emoji: '🎣', name: { fr: 'Mélusine la pêcheuse', en: 'Mélusine the fisher' } },
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
    ['narrator', 'D’autres Mimots se cachent dans le village. Et à l’ouest, la forêt des sapins t’attend !'],
    ['narrator', 'Suis le chemin vers l’ouest, jusqu’au panneau de la forêt.'],
  ],
  forestSign: [
    ['narrator', 'Le panneau de la forêt est réparé ! Tu pourras revenir ici d’un coup, depuis le panneau du village.'],
    ['narrator', 'Mais la rivière coupe le chemin… Un cercle magique brille au bord de l’eau.'],
  ],
  forestBridge: [
    ['narrator', 'Le pont est là ! De l’autre côté, une cabane fume au milieu des sapins.'],
  ],
  forester: [
    ['forester', 'Oh, un visiteur ! Je suis Sylvain, le forestier.'],
    ['forester', 'Depuis quelques jours, j’oublie les mots de ma chanson… et deux Mimots se sont sauvés dans les bois.'],
    ['forester', 'Si tu les apprivoises, la chanson me reviendra peut-être !'],
  ],
  foresterIdle: [
    ['forester', 'Les sapins sentent bon aujourd’hui. Bonne promenade !'],
  ],
  forestMimots: [
    ['forester', 'La, la, la… Ma chanson revient ! Merci !'],
    ['forester', 'Tiens, j’ai trouvé une page près de la souche, au milieu de la clairière. Va voir !'],
  ],
  page2: [
    ['page', '« … maison, école, ami, bateau… Ma tête oublie de plus en plus. Le grand livre, lui, se souviendra. A. »'],
    ['narrator', 'Encore cette écriture penchée… et ce « A » à la fin.'],
    ['narrator', 'À l’est du village, il y a le marais. Peut-être d’autres pages s’y cachent ?'],
  ],
  marshSign: [
    ['narrator', 'Le panneau du marais est réparé ! Mais une brume épaisse cache le chemin.'],
    ['narrator', 'Ton grimoire s’est rempli d’un nouveau sort : le Vent ! Un cercle magique attend devant la brume.'],
  ],
  marshFog: [
    ['narrator', 'Whoosh ! La brume s’envole. Une passerelle de bois traverse le marais.'],
  ],
  fisher: [
    ['fisher', 'Bonjour, petit sorcier ! Moi, c’est Mélusine.'],
    ['fisher', 'La nuit, je ne vois plus mes filets : les lanternes se sont éteintes quand les mots sont partis.'],
    ['fisher', 'Tu connais le sort du Feu ? Il y a un cercle au début de la passerelle.'],
  ],
  fisherIdle: [
    ['fisher', 'Les grenouilles chantent faux ce soir… Ha ha !'],
  ],
  marshFire: [
    ['fisher', 'Mes lanternes ! Merci ! Deux Mimots se cachent dans les roseaux : ils ont peur du noir.'],
  ],
  marshMimots: [
    ['fisher', 'Tu les as trouvés ! Et regarde : une page flottait au bout de la passerelle.'],
  ],
  page3: [
    ['page', '« … Gaspard, Rosa, Lili, la fontaine… Je ne veux oublier personne. Alors j’emprunte les mots, un par un, et je les range dans mon livre. Alaric. »'],
    ['narrator', 'Alaric ! C’est lui qui a écrit toutes ces pages…'],
    ['narrator', 'Le vieux mage perd la mémoire. Il prend les mots du village pour ne pas les oublier.'],
    ['narrator', 'Il n’est pas méchant : il a peur. Il faut l’aider… Sa tour est en haut de la montagne, au nord.'],
  ],
  mountainSign: [
    ['narrator', 'Le panneau de la montagne est réparé ! Tout en haut, on voit le toit violet de la tour d’Alaric.'],
    ['narrator', 'Une falaise entoure le sommet… Ton grimoire connaît un nouveau sort : la Pierre !'],
  ],
  mountainStairs: [
    ['narrator', 'Crac, crac, crac ! Un escalier de pierre monte jusqu’au sommet.'],
    ['narrator', 'Deux Mimots jouent dans la neige, là-haut.'],
  ],
  mountainMimots: [
    ['narrator', 'Les Mimots de la montagne sont apprivoisés. Sous le toit de la tour, un grand livre brille…'],
  ],
  readBook: [
    ['narrator', 'Le grand livre est ouvert. Ses pages bougent toutes seules… Des petits Mimots courent entre les lignes !'],
    ['mage', 'Tu as trouvé mon livre… Je suis désolé, mon petit.'],
    ['mage', 'J’oublie tout : les noms, les chemins, même le mot « fontaine ». Alors j’ai rangé les mots ici, pour les garder.'],
    ['mage', 'Mais dans le livre, les mots sont devenus vivants. Ils sont heureux ensemble… et le village s’est vidé.'],
    ['mage', 'Une page du livre s’est envolée jusqu’à la mer. Les derniers Mimots s’y cachent. Viens, je t’attendrai là-bas.'],
  ],
  coastSign: [
    ['narrator', 'Le panneau de la plage est réparé ! Le phare est éteint, et la mer est sombre.'],
    ['narrator', 'Le sort de Lumière pourrait rallumer le phare…'],
  ],
  lighthouse: [
    ['narrator', 'Le phare brille ! Sa lumière montre une île étrange, toute blanche, couverte de lettres : la page du livre !'],
    ['narrator', 'Un ponton s’avance vers elle. Il manque juste un pont…'],
  ],
  islandBridge: [
    ['narrator', 'Un pont mène à l’île de papier. Trois Mimots de papier y jouent à cache-cache.'],
  ],
  bookMimots: [
    ['narrator', 'Les trois Mimots de papier sont apprivoisés ! Alaric t’attend sur l’île.'],
  ],
  finale: [
    ['mage', 'Tu as rendu leur vie à tous ces mots… Tu es un vrai magicien des mots.'],
    ['mage', 'Mais moi, comment vais-je me souvenir, sans mon livre ?'],
    ['narrator', 'Tu regardes ton album des mots. Il est plein de mots que tu as écrits toi-même…'],
    ['choice', 'Que proposes-tu à Alaric ?', [
      { label: { fr: '📖 Rendre tous les mots au village, et lui prêter ton album', en: '📖 Give every word back, and lend him your album' }, scene: 'endGive' },
      { label: { fr: '✨ Garder quelques mots dans le livre, pour les Mimots', en: '✨ Keep a few words in the book, for the Mimots' }, scene: 'endKeep' },
    ]],
  ],
  endGive: [
    ['mage', 'Ton album ? Pour moi ? Quand j’oublierai un mot, je le relirai ici… Merci !'],
    ['narrator', 'Les mots s’envolent du livre et retournent au village. Les panneaux brillent, les maisons chantent.'],
    ['narrator', 'Et chaque soir, Alaric relit ton album, en souriant.'],
  ],
  endKeep: [
    ['mage', 'Quelques mots resteront dans le livre, avec les Mimots. Et toi, tu m’apprendras les autres.'],
    ['narrator', 'Le livre garde une page pour les Mimots, et les autres mots rentrent au village.'],
    ['narrator', 'Chaque soir, Alaric relit ton album, en souriant.'],
  ],
  ending: [
    ['narrator', 'Fin de l’histoire… mais pas des mots ! Il reste des Mimots, des sorts et des trésors partout.'],
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
      { id: 'forestSign', text: { fr: 'Va à l’ouest et répare le panneau de la forêt 🪧', en: 'Go west and fix the forest sign 🪧' } },
      { id: 'forestBridge', text: { fr: 'Lance le sort Pont sur la rivière 🌉', en: 'Cast the Bridge spell over the river 🌉' } },
      { id: 'forester', text: { fr: 'Parle à Sylvain le forestier 🪓', en: 'Talk to Sylvain the forester 🪓' } },
      { id: 'forestMimots', count: 2, countFrom: 'forest', text: { fr: 'Apprivoise les 2 Mimots de la forêt 🐣', en: 'Tame the 2 forest Mimots 🐣' } },
      { id: 'page2', text: { fr: 'Ramasse la page dans la clairière 📄', en: 'Pick up the page in the clearing 📄' } },
    ],
  },
  {
    id: 3,
    title: { fr: 'Chapitre 3 · Le marais', en: 'Chapter 3 · The marsh' },
    objectives: [
      { id: 'marshSign', text: { fr: 'Va à l’est et répare le panneau du marais 🪧', en: 'Go east and fix the marsh sign 🪧' } },
      { id: 'marshFog', text: { fr: 'Chasse la brume avec le sort Vent 🌬️', en: 'Blow the mist away with the Wind spell 🌬️' } },
      { id: 'fisher', text: { fr: 'Parle à Mélusine la pêcheuse 🎣', en: 'Talk to Mélusine the fisher 🎣' } },
      { id: 'marshFire', text: { fr: 'Rallume les lanternes avec le sort Feu 🔥', en: 'Light the lanterns with the Fire spell 🔥' } },
      { id: 'marshMimots', count: 2, countFrom: 'marsh', text: { fr: 'Apprivoise les 2 Mimots du marais 🐣', en: 'Tame the 2 marsh Mimots 🐣' } },
      { id: 'page3', text: { fr: 'Ramasse la page au bout de la passerelle 📄', en: 'Pick up the page at the end of the boardwalk 📄' } },
    ],
  },
  {
    id: 4,
    title: { fr: 'Chapitre 4 · La montagne', en: 'Chapter 4 · The mountains' },
    objectives: [
      { id: 'mountainSign', text: { fr: 'Va au nord et répare le panneau de la montagne 🪧', en: 'Go north and fix the mountain sign 🪧' } },
      { id: 'mountainStairs', text: { fr: 'Lance le sort Pierre au pied de la falaise 🪨', en: 'Cast the Stone spell below the cliff 🪨' } },
      { id: 'mountainMimots', count: 2, countFrom: 'mountain', text: { fr: 'Apprivoise les 2 Mimots de la neige 🐣', en: 'Tame the 2 snow Mimots 🐣' } },
      { id: 'readBook', text: { fr: 'Lis le grand livre sous la tour d’Alaric 📖', en: 'Read the big book under Alaric’s tower 📖' } },
    ],
  },
  {
    id: 5,
    title: { fr: 'Chapitre 5 · La page envolée', en: 'Chapter 5 · The page that flew away' },
    objectives: [
      { id: 'coastSign', text: { fr: 'Va au sud et répare le panneau de la plage 🪧', en: 'Go south and fix the beach sign 🪧' } },
      { id: 'lighthouse', text: { fr: 'Rallume le phare avec le sort Lumière ✨', en: 'Light the lighthouse with the Light spell ✨' } },
      { id: 'islandBridge', text: { fr: 'Lance le sort Pont au début du ponton 🌉', en: 'Cast the Bridge spell at the start of the pier 🌉' } },
      { id: 'bookMimots', count: 3, countFrom: 'book', text: { fr: 'Apprivoise les 3 Mimots de papier 🐣', en: 'Tame the 3 paper Mimots 🐣' } },
      { id: 'finale', text: { fr: 'Parle à Alaric sur l’île de papier 🧙', en: 'Talk to Alaric on the paper island 🧙' } },
    ],
  },
  {
    id: 6,
    title: { fr: 'Épilogue · Le village des mots', en: 'Epilogue · The village of words' },
    objectives: [
      { id: 'free', text: { fr: 'Bravo ! Trouve tous les Mimots et deviens maître des mots ⭐', en: 'Well done! Find every Mimot and become a word master ⭐' } },
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
  { id: 'fontaine', x: 3.2, z: -3, color: 0xffc94a, story: 'mimot' },
  { id: 'mare', x: -11, z: -21, color: 0x7ad0ff },
  { id: 'champ', x: 4, z: 18.5, color: 0xff8ab0 },
  { id: 'carriere', x: 17, z: -12, color: 0xb08aff },
  { id: 'foret1', x: -70, z: 9, color: 0x9ae06a, region: 'forest', after: 'forester' },
  { id: 'foret2', x: -63, z: -11, color: 0xffa04a, region: 'forest', after: 'forester' },
  { id: 'marais1', x: 64, z: 11, color: 0x6ad8c8, region: 'marsh', after: 'marshFire' },
  { id: 'marais2', x: 72, z: -9.5, color: 0xd88aff, region: 'marsh', after: 'marshFire' },
  { id: 'neige1', x: -3, z: -66, color: 0xd8f0ff, region: 'mountain', after: 'mountainStairs', y: 4.5 },
  { id: 'neige2', x: 3.5, z: -64, color: 0xffd8e8, region: 'mountain', after: 'mountainStairs', y: 4.5 },
  { id: 'papier1', x: 12, z: 74, color: 0xf6f0e0, region: 'book', after: 'islandBridge', y: 0.32, roam: 1.2 },
  { id: 'papier2', x: 14.5, z: 75.5, color: 0xf0eadc, region: 'book', after: 'islandBridge', y: 0.32, roam: 1.2 },
  { id: 'papier3', x: 13, z: 76.6, color: 0xfaf6ec, region: 'book', after: 'islandBridge', y: 0.32, roam: 1.0 },
];
// Torn pages: one per chapter, shown when the story reaches them.
export const PAGES = [
  { id: 'page', x: 2.2, z: -2.2, scene: 'page1' },
  { id: 'page2', x: -68, z: 4, scene: 'page2' },
  { id: 'page3', x: 75.5, z: 0, scene: 'page3', y: 0.22 },
];
export const PAGE_SPOT = PAGES[0];
// Villagers out in the regions.
export const REGION_NPCS = [
  { id: 'forester', spec: 'forester', x: -66.5, z: -2.6, ry: 0.8 },
  { id: 'fisher', spec: 'fisher', x: 58, z: 1.6, ry: Math.PI, y: 0.22 },
  { id: 'alaricTower', spec: 'mage', x: 1.8, z: -68.4, ry: -0.8 },
  { id: 'alaricIsland', spec: 'mage', x: 14.2, z: 76.2, ry: Math.PI + 0.6, y: 0.32 },
];
