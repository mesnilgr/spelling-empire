// The collection album (J4): the book opens already filled with what the child has met (from the
// save), and every new sticker is stuck by spelling its name (MOUTON, CHEVAL…). Missing cards are
// "???" silhouettes with a hint read aloud. Session 1: the animals and places pages (goal: 3 new
// stickers). Session 2 (part 2 of J4): the bosses, crafted objects, Mimots and Cocotte's feathers
// pages, and a 6-card "discovery page" around the village that gives the first outfit.
// Every sticker makes its noise when touched; golden stickers (1 chance in 20 when walking past an
// animal) shine. The album stand (a wooden lectern with the big open book) is next to the cottage.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const ALBUM_STAND = { x: 0.4, z: 21.2 };
export const ALBUM_GOAL1 = 3; // new stickers in session 1
export const GOLD_CHANCE = 1 / 20;

// Animals: `kinds` = the fauna kinds that count as this card (the four sheep colours are one sheep).
export const ALBUM_ANIMALS = [
  { id: 'sheep', kinds: ['sheep', 'sheepBlack', 'sheepBrown', 'sheepPink'], emoji: '🐑', word: { fr: 'mouton', en: 'sheep' }, sound: { fr: 'Bêê !', en: 'Baa!' }, hint: { fr: 'Il fait « Bêê » et il a plein de laine.', en: 'It says “Baa” and it is full of wool.' } },
  { id: 'lamb', kinds: ['lamb'], emoji: '🐑', word: { fr: 'agneau', en: 'lamb' }, sound: { fr: 'Bêêê !', en: 'Baa!' }, hint: { fr: 'C’est le bébé du mouton.', en: 'It is the baby sheep.' } },
  { id: 'cow', kinds: ['cow'], emoji: '🐄', word: { fr: 'vache', en: 'cow' }, sound: { fr: 'Meuh !', en: 'Moo!' }, hint: { fr: 'Elle fait « Meuh » et elle donne du lait.', en: 'It says “Moo” and gives milk.' } },
  { id: 'pig', kinds: ['pig'], emoji: '🐷', word: { fr: 'cochon', en: 'pig' }, sound: { fr: 'Groin groin !', en: 'Oink!' }, hint: { fr: 'Il est tout rose et il adore la boue.', en: 'It is all pink and loves mud.' } },
  { id: 'chicken', kinds: ['chicken'], emoji: '🐔', word: { fr: 'poule', en: 'hen' }, sound: { fr: 'Cot cot !', en: 'Cluck!' }, hint: { fr: 'Elle pond des œufs.', en: 'She lays eggs.' } },
  { id: 'cat', kinds: ['cat'], emoji: '🐱', word: { fr: 'chat', en: 'cat' }, sound: { fr: 'Miaou !', en: 'Meow!' }, hint: { fr: 'Il fait « Miaou » et il se promène au village.', en: 'It says “Meow” and walks around the village.' } },
  { id: 'dog', pet: true, emoji: '🐶', word: { fr: 'chien', en: 'dog' }, sound: { fr: 'Ouaf !', en: 'Woof!' }, hint: { fr: 'Un petit chiot attend un ami, quelque part…', en: 'A little puppy is waiting for a friend, somewhere…' } },
  { id: 'horse', horse: true, emoji: '🐴', word: { fr: 'cheval', en: 'horse' }, sound: { fr: 'Hiiii !', en: 'Neigh!' }, hint: { fr: 'On peut monter sur son dos et galoper.', en: 'You can ride on its back and gallop.' } },
  { id: 'rabbit', kinds: ['rabbit'], emoji: '🐰', word: { fr: 'lapin', en: 'rabbit' }, sound: { fr: 'Hop !', en: 'Hop!' }, hint: { fr: 'Il a de grandes oreilles et il saute dans la prairie.', en: 'It has long ears and hops in the meadow.' } },
  { id: 'fox', kinds: ['fox'], emoji: '🦊', word: { fr: 'renard', en: 'fox' }, sound: { fr: 'Yip !', en: 'Yip!' }, hint: { fr: 'Il est orange et il se cache dans la forêt.', en: 'It is orange and hides in the forest.' } },
  { id: 'wolf', kinds: ['wolf'], emoji: '🐺', word: { fr: 'loup', en: 'wolf' }, sound: { fr: 'Aouuuh !', en: 'Awooo!' }, hint: { fr: 'Il hurle à la lune, dans la forêt.', en: 'It howls at the moon, in the forest.' } },
  { id: 'panda', kinds: ['panda'], emoji: '🐼', word: { fr: 'panda', en: 'panda' }, sound: { fr: 'Grrmf !', en: 'Hmmf!' }, hint: { fr: 'Il est noir et blanc, près de la prairie.', en: 'It is black and white, near the meadow.' } },
  { id: 'frog', kinds: ['frog'], emoji: '🐸', word: { fr: 'grenouille', en: 'frog' }, sound: { fr: 'Croâ !', en: 'Ribbit!' }, hint: { fr: 'Elle est verte et fait « Croâ » dans le marais.', en: 'It is green and says “Ribbit” in the marsh.' } },
  { id: 'duck', kinds: ['duck'], emoji: '🦆', word: { fr: 'canard', en: 'duck' }, sound: { fr: 'Coin coin !', en: 'Quack!' }, hint: { fr: 'Il nage dans le marais et fait « Coin coin ».', en: 'It swims in the marsh and says “Quack”.' } },
  { id: 'goat', kinds: ['goat'], emoji: '🐐', word: { fr: 'chèvre', en: 'goat' }, sound: { fr: 'Bêêê !', en: 'Maa!' }, hint: { fr: 'Elle a des cornes et grimpe dans la montagne.', en: 'It has horns and climbs the mountain.' } },
  { id: 'llama', kinds: ['llama'], emoji: '🦙', word: { fr: 'lama', en: 'llama' }, sound: { fr: 'Mmmeh !', en: 'Mmmeh!' }, hint: { fr: 'Il a un très long cou, au pied de la montagne.', en: 'It has a very long neck, at the foot of the mountain.' } },
  { id: 'bear', kinds: ['polarBear'], emoji: '🐻‍❄️', word: { fr: 'ours', en: 'bear' }, sound: { fr: 'Grrr !', en: 'Grrr!' }, hint: { fr: 'Il est tout blanc, dans la neige.', en: 'It is all white, in the snow.' } },
  { id: 'crab', kinds: ['crab'], emoji: '🦀', word: { fr: 'crabe', en: 'crab' }, sound: { fr: 'Clac clac !', en: 'Snap snap!' }, hint: { fr: 'Il marche de côté sur la plage.', en: 'It walks sideways on the beach.' } },
  { id: 'turtle', kinds: ['turtle'], emoji: '🐢', word: { fr: 'tortue', en: 'turtle' }, sound: { fr: '…', en: '…' }, hint: { fr: 'Elle porte sa maison sur son dos.', en: 'It carries its house on its back.' } },
  { id: 'parrot', kinds: ['parrot'], emoji: '🦜', word: { fr: 'perroquet', en: 'parrot' }, sound: { fr: 'Coco !', en: 'Polly!' }, hint: { fr: 'Il a des plumes de toutes les couleurs, près de la plage.', en: 'It has feathers of every colour, near the beach.' } },
  { id: 'dolphin', kinds: ['dolphin'], emoji: '🐬', word: { fr: 'dauphin', en: 'dolphin' }, sound: { fr: 'Kikiki !', en: 'Eee-eee!' }, hint: { fr: 'Il saute hors de la mer.', en: 'It jumps out of the sea.' } },
  { id: 'squid', kinds: ['squid'], emoji: '🦑', word: { fr: 'calmar', en: 'squid' }, sound: { fr: 'Blub !', en: 'Blub!' }, hint: { fr: 'Il brille tout doucement sous la mer.', en: 'It glows softly under the sea.' } },
];
export const KIND_TO_CARD = Object.fromEntries(ALBUM_ANIMALS.flatMap((a) => (a.kinds ?? []).map((k) => [k, a.id])));

// The word stuck under each place (the place's full name is read when the card is touched).
export const PLACE_WORDS = {
  tower: { fr: 'tour', en: 'tower' }, camp: { fr: 'tente', en: 'tent' }, mine: { fr: 'mine', en: 'mine' },
  portal: { fr: 'portail', en: 'portal' }, farm: { fr: 'ferme', en: 'farm' }, windmill: { fr: 'moulin', en: 'mill' },
  meadow: { fr: 'abeille', en: 'bee' }, stones: { fr: 'pierre', en: 'stone' }, well: { fr: 'puits', en: 'well' },
  treehouse: { fr: 'cabane', en: 'hut' }, fairy: { fr: 'fée', en: 'fairy' }, witch: { fr: 'sorcière', en: 'witch' },
  wreck: { fr: 'bateau', en: 'ship' },
};
export const PLACE_HINTS = {
  tower: { fr: 'Une vieille tour cassée, du côté de la montagne.', en: 'An old broken tower, towards the mountain.' },
  camp: { fr: 'Des tentes et un feu de camp, loin derrière la tour.', en: 'Tents and a campfire, far behind the tower.' },
  mine: { fr: 'Un trou dans la roche, avec des rails.', en: 'A hole in the rock, with rails.' },
  portal: { fr: 'Un grand cadre violet qui s’allume, près du marais.', en: 'A big purple frame that lights up, near the marsh.' },
  farm: { fr: 'Des cochons et des vaches, au sud du village.', en: 'Pigs and cows, south of the village.' },
  windmill: { fr: 'Ses grandes ailes tournent avec le vent.', en: 'Its big sails turn in the wind.' },
  meadow: { fr: 'Des fleurs, des abeilles et des champignons géants.', en: 'Flowers, bees and giant mushrooms.' },
  stones: { fr: 'De grosses pierres debout, en rond.', en: 'Big standing stones, in a circle.' },
  well: { fr: 'Un vieux trou plein d’eau, avec un seau.', en: 'An old hole full of water, with a bucket.' },
  treehouse: { fr: 'Une petite maison tout en haut d’un arbre, dans la forêt.', en: 'A little house high up in a tree, in the forest.' },
  fairy: { fr: 'Un rond de champignons magiques.', en: 'A ring of magic mushrooms.' },
  witch: { fr: 'Une maison bizarre, après le marais.', en: 'A strange house, past the marsh.' },
  wreck: { fr: 'Un vieux bateau échoué sur la plage.', en: 'An old ship stuck on the beach.' },
};
export const BOSS_HINTS = {
  mossGolem: { fr: 'Il dort dans la forêt, couvert de mousse.', en: 'It sleeps in the forest, covered in moss.' },
  toadKing: { fr: 'Il porte une couronne, au fond du marais.', en: 'It wears a crown, deep in the marsh.' },
  stoneGolem: { fr: 'Il est tout en pierre, dans la montagne.', en: 'It is made of stone, in the mountain.' },
  kraken: { fr: 'Il a plein de bras et vit dans la mer.', en: 'It has lots of arms and lives in the sea.' },
};

// The discovery page (session 2): six things to find around the village, then spell.
// `at` = where to go (a fixed spot or the name of something that moves: 'golem', 'mage', a fauna kind).
export const DISCOVERY = [
  { id: 'golem', emoji: '🤖', at: 'golem', word: { fr: 'fer', en: 'iron' }, name: { fr: 'Fer, le golem', en: 'Iron the golem' }, hint: { fr: 'Le gardien du village fait le tour de la place.', en: 'The village guardian walks round the square.' } },
  { id: 'flame', emoji: '🔥', at: { x: -2.6, z: 17.5 }, word: { fr: 'feu', en: 'fire' }, name: { fr: 'Flammèche', en: 'Flammèche' }, hint: { fr: 'Une petite flamme vit dans la cheminée de ta chaumière.', en: 'A little flame lives in your cottage chimney.' } },
  { id: 'fountain', emoji: '⛲', at: { x: 0, z: 0 }, word: { fr: 'eau', en: 'water' }, name: { fr: 'la fontaine', en: 'the fountain' }, hint: { fr: 'Au milieu de la place, l’eau jaillit.', en: 'In the middle of the square, water splashes.' } },
  { id: 'mage', emoji: '🧙', at: 'mage', word: { fr: 'mage', en: 'mage' }, name: { fr: 'Alaric le mage', en: 'Alaric the mage' }, hint: { fr: 'Il a une grande barbe et un chapeau pointu.', en: 'He has a long beard and a pointy hat.' } },
  { id: 'cat', emoji: '🐈', at: 'cat', word: { fr: 'chat', en: 'cat' }, name: { fr: 'le chat du village', en: 'the village cat' }, hint: { fr: 'Il fait la sieste entre les maisons.', en: 'It naps between the houses.' } },
  { id: 'hen', emoji: '🐣', at: 'chicken', word: { fr: 'poule', en: 'hen' }, name: { fr: 'les poules', en: 'the hens' }, hint: { fr: 'Elles picorent derrière ta chaumière.', en: 'They peck behind your cottage.' } },
];

export const ATX = {
  fr: {
    title: 'Album de collection', standLabel: '📖 Album', short: 'Album',
    tabs: { animals: '🐾 Animaux', places: '🗺️ Lieux', bosses: '⚔️ Boss', objects: '🔨 Objets', mimots: '🐣 Mimots', feathers: '🪶 Plumes', disco: '🧭 Découverte' },
    pageNames: { animals: 'animaux', places: 'lieux', bosses: 'boss', objects: 'objets', mimots: 'Mimots', feathers: 'plumes', disco: 'découverte' },
    words: '📝 Mots', close: 'Fermer',
    welcome: (n, k) => `Voici ton album ! Il est déjà rempli de ${n} vignette${n > 1 ? 's' : ''}.${k ? ` Et ${k} nouvelle${k > 1 ? 's' : ''} vignette${k > 1 ? 's' : ''} t’attend${k > 1 ? 'ent' : ''} : touche-${k > 1 ? 'les' : 'la'} et épelle ${k > 1 ? 'leur' : 'son'} nom pour ${k > 1 ? 'les' : 'la'} coller !` : ''}`,
    toStick: '✨ À coller !', goldToStick: '✨ Dorée !', unknown: '???',
    stickTitle: 'Une vignette à coller !', stickInstr: (name) => `Épelle son nom pour coller la vignette ${name} !`,
    goldTitle: 'Une vignette dorée !', goldInstr: 'Épelle son nom pour coller la vignette dorée !',
    stuck: (e, w) => `Slurp… Plop ! ${e} La vignette « ${w} » est collée !`,
    stuckSay: (w) => `Slurp… plop ! La vignette ${w} est collée !`,
    goldStuck: (e, w) => `✨ Slurp… Plop ! ${e} La vignette DORÉE « ${w} » brille dans ton album !`,
    goldStuckSay: (w) => `Slurp… plop ! La vignette dorée ${w} brille dans ton album !`,
    lick: 'Slurp !',
    newCard: (e) => `📖 Nouvelle vignette à coller : ${e} ! Ouvre ton album 📖.`,
    newCardSay: 'Nouvelle vignette ! Ouvre ton album pour la coller.',
    goldFound: (e) => `✨ Waouh ! Une vignette DORÉE : ${e} ! Ouvre ton album 📖 pour la coller.`,
    goldFoundSay: 'Waouh ! Une vignette dorée ! Ouvre ton album pour la coller.',
    goal1: '🏅 Bravo ! 3 nouvelles vignettes ! +10 ★ Reviens plus tard : ton album aura de nouvelles pages !',
    partTwo: '📖 Ton album a de nouvelles pages : les boss, les objets, les Mimots, les plumes de Cocotte… et une page découverte !',
    discoNear: (e) => `🧭 Page découverte : tu as trouvé ${e} ! Va coller la vignette dans ton album 📖.`,
    discoNearSay: (n) => `Tu as trouvé ${n} ! Va coller la vignette dans ton album.`,
    discoDone: (c) => `🎉 Page découverte complète ! Tu gagnes un costume : ${c} ! Va le mettre dans la garde-robe 👕.`,
    discoDoneSay: (c) => `Page découverte complète ! Tu gagnes un costume : ${c} !`,
    discoDiamonds: '🎉 Page découverte complète ! Tu as déjà tous les costumes : voilà 3 diamants !',
    locked: '🔒 Cette page s’ouvre à ton prochain retour !',
    lockedSay: 'Cette page s’ouvre à ton prochain retour !',
    count: (n, k) => `${n} / ${k}`,
    lede: (n, g) => `${n} vignette${n > 1 ? 's' : ''}${g ? ` · ✨ ${g} dorée${g > 1 ? 's' : ''}` : ''}`,
    pageSay: (name, n, k) => `Page ${name} : ${n} vignette${n > 1 ? 's' : ''} sur ${k}.`,
    feather: (d) => `Plume du jour ${d}`,
    henWink: '😉', henCard: 'Psst !',
    name: 'Album', journalCount: (n, g, d) => `Vignettes : ${n}${g ? ` · dorées : ${g}` : ''}${d !== null ? ` · découverte : ${d}/6` : ''}`,
    journalGoal: (k) => `Objectif : 3 nouvelles vignettes (${Math.min(k, 3)}/3)`,
    letter: (L, w) => `La lettre ${L}… comme ${w}.`,
    noAlbumYet: 'Ton album t’attend à côté de ta chaumière !',
  },
  en: {
    title: 'Collection album', standLabel: '📖 Album', short: 'Album',
    tabs: { animals: '🐾 Animals', places: '🗺️ Places', bosses: '⚔️ Bosses', objects: '🔨 Objects', mimots: '🐣 Mimots', feathers: '🪶 Feathers', disco: '🧭 Discovery' },
    pageNames: { animals: 'animals', places: 'places', bosses: 'bosses', objects: 'objects', mimots: 'Mimots', feathers: 'feathers', disco: 'discovery' },
    words: '📝 Words', close: 'Close',
    welcome: (n, k) => `Here is your album! It already has ${n} sticker${n > 1 ? 's' : ''}.${k ? ` And ${k} new sticker${k > 1 ? 's are' : ' is'} waiting: touch ${k > 1 ? 'them' : 'it'} and spell the name to stick ${k > 1 ? 'them' : 'it'}!` : ''}`,
    toStick: '✨ Stick me!', goldToStick: '✨ Golden!', unknown: '???',
    stickTitle: 'A sticker to stick!', stickInstr: (name) => `Spell its name to stick the ${name} sticker!`,
    goldTitle: 'A golden sticker!', goldInstr: 'Spell its name to stick the golden sticker!',
    stuck: (e, w) => `Slurp… Pop! ${e} The “${w}” sticker is stuck!`,
    stuckSay: (w) => `Slurp… pop! The ${w} sticker is stuck!`,
    goldStuck: (e, w) => `✨ Slurp… Pop! ${e} The GOLDEN “${w}” sticker shines in your album!`,
    goldStuckSay: (w) => `Slurp… pop! The golden ${w} sticker shines in your album!`,
    lick: 'Slurp!',
    newCard: (e) => `📖 New sticker to stick: ${e}! Open your album 📖.`,
    newCardSay: 'New sticker! Open your album to stick it.',
    goldFound: (e) => `✨ Wow! A GOLDEN sticker: ${e}! Open your album 📖 to stick it.`,
    goldFoundSay: 'Wow! A golden sticker! Open your album to stick it.',
    goal1: '🏅 Well done! 3 new stickers! +10 ★ Come back later: your album will have new pages!',
    partTwo: '📖 Your album has new pages: bosses, objects, Mimots, Cocotte’s feathers… and a discovery page!',
    discoNear: (e) => `🧭 Discovery page: you found ${e}! Go and stick the sticker in your album 📖.`,
    discoNearSay: (n) => `You found ${n}! Go and stick the sticker in your album.`,
    discoDone: (c) => `🎉 Discovery page complete! You win an outfit: ${c}! Put it on in the wardrobe 👕.`,
    discoDoneSay: (c) => `Discovery page complete! You win an outfit: ${c}!`,
    discoDiamonds: '🎉 Discovery page complete! You already have every outfit: here are 3 diamonds!',
    locked: '🔒 This page opens next time you come back!',
    lockedSay: 'This page opens next time you come back!',
    count: (n, k) => `${n} / ${k}`,
    lede: (n, g) => `${n} sticker${n > 1 ? 's' : ''}${g ? ` · ✨ ${g} golden` : ''}`,
    pageSay: (name, n, k) => `${name} page: ${n} sticker${n > 1 ? 's' : ''} of ${k}.`,
    feather: (d) => `Feather of day ${d}`,
    henWink: '😉', henCard: 'Psst!',
    name: 'Album', journalCount: (n, g, d) => `Stickers: ${n}${g ? ` · golden: ${g}` : ''}${d !== null ? ` · discovery: ${d}/6` : ''}`,
    journalGoal: (k) => `Goal: 3 new stickers (${Math.min(k, 3)}/3)`,
    letter: (L, w) => `The letter ${L}… as in ${w}.`,
    noAlbumYet: 'Your album is waiting next to your cottage!',
  },
};

// The pages: part 1 = animals and places; part 2 adds the others.
export const PAGES1 = ['animals', 'places'];
export const PAGES2 = ['bosses', 'objects', 'mimots', 'feathers', 'disco'];

const MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 });
function merged(boxes) {
  const geos = boxes.map(([w, h, d, c, x, y, z, rx = 0]) => {
    const g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
    if (rx) g.rotateX(rx);
    g.translate(x, y, z);
    const col = new THREE.Color(c), n = g.attributes.position.count, arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b; }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    g.deleteAttribute('uv');
    return g;
  });
  const geo = mergeGeometries(geos);
  geos.forEach((g) => g.dispose());
  return geo;
}

// A wooden lectern with a big open book (one mesh), plus one page that flips (one more mesh).
export class AlbumStand {
  constructor(scene3D) {
    this.s = scene3D;
    const { x, z } = ALBUM_STAND;
    const y = scene3D.groundAt(x, z);
    const wood = 0x8a5a32, dark = 0x5e3a1e, cover = 0xb8322a, page = 0xfbf4e0, gold = 0xf2c84b, tilt = 0.45;
    this.mesh = new THREE.Mesh(merged([
      [0.7, 0.12, 0.6, dark, 0, 0.06, 0], // foot
      [0.18, 1.0, 0.18, wood, 0, 0.6, 0], // post
      [1.0, 0.08, 0.7, wood, 0, 1.12, 0, tilt], // slanted top
      [0.12, 0.1, 0.72, dark, 0, 1.18, 0.0, tilt], // book spine
      [0.48, 0.05, 0.64, cover, -0.25, 1.2, 0, tilt], [0.48, 0.05, 0.64, cover, 0.25, 1.2, 0, tilt], // covers
      [0.44, 0.04, 0.58, page, -0.24, 1.24, 0, tilt], [0.44, 0.04, 0.58, page, 0.24, 1.24, 0, tilt], // pages
      [0.12, 0.12, 0.02, 0x7ac0ff, -0.3, 1.29, 0.05, tilt], [0.12, 0.12, 0.02, 0xff9ac0, -0.14, 1.29, 0.05, tilt], // little pictures
      [0.12, 0.12, 0.02, 0x9ae06a, 0.18, 1.29, 0.05, tilt], [0.12, 0.12, 0.02, gold, 0.34, 1.29, 0.05, tilt],
      [0.04, 0.02, 0.5, gold, 0.02, 1.27, -0.1, tilt], // ribbon
    ]), MAT);
    this.mesh.position.set(x, y, z);
    this.mesh.castShadow = true;
    this.mesh.userData.dynamic = true;
    scene3D.scene.add(this.mesh);
    // The flipping page: hinged on the spine.
    this.pageGeo = merged([[0.44, 0.02, 0.58, page, 0.22, 0, 0]]);
    this.page = new THREE.Mesh(this.pageGeo, MAT);
    this.page.userData.dynamic = true;
    this.hinge = new THREE.Group();
    this.hinge.userData.dynamic = true;
    this.hinge.position.set(x, y + 1.27, z);
    this.hinge.rotation.x = tilt;
    this.hinge.add(this.page);
    scene3D.scene.add(this.hinge);
    scene3D.collidables.push({ x, z, r: 0.45 });
    this.obj = scene3D._addInteractable({ kind: 'albumstand', worldPos: new THREE.Vector3(x, y, z), iconY: 2.0, reach: 2.8, hitRadius: 1.0 });
    this.flipT = -1; this.flips = 0; this.t = 0;
  }
  // The wow moment: the pages flip by themselves, with sparkles.
  flip(n = 5) { this.flipT = 0; this.flips = n; }
  update(dt) {
    this.t += dt;
    if (this.flipT < 0) { this.page.rotation.z = Math.sin(this.t * 1.3) > 0.98 ? 0.15 : 0; return; }
    this.flipT += dt;
    const k = this.flipT / 0.45;
    this.page.rotation.z = Math.PI * (k % 1); // turns from right to left, over the top
    if (Math.floor(k) !== this._lastK) {
      this._lastK = Math.floor(k);
      const p = this.hinge.position.clone(); p.y += 0.3;
      this.s.particleBurst(p, this._lastK % 2 ? '#ffd34a' : '#ffffff', 14);
    }
    if (k >= this.flips) { this.flipT = -1; this.page.rotation.z = 0; this._lastK = undefined; }
  }
}
