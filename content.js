// Game content: villagers and their quests, treasure chest loot, and the picture on each album card.

export const NPC_INFO = {
  barkeep: { emoji: '🧔', name: { fr: 'Gaspard le tavernier', en: 'Gaspard the innkeeper' } },
  patron: { emoji: '👧', name: { fr: 'Lili', en: 'Lili' } },
  mage: { emoji: '🧙', name: { fr: 'Alaric le mage', en: 'Alaric the mage' } },
  merchant: { emoji: '👩', name: { fr: 'Rosa la marchande', en: 'Rosa the merchant' } },
  guard: { emoji: '💂', name: { fr: 'Bastien le garde', en: 'Bastien the guard' } },
  forester: { emoji: '🪓', name: { fr: 'Sylvain le forestier', en: 'Sylvain the forester' } },
  fisher: { emoji: '🎣', name: { fr: 'Mélusine la pêcheuse', en: 'Mélusine the fisher' } },
  alaricTower: { emoji: '🧙', name: { fr: 'Alaric le mage', en: 'Alaric the mage' } },
  alaricIsland: { emoji: '🧙', name: { fr: 'Alaric le mage', en: 'Alaric the mage' } },
};

// Two quests per villager. `need` is materials to hand over, an object you must have crafted,
// or something you must have done. Rewards: stars, materials and/or a costume.
export const QUESTS = {
  barkeep: [
    {
      need: { materials: { wheat: 3, fish: 1 } }, reward: { stars: 15, costume: 'cook' },
      text: { fr: 'Ma cuisine est vide ! Apporte-moi 3 blés et 1 poisson, et je te donne ma toque de cuisinier.', en: 'My kitchen is empty! Bring me 3 wheat and 1 fish, and my chef’s hat is yours.' },
      thanks: { fr: 'Merci ! Ça sent déjà bon. Voici ta toque !', en: 'Thank you! It already smells good. Here’s your hat!' },
    },
    {
      need: { materials: { mushroom: 2 } }, reward: { stars: 20, materials: { diamond: 1 } },
      text: { fr: 'Mes clients rêvent de soupe aux champignons lumineux. On les trouve seulement la nuit… Rapporte-m’en 2 !', en: 'My guests dream of glowing-mushroom soup. They only come out at night… Bring me 2!' },
      thanks: { fr: 'Magnifique ! Prends ce diamant que j’ai trouvé dans la cave.', en: 'Wonderful! Take this diamond I found in the cellar.' },
    },
  ],
  patron: [
    {
      need: { materials: { flower: 3 } }, reward: { stars: 10, costume: 'flower' },
      text: { fr: 'C’est l’anniversaire de ma maman. Tu peux m’apporter 3 fleurs pour un bouquet ?', en: 'It’s my mum’s birthday. Could you bring me 3 flowers for a bouquet?' },
      thanks: { fr: 'Elles sont belles ! Tiens, une couronne de fleurs pour toi.', en: 'They’re beautiful! Here, a flower crown for you.' },
    },
    {
      need: { materials: { fish: 2 } }, reward: { stars: 20 },
      text: { fr: 'Tu sais pêcher ? Rapporte-moi 2 poissons de la mare, s’il te plaît !', en: 'Can you fish? Please bring me 2 fish from the pond!' },
      thanks: { fr: 'Super, on va faire un pique-nique !', en: 'Great, we’ll have a picnic!' },
    },
  ],
  mage: [
    {
      need: { materials: { crystal: 2, flower: 2 } }, reward: { stars: 15, materials: { obsidian: 2 } },
      text: { fr: 'Mes potions manquent de magie. Apporte-moi 2 cristaux et 2 fleurs.', en: 'My potions need more magic. Bring me 2 crystals and 2 flowers.' },
      thanks: { fr: 'Parfait ! Voici deux blocs d’obsidienne, très rares.', en: 'Perfect! Here are two very rare obsidian blocks.' },
    },
    {
      need: { crafted: 'wand' }, reward: { stars: 25, costume: 'wizard' },
      text: { fr: 'Un vrai sorcier a besoin d’une baguette. Fabrique-en une et reviens me la montrer !', en: 'A true wizard needs a wand. Craft one and come back to show me!' },
      thanks: { fr: 'Quelle belle baguette ! Tu mérites la robe de sorcier.', en: 'What a fine wand! You deserve the wizard’s robe.' },
    },
  ],
  merchant: [
    {
      need: { materials: { cloth: 3 } }, reward: { stars: 10, materials: { diamond: 1 } },
      text: { fr: 'J’ai besoin de toile pour coudre mes sacs : 3 toiles, s’il te plaît.', en: 'I need cloth to sew my bags: 3 cloth, please.' },
      thanks: { fr: 'Merci ! Voici un diamant pour ta peine.', en: 'Thanks! Here’s a diamond for your trouble.' },
    },
    {
      need: { stat: { chests: 1 } }, reward: { stars: 15, costume: 'pirate' },
      text: { fr: 'On dit que des coffres au trésor sont cachés dans les collines… Ouvre-en un et je te donne un costume de pirate !', en: 'They say treasure chests are hidden in the hills… Open one and I’ll give you a pirate costume!' },
      thanks: { fr: 'Un vrai chasseur de trésor ! Voici ton costume.', en: 'A real treasure hunter! Here’s your costume.' },
    },
  ],
  guard: [
    {
      need: { materials: { stone: 4 } }, reward: { stars: 15, costume: 'knight' },
      text: { fr: 'Le mur du village a des trous. Apporte-moi 4 pierres pour le réparer.', en: 'The village wall has holes. Bring me 4 stones to fix it.' },
      thanks: { fr: 'Bravo ! Tu as le courage d’un chevalier. Prends cette armure.', en: 'Well done! You have a knight’s courage. Take this armour.' },
    },
    {
      need: { crafted: 'sword_diamond' }, reward: { stars: 40, costume: 'king' },
      text: { fr: 'Seul un héros avec une épée en diamant peut porter la couronne. Montre-moi la tienne !', en: 'Only a hero with a diamond sword may wear the crown. Show me yours!' },
      thanks: { fr: 'Incroyable ! Le village te couronne. Vive le roi… ou la reine !', en: 'Amazing! The village crowns you. Long live the king… or queen!' },
    },
  ],
};

// What can be inside a treasure chest (weights).
export const LOOT = [
  // Basic materials (most common), so a chest always helps with the next recipe.
  { w: 4, materials: { wood: 3 } },
  { w: 3, materials: { stone: 2, iron: 1 } },
  { w: 3, materials: { wheat: 2, water: 1 } },
  { w: 3, materials: { fire: 2, wood: 1 } },
  { w: 2, materials: { flower: 2, cloth: 1 } },
  // Rare finds.
  { w: 3, materials: { diamond: 1 } },
  { w: 2, materials: { obsidian: 1 } },
  { w: 3, materials: { crystal: 2 } },
  { w: 3, materials: { cloth: 2 } },
  { w: 3, materials: { iron: 3 } },
  { w: 2, stars: 12 },
  { w: 2, materials: { mushroom: 1, fish: 1 } },
];

export function rollLoot() {
  const total = LOOT.reduce((n, l) => n + l.w, 0);
  let r = Math.random() * total;
  for (const l of LOOT) { r -= l.w; if (r <= 0) return l; }
  return LOOT[0];
}

// Picture for each word card in the album.
export const WORD_EMOJI = {
  fr: {
    ami: '🤝', papa: '👨', vélo: '🚲', moto: '🏍️', radio: '📻', piano: '🎹', lavabo: '🚰', domino: '🎲', judo: '🥋', café: '☕',
    bébé: '👶', télé: '📺', numéro: '🔢', zéro: '0️⃣', midi: '🕛', mardi: '📅', samedi: '🛍️', animal: '🐾', canari: '🐤', sofa: '🛋️',
    tomate: '🍅', pirate: '🏴‍☠️', salade: '🥗', banane: '🍌', cabane: '🛖', école: '🏫', table: '🍽️', livre: '📖', arbre: '🌳', porte: '🚪',
    chemin: '🛤️', chat: '🐱', cheval: '🐴', vache: '🐄', chaise: '🪑', mouton: '🐑', loup: '🐺', poule: '🐔', soupe: '🍲', route: '🛣️',
    cochon: '🐷', savon: '🧼', bonbon: '🍬', melon: '🍈', enfant: '🧒', maman: '👩', lampe: '💡', pantalon: '👖', dimanche: '☀️',
    jardin: '🌻', lapin: '🐰', matin: '🌅', sapin: '🎄', pain: '🥖', main: '✋', bain: '🛁', plein: '🥛', peinture: '🎨',
    bateau: '⛵', auto: '🚗', chapeau: '🎩', cadeau: '🎁', château: '🏰', gâteau: '🎂', voiture: '🚙', roi: '🤴', étoile: '⭐', poire: '🍐',
    armoire: '🗄️', montagne: '⛰️', champignon: '🍄', campagne: '🌾', ligne: '📏',
    escargot: '🐌', éléphant: '🐘', papillon: '🦋', grenouille: '🐸', poisson: '🐟', oiseau: '🐦', maison: '🏠', chocolat: '🍫', citron: '🍋', girafe: '🦒',
    hibou: '🦉', feuille: '🍂', abeille: '🐝', perroquet: '🦜', écureuil: '🐿️', hérisson: '🦔', fraise: '🍓', cerise: '🍒', framboise: '🫐', parapluie: '☂️', cinéma: '🎬',
  },
  en: {
    cat: '🐱', dog: '🐶', sun: '☀️', big: '🐘', run: '🏃', hat: '🎩', red: '🔴', bed: '🛏️', map: '🗺️', win: '🏆',
    top: '🔝', box: '📦', pen: '🖊️', cup: '☕', bus: '🚌', leg: '🦵', pig: '🐷', hot: '🔥', sit: '🪑', yes: '👍',
    cake: '🎂', bike: '🚲', home: '🏠', cube: '🧊', time: '⏰', name: '📛', like: '❤️', make: '🔨', came: '🚶', five: '5️⃣',
    game: '🎮', lake: '🏞️', nose: '👃', rope: '🪢', tube: '🧪', kite: '🪁', bone: '🦴', ride: '🐎', smile: '😊', plane: '✈️',
    because: '💭', would: '🙋', could: '🤔', friend: '🤝', their: '👪', through: '🚇', always: '♾️', beautiful: '🌈', people: '👥', school: '🏫',
    laugh: '😂', enough: '✋', said: '💬', again: '🔁', water: '💧', colour: '🎨', island: '🏝️', knight: '🛡️', castle: '🏰', tomorrow: '📅',
  },
};
