# Empire des Mots — document de conception

Jeu d'orthographe en français pour les 5–8 ans, sur iPad (6e génération, 2018, doit rester fluide).
Un iPad par enfant, une seule partie sauvegardée.

## Principe directeur

**L'orthographe est la magie.** Écrire un mot juste n'est pas une porte à franchir avant de jouer :
c'est l'action même du jeu. Un mot bien écrit construit un pont, rallume une lanterne, réveille une
créature. Plus le mot est juste du premier coup, plus le sort est beau.

## Histoire : « Le village qui oubliait ses mots »

Ton calme, drôle, sans violence. Pas de méchant : un mystère à résoudre et quelqu'un à aider.

**Prologue (village).** Un matin, les panneaux des maisons sont vides et certains objets deviennent
flous, comme s'ils avaient oublié leur nom. Alaric, le vieux mage, confie à l'enfant un grimoire vide :
« Les mots s'envolent. Écris-les, et ils reviendront. »

**Chapitre 1 — Les panneaux.** Réécrire le nom des bâtiments du village (taverne, forge…). Chaque
nom rendu rallume la maison. On rencontre le premier **Mimot**, une petite créature en blocs qui porte
un mot sur le ventre : c'est un mot échappé. En l'écrivant juste, on l'adopte et il rejoint l'album.
Une page arrachée est trouvée près de la fontaine, écrite d'une écriture penchée.

**Chapitre 2 — La forêt des sapins** (ouest, sons *in / ain / ein*). Le pont de bois a perdu son nom :
premier sort, « pont ». Le garde-forestier a perdu les mots de sa chanson. Deuxième page arrachée.

**Chapitre 3 — Le marais** (est, sons *o / au / eau*). L'eau monte : sorts « eau », « bateau ».
Les pages trouvées forment une phrase : ce sont des listes de mots, écrites de la main d'Alaric.
**Premier rebondissement :** Alaric lui-même « emprunte » les mots. Il perd la mémoire et écrit tous
les mots du village dans un grand livre pour ne pas les oublier. Il n'est pas méchant : il a peur.

**Chapitre 4 — La montagne** (nord, sons *on / om*, puis *ch / gn*). On monte jusqu'à la tour où
Alaric cache le livre. **Deuxième rebondissement :** dans le livre, les mots sont vivants. Ce sont
les Mimots, heureux d'être ensemble, mais le village se vide de sens. On entre dans le livre.

**Chapitre 5 — La côte et le livre** (sud, sons *ou / oi*, puis le monde de papier). Dans le livre, des
pages-îles reliées par des ponts de lettres. Pour chaque Mimot, on choisit de le renvoyer au village.
**Fin :** l'enfant propose à Alaric que son album des mots devienne sa mémoire. Les mots rentrent au
village, et Alaric peut relire l'album quand il oublie. Les deux fins (tout rendre, ou garder quelques
mots dans le livre) mènent au même épilogue doux.

## La magie des mots

- **Le grimoire** se remplit au fil de l'histoire (8 sorts au total). Chaque sort est un mot et un effet.
- **Les cercles magiques** au sol (cercles lumineux) indiquent où un sort est utile. On touche un cercle,
  on écoute le mot, on l'écrit.
- **Adapté à l'âge :** à 5 ans on écrit la première lettre du mot (« P comme pont »), à 6 ans un mot
  simple ou une syllabe, à 7 et 8 ans le mot entier.
- **Puissance :** du premier coup, effet complet et étoiles ; au deuxième, effet « bancal » mais utile
  (un pont qui tangue) ; en recopiant, effet minimal. On ne reste jamais bloqué.
- **Sorts :**

| Sort | 5 ans | 6 ans | 7–8 ans | Effet |
|---|---|---|---|---|
| Pont | p | pont | pont | fait apparaître un pont de blocs au-dessus de l'eau |
| Lumière | l | lune | lumière | éclaire la nuit et les grottes |
| Fleur | f | fleur | fleur | fait pousser un massif de fleurs (matériau) |
| Arbre | a | arbre | arbre | fait pousser un arbre (bois) |
| Pluie | p | pluie | pluie | arrose : le blé repousse tout de suite |
| Feu | f | feu | feu | allume les braseros, sèche le marais |
| Vent | v | vent | vent | pousse le bateau, chasse le brouillard |
| Pierre | p | pierre | pierre | escalier de pierre dans la montagne |

## La carte

- La zone jouable passe d'un rayon de 42 à 84 blocs (4 fois la surface). Le village reste au centre.
- Quatre régions, une par direction. Chacune a sa famille de sons, ses matériaux, un PNJ et sa quête,
  des Mimots, et un obstacle franchi par un sort.
  - **Forêt (ouest)** : sapins, champignons, rivière (sort Pont).
  - **Marais (est)** : roseaux, nénuphars, brume (sorts Feu, Vent).
  - **Montagne (nord)** : falaises, neige, tour d'Alaric (sort Pierre).
  - **Côte (sud)** : plage, phare, ponton, bateau (sort Vent).
- **Panneaux de voyage :** chaque région a un panneau effacé. On le répare en écrivant le nom de la
  région, et on peut ensuite s'y téléporter depuis la minicarte.
- **Performance :** chaque région forme un groupe à part, caché quand il est loin (brouillard et
  distance d'affichage réglés par niveau de qualité). Les meshes statiques sont fusionnés par région.
  On mesure avec `?fps` à chaque étape.

## Mécaniques

- **Mimots** (créatures-mots) : 2 à 4 par région, ils se promènent. On les touche, on écrit leur mot, ils
  rejoignent l'album et suivent un moment l'enfant. Le mot vient de la liste de l'âge.
- **Garder ce qui marche :** minage, fabrication, pêche, coffres, tenues, lit, cycle jour/nuit.
- **Objectifs visibles :** un bandeau « Chapitre — objectif » en haut de l'écran, avec une flèche sur la
  minicarte vers l'objectif courant.
- Parties courtes : un objectif se boucle en 3 à 5 mots, un chapitre en 15 à 20 minutes.

## Espace parents

- Ce qui existe : mots rencontrés, réussites, erreurs, activité, sauvegarde.
- À ajouter : maîtrise par famille de sons (ch, ou, on, an/en, in, au/eau, oi, gn, lettres muettes…),
  chapitre en cours.

## Découpage en versions

1. **v1.1 — Âges** (fait) : 5, 6, 7, 8 ans, listes par niveau scolaire, progression automatique.
2. **v1.2 — Magie** : grimoire, cercles magiques, sorts dans le village actuel.
3. **v1.3 — Prologue, chapitre 1 et Mimots** : panneaux effacés, objectifs, première page.
4. **v1.4 — Carte agrandie, forêt et marais** : régions, panneaux de voyage, chapitres 2 et 3.
5. **v1.5 — Montagne, côte, livre et fin** : chapitres 4 et 5, rebondissements, épilogue, parents.

## Fichiers prévus

- `magic.js` : liste des sorts, effets 3D (pont, fleurs, arbre, lumière…).
- `story.js` : chapitres, objectifs, dialogues, pages.
- `regions.js` : construction des régions et des panneaux de voyage.
- Sauvegarde : `progress.save.story` (chapitre, objectifs faits, pages), `progress.save.spells`.
