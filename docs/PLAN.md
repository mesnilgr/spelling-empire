# Plan des 30 releases (20 novembre → 19 décembre 2026)

Source de vérité pour la release automatique quotidienne. Une release par jour, week-ends compris.
Doc partagé (lecture) : https://claude.ai/artifact/PnaoyWSEkRoXXHy4r5sTeb

## Règles pour chaque release

1. Chaque release s'appuie sur les précédentes (réutiliser chien, chevaux, boss, lieux, fabrication…).
2. Les mots restent au centre : chaque nouveauté contient un moment d'orthographe ou de lecture. Ne jamais
   contourner « un mot au moins toutes les 2 minutes » ni « personne ne bouge pendant un mot ».
3. **Présentation à l'écrit et à l'oral** : ajouter à la fin de `news.js` une entrée par nouveauté
   (`id` = version + suffixe, `day`, `date`, `emoji`, `show` = ce que vise « Montre-moi ! », `title` et `text`
   en fr et en). Le texte = le « texte lu » ci-dessous (2–3 phrases simples pour 5–8 ans).
4. Une release tient en une journée ; si elle déborde, publier la **version réduite**.
5. iPad 9,7" 2018 : le test « Fluidité iPad » doit passer (village ≤ 1 300 appels, régions ≤ 860).
   Préférer les meshes fusionnés (couleurs dans les sommets, voir `fauna.js`, `golem.js`).
6. Tout ce qui compte est aussi dit à voix haute (`speak`) ; textes courts ; aucune frustration sans aide.
7. Ajouter un scénario e2e qui joue la nouveauté ; ne jamais publier avec un test rouge.
8. **Deux sessions de 15 minutes.** Chaque release donne de quoi jouer deux fois 15 minutes : la **session 1**
   (découverte et premier objectif) et la **session 2** (suite qui utilise ce qu'on a gagné, fait grandir ou
   débloqué en session 1). La partie 2 se débloque au **retour suivant** (jeu rouvert au moins 30 min après la
   dernière partie) **ou après 15 min de jeu** sur la partie 1 — elle n'est jamais bloquée plus longtemps.
   Le journal 📜 montre « Partie 1 ✓ · Partie 2 : à ton prochain retour ! », écrit et lu. Chaque session
   contient au moins 7 mots. Le système de parties est construit en J2 (`releasePart(day)` dans `game.js`) et
   réutilisé ensuite ; le scénario e2e joue les deux parties (avance du temps via `window.__se`).
   La version réduite garde les deux sessions (moins de variété, mais autant de jeu : plus d'exemplaires,
   tirage au sort).
9. **Chaque release est fun**, pas seulement utile. Elle a :
   - un **moment waouh** dans les 30 s après « Montre-moi ! » (animation + bruitage + confettis ou étincelles) ;
   - un **gag** qui fait rire un enfant de 6 ans (réaction d'animal, bruit rigolo, maladresse d'un golem…),
     jamais moqueur envers l'enfant ;
   - un **secret** : la cachette du jour de Cocotte la poule (voir « Fils rouges ») ;
   - quelque chose à **montrer** (objet, costume, trophée visible dans la chaumière ou sur le chien) ;
   - la **devinette d'Alaric** à la fin de la carte « Quoi de neuf ».
   Bruitages courts et petites fanfares permis ; **pas de musique de fond**. La version réduite garde au moins
   le moment waouh et le gag.

## Fils rouges (construits en J2, enrichis chaque jour)

- **Cocotte la poule** se cache chaque jour à un endroit lié à la nouveauté (ligne « Cocotte » de chaque
  release). La toucher : « Cot cot ! », elle s'envole en tournant et laisse une **plume dorée** (une par jour).
  Le journal 📜 donne l'indice du jour, écrit et lu. Les plumes vont dans l'album (J4) ; à la fête (J29),
  Cocotte vient quoi qu'il arrive et porte un chapeau avec une plume par plume trouvée. Code : `cocotte.js`
  (table `{ day, pos, hint, pose }`, une ligne ajoutée par release).
- **La devinette d'Alaric** : chaque carte « Quoi de neuf » finit par une devinette (champ `riddle` fr/en dans
  `news.js`) ; bouton « La réponse ? » qui l'affiche et la lit. Ajouté en J2.
- **Le journal 📜** garde les cartes, les deux parties du jour et l'indice de Cocotte.

## Processus

`npm test` → `CHROME_PATH=/usr/bin/google-chrome node tests/e2e/run.mjs` (suite complète ~3–4 min) →
`npx vite build` → CHANGELOG.md (section en tête, en français, pour les parents) → commit (auteur
`mesnilgr <gregoire@incalia.fr>`) → `git push origin HEAD:main` → publier `dist/` sur l'artifact
`272c1d81-9603-4155-88c3-832920e17093` (mode replace, label = version) → cocher la ligne ci-dessous.

## Les 30 releases

Statut : `[x]` publiée · `[ ]` à faire. Version : J1 = v1.19.0, puis +1 en mineure par jour (J2 = v1.20.0…).
Les dates sont celles de la publication (la tâche tourne chaque matin à 6 h 17).

### Semaine 1 — Revenir chaque jour

- [x] **J1 · ven. 20 nov. · v1.19.0 — Quoi de neuf, journal et Fer le golem de fer.**
  Carte d'Alaric écrite + lue à chaque release (Montre-moi / Plus tard), journal 📜 ; Fer patrouille la place,
  écrase les zombies la nuit, offre une fleur par jour.

- [x] **J2 · sam. 21 nov. · v1.20.0 — Défis du jour, Cocotte et devinettes.**
  - Session 1 : trois **défis du matin** adaptés à ce que l'enfant possède (« Nourris ton chien », « Fais un câlin
    à un mouton », « Épelle 5 mots du premier coup »…) ; quand les trois sont faits, un **coffre sauteur**
    apparaît devant la chaumière.
  - Session 2 : trois **défis du soir**, différents (« Trouve 2 coffres », « Dis bonjour à Fer », « Épelle un mot
    sur ton cheval »…) ; un deuxième coffre, plus gros, avec un objet rare ou un costume.
  - Plus fun : le coffre sauteur fait trois bonds pour s'échapper avant de se laisser attraper, puis éclate en
    confettis ; défis rigolos ; mise en place des fils rouges (Cocotte, devinette d'Alaric, parties 1 et 2).
  - Cocotte : sur le toit de la chaumière, à côté du coffre.
  - Réduite : défis tirés d'une liste fixe ; coffre normal à confettis.
  - S'appuie sur : J1, chien, coffres, zombies, lieux.
  - Texte lu : « Nouveau ! Chaque jour, trois défis le matin et trois défis le soir. Réussis-les et attrape le coffre sauteur… s'il se laisse faire ! Et regarde bien : Cocotte la poule s'est cachée quelque part. »
  - Devinette : « Plus j'ai de gardiens, moins je suis gardé. Qui suis-je ? » — « Un secret ! »

- [x] **J3 · dim. 22 nov. · v1.21.0 — Flammèche, la flamme des jours 🔥.** (complète ; la cheminée de Flammèche est devant la chaumière, du côté que voit la caméra)
  - Session 1 : **Flammèche**, une petite flamme avec des yeux, s'allume dans la cheminée de la chaumière quand on
    épelle FEU ; chaque mot réussi du premier coup lui donne une bûche : elle grandit (5 tailles) et danse.
  - Session 2 : devenue grande, elle éternue des étincelles qui retombent en **10 étoiles** autour de la chaumière
    à ramasser ; première case du calendrier de 7 jours : des lunettes de soleil pour le chien.
  - Série : chaque jour joué ajoute un jour. Un jour manqué ne l'éteint pas : elle s'endort et ronfle (« zzz »),
    et une **bûche magique** (gagnée en épelant, une par semaine) la rallume sans perdre la série.
  - Plus fun : yeux, danse, ronflements ; calendrier de récompenses rigolotes (lunettes pour le chien, nœud
    papillon pour Fer, chapeau pour le chien au 7e jour, qu'il fait tourner).
  - Cocotte : dans le tas de bois à côté de la cheminée.
  - Réduite : Flammèche qui grandit + étoiles ; récompense au 7e jour seulement.
  - S'appuie sur : J2.
  - Texte lu : « Voici Flammèche, ta flamme magique ! Chaque mot réussi la fait grandir. Reviens chaque jour : au septième jour, une grosse surprise pour ton chien ! »
  - Devinette : « Je mange tout, mais si je bois, je m'éteins. Qui suis-je ? » — « Le feu ! »

- [ ] **J4 · lun. 23 nov. · v1.22.0 — Album de collection.**
  - Session 1 : l'album s'ouvre déjà rempli de ce que l'enfant a vu (pages **animaux** et **lieux**, depuis la
    sauvegarde). Pour coller une nouvelle vignette, on **épelle son nom** (MOUTON, CHEVAL…). Les cases manquantes
    sont des silhouettes « ??? » avec un indice lu ; objectif : 3 nouvelles vignettes.
  - Session 2 : pages **boss**, **objets fabriqués**, **Mimots** et **plumes de Cocotte** ; une « page découverte »
    de 6 cases près du village, faisable en une session, donne le premier **costume**.
  - Plus fun : chaque vignette fait son cri quand on la touche (`animalVoice`) ; **vignettes dorées** rares
    (1 chance sur 20 en croisant un animal) qui brillent.
  - Cocotte : cachée dans une page de l'album (une vignette qui cligne de l'œil).
  - Réduite : pages animaux, lieux et découverte.
  - S'appuie sur : J2, J3, `fauna.js`, `landmarks.js`.
  - Texte lu : « Voici ton album ! Chaque animal, chaque lieu, chaque boss va s'y coller : épelle son nom pour coller la vignette. Remplis une page entière pour gagner un costume ! »
  - Devinette : « J'ai des feuilles, mais je ne suis pas un arbre. Qui suis-je ? » — « Un livre ! »

- [ ] **J5 · mar. 24 nov. · v1.23.0 — Pouvoirs des mots.**
  - Session 1 : un mot difficile (niveau au-dessus de l'âge ou mot « en cours ») réussi du premier coup donne un
    pouvoir de 20 s : **vitesse** ou **super saut** (icône + compte à rebours). Parcours « Saute jusqu'aux
    nuages » : 5 nuages au-dessus du village, avec des étoiles, atteignables seulement en super saut.
  - Session 2 : pouvoirs **géant** et **planer** ; descendre de la montagne en planant à travers 5 anneaux ;
    pouvoir **tout petit** pour entrer par le trou de souris de la taverne dans une pièce secrète.
  - Plus fun : les lettres du mot réussi forment une traînée derrière le héros quand il court ; en géant, chaque
    pas fait rebondir les moutons ; le chien reçoit le même pouvoir (chien géant !).
  - Cocotte : sur le plus haut nuage (super saut obligatoire).
  - Réduite : vitesse et super saut + nuages ; planer en session 2.
  - S'appuie sur : J2 (défi « gagne un pouvoir »).
  - Texte lu : « Les mots ont des pouvoirs ! Réussis un mot difficile et tu pourras courir comme le vent, sauter jusqu'aux nuages ou devenir géant ! »
  - Devinette : « Qu'est-ce qui monte et ne redescend jamais ? » — « Ton âge ! »

- [ ] **J6 · mer. 25 nov. · v1.24.0 — Boss vivants et golem de cuivre.**
  - Session 1 : les golems des boss (mousse, pierre) marchent dans leur repaire et lèvent les bras quand on
    approche ; nouvelle recette « petit golem de cuivre » (fer + pierre + feu) qui suit le héros 3 minutes.
  - Session 2 : chasse aux **3 boutons secrets** cachés dans 3 lieux ; le petit golem appuie dessus et un coffre
    secret sort de terre (un mot pour l'ouvrir). Avec le temps il verdit : on épelle BRILLE pour le faire briller.
  - Plus fun : le petit golem est maladroit (il trébuche, fait « bong » contre les arbres, appuie sur tous les
    boutons, même les faux, qui lâchent des confettis) ; le golem de mousse éternue des feuilles ; Fer et le
    petit golem se saluent.
  - Cocotte : sur la tête du golem de mousse.
  - Réduite : boss qui marchent + golem de cuivre qui suit + 1 bouton secret par session.
  - S'appuie sur : J1 (Fer), boss, fabrication.
  - Texte lu : « Les golems des boss se réveillent un peu : ils marchent dans leur repaire ! Et tu peux fabriquer ton propre petit golem de cuivre. Il est un peu maladroit… mais il connaît des coffres secrets ! »
  - Devinette : « Pourquoi les golems ne gagnent jamais à cache-cache ? » — « Parce qu'on les entend venir : bong, bong, bong ! »

- [ ] **J7 · jeu. 26 nov. · v1.25.0 — Golem de neige et bataille de boules.**
  - Session 1 : dans la montagne, un golem de neige lance des boules (pas de dégâts, juste « Pouf ! ») ; on
    ramasse des boules dans la neige et on les renvoie avec un bouton ; un mot toutes les 3 touches ; 3 manches
    gagnées = un **cristal**.
  - Session 2 : construire **son propre bonhomme de neige** : rouler 3 boules qui grossissent en avançant, épeler
    CAROTTE pour le nez, choisir un chapeau ; il reste devant la chaumière et danse la nuit. Revanche contre le
    golem, plus rapide.
  - Plus fun : une boule reçue transforme le héros en bonhomme de neige pendant 2 s (« Brrr ! ») ; le chien saute
    pour attraper les boules.
  - Cocotte : déguisée en bonhomme de neige dans la montagne.
  - **Point de contrôle joueurs.** Réduite : bataille simple + bonhomme de neige à 3 boules toutes faites.
  - S'appuie sur : J6, montagne.
  - Texte lu : « Dans la montagne, un golem de neige veut jouer ! Évite ses boules de neige et renvoie-lui les tiennes. Ensuite, construis ton propre bonhomme de neige ! »
  - Devinette : « Quel est le plat préféré du bonhomme de neige ? » — « Les frites… bien glacées ! »

### Semaine 2 — Aventures et hiver

- [ ] **J8 · ven. 27 nov. · v1.26.0 — Wagonnet de la mine.**
  - Session 1 : trajet en wagonnet depuis la mine abandonnée (rails, tunnels) ; à chaque aiguillage, choisir le
    mot bien écrit entre deux ; la bonne voie mène aux diamants.
  - Session 2 : une deuxième ligne s'ouvre vers la **grotte de cristal**, avec un grand saut au-dessus d'un
    ravin ; on attrape des pépites en les touchant pendant le trajet.
  - Plus fun : la mauvaise voie n'est pas une punition : détour par la grotte des chauves-souris qui crient
    « Hiii ! », puis retour à l'aiguillage ; ralenti pendant le grand saut ; le chien monte dans le wagon,
    oreilles au vent ; klaxon « tut-tut » à toucher.
  - Cocotte : dans un wagonnet abandonné au fond de la mine.
  - Réduite : rail droit, 3 aiguillages ; la ligne 2 est la même avec d'autres mots et des pépites.
  - S'appuie sur : mine abandonnée, diamants, chien.
  - Texte lu : « Monte dans le wagonnet de la mine ! À chaque aiguillage, choisis le mot bien écrit : la bonne voie mène au trésor de diamants. Accroche-toi bien ! »
  - Devinette : « Qu'est-ce qui a des dents mais ne mord jamais ? » — « Un peigne ! »

- [ ] **J9 · sam. 28 nov. · v1.27.0 — Chronos et records.**
  - Session 1 : parcours de lave et wagonnet chronométrés ; départ « 3, 2, 1… » puis un mot de départ (personne
    ne bouge pendant le mot) ; médailles bronze / argent / or selon le temps ; un **fantôme** transparent rejoue
    ton meilleur parcours.
  - Session 2 : **course à cheval** à travers des anneaux ; panneau des records (3 meilleurs temps par parcours) ;
    défi « bats le fantôme d'Alaric » (temps fixé).
  - Plus fun : Alaric commente comme à la télé (« Et c'est le saut ! Incroyable ! ») ; Fer tient le drapeau
    d'arrivée et applaudit.
  - Cocotte : perchée sur le panneau des records.
  - Réduite : lave + wagonnet en session 1, cheval en session 2, sans fantôme.
  - S'appuie sur : J8, parcours de lave, chevaux.
  - Texte lu : « Attention, prêts, partez ! Le parcours de lave, le wagonnet et la course à cheval ont un chrono. Bats ton record… et ton fantôme ! »
  - Devinette : « Qu'est-ce qui a des aiguilles mais ne coud jamais ? » — « Une montre ! »

- [ ] **J10 · dim. 29 nov. · v1.28.0 — Chasse au trésor du pirate.**
  - Session 1 : dans l'épave, la carte du pirate ; indices 1 à 3 (devinettes courtes à lire, niveau adapté à l'âge)
    qui mènent de lieu en lieu ; à chaque lieu, épeler le mot de l'indice pour trouver le morceau de carte suivant.
  - Session 2 : indices 4 à 6 jusqu'à la grande croix ; on creuse en épelant CREUSE ; dans le grand coffre, de l'or
    et un **bandeau de pirate pour le chien**. L'ordre des lieux change chaque jour : la chasse se rejoue.
  - Plus fun : un **perroquet pirate** se pose sur ton épaule et répète en criant le dernier mot épelé
    (« COFFRE ! COFFRE ! ») ; le chien creuse avec toi.
  - Cocotte : sur l'épave, avec un chapeau de pirate.
  - Réduite : 3 indices par session, sans perroquet.
  - S'appuie sur : épave, lieux, chien.
  - Texte lu : « Le pirate a laissé une carte au trésor ! Lis bien chaque indice : il te dira où aller ensuite. Au bout, un coffre plein d'or… et un perroquet bavard ! »
  - Devinette : « Pourquoi les pirates ont-ils du mal à finir l'alphabet ? » — « Parce qu'ils restent bloqués sur le R : Arrr ! »

- [ ] **J11 · lun. 30 nov. · v1.29.0 — Surprises et marchand ambulant.**
  - Session 1 : un **marchand ambulant** arrive avec deux lamas et reste toute la session : 3 objets rares contre
    des étoiles + un mot ; à la nuit du jeu, une **étoile filante** à attraper : elle exauce un vœu (on épelle
    l'un des 3 mots proposés en images, par exemple CHAPEAU, GÂTEAU, LAMA, et on le reçoit).
  - Session 2 : une averse puis un **arc-en-ciel** qui mène à un coffre ; le marchand revient avec d'autres objets.
  - Plus fun : les lamas crachent (« Ptou ! ») quand on les touche ; le coffre de l'arc-en-ciel joue une note par
    couleur quand on l'ouvre.
  - Cocotte : sur le dos d'un lama du marchand.
  - Réduite : étoile filante + marchand ; arc-en-ciel en session 2.
  - S'appuie sur : étoiles, nuit, coffres.
  - Texte lu : « Ouvre l'œil ! Des étoiles filantes, des arcs-en-ciel et un marchand mystérieux avec ses lamas apparaissent parfois. Attention, les lamas crachent ! »
  - Devinette : « Pourquoi le lama crache-t-il ? » — « Pour dire bonjour… à sa façon ! »

- [ ] **J12 · mar. 1er déc. · v1.30.0 — L'hiver et le calendrier de l'Avent.**
  - Session 1 : la neige tombe sur le monde (sol blanc, traces de pas du héros et du chien) ; **case 1 du
    calendrier** : un mot de Noël à épeler et un cadeau (boules de sapin pour J20, décorations, étoiles).
  - Session 2 : **luge des lettres** sur la pente de la montagne : en glissant, on attrape les lettres du mot dans
    l'ordre ; 3 descentes de plus en plus rapides.
  - Plus fun : chaque case s'ouvre comme une boîte à ressort (« Boïng ! ») ; les moutons portent un bonnet ;
    certains jours, la case contient une blague de Noël lue par Alaric.
  - Cocotte : juste sa crête qui dépasse de la neige.
  - Réduite : calendrier + neige ; luge sur une piste droite.
  - S'appuie sur : J7 (montagne enneigée), J11.
  - Texte lu : « Il neige sur l'Empire des Mots ! Chaque jour jusqu'à Noël, ouvre une case du calendrier : épelle le mot caché et découvre ton cadeau. Et attrape les lettres en luge ! »
  - Devinette : « Qu'est-ce qui tombe tout le temps sans jamais se faire mal ? » — « La neige ! »

- [ ] **J13 · mer. 2 déc. · v1.31.0 — Laine et couleurs.**
  - Session 1 : recette des ciseaux ; **tondre les moutons** (laine de leur couleur) ; la laine repousse en 10 min.
  - Session 2 : **teindre** : donner une fleur à un mouton lui donne sa couleur, en épelant la couleur (ROUGE,
    BLEU, JAUNE…) ; mission « troupeau arc-en-ciel » de 5 couleurs ; tondre à nouveau pour avoir de la laine
    colorée.
  - Plus fun : un mouton tondu est tout maigre et grelotte drôlement en attendant sa laine ; secret : un mouton
    nommé « Arc-en-ciel » change de couleur sans arrêt.
  - Cocotte : au milieu des moutons, toute rose.
  - Réduite : tonte + teinture en 3 couleurs.
  - S'appuie sur : moutons, fleurs, fabrication.
  - Texte lu : « Tes moutons ont une belle laine ! Tonds-les avec des ciseaux, puis donne-leur une fleur pour les colorer. Tu vas pouvoir construire en couleurs ! »
  - Devinette : « Que compte un mouton pour s'endormir ? » — « Des enfants ! »

- [ ] **J14 · jeu. 3 déc. · v1.32.0 — Mode construction.**
  - Session 1 : terrain près de la chaumière ; poser, empiler, retirer des blocs (bois, pierre, verre, laine colorée
    de J13) ; chaque bloc coûte un matériau (un petit stock offert pour démarrer) ; sauvegardé. Défi d'Alaric :
    « Construis une tour de 5 blocs ».
  - Session 2 : **défi du plan** : reproduire un petit modèle montré en transparence (maison, pont), puis épeler
    son nom (MAISON) pour le valider ; **bouton photo** pour montrer sa construction aux parents (gardée dans le
    journal).
  - Plus fun : **bloc TNT à confettis** qui fait exploser (en confettis !) ce qu'on a construit ; Fer et le chien
    viennent visiter et commentent (« Quelle belle tour ! »).
  - Cocotte : dans un bloc de laine sur le terrain de construction.
  - **Point de contrôle joueurs.** Réduite : un niveau, 3 sortes de blocs, un modèle par session.
  - S'appuie sur : J13, fabrication, chaumière.
  - Texte lu : « À toi de construire ! Pose des blocs de bois, de pierre, de verre ou de laine sur ton terrain. Tour, château ou cabane : tout est possible… même le bloc qui explose en confettis ! »
  - Devinette : « Qu'est-ce qui a une tête et un pied, mais pas de corps ? » — « Un lit ! »

### Semaine 3 — Mes amis, ma maison, mon village

- [ ] **J15 · ven. 4 déc. · v1.33.0 — Chats et loups apprivoisables.**
  - Session 1 : des chats au village ; on les apprivoise avec un poisson + un mot ; on donne un **nom** à son chat
    en l'épelant (3 noms au choix) ; il ronronne quand on le caresse.
  - Session 2 : des loups dans la forêt ; on les apprivoise avec un os + un mot ; on choisit qui accompagne (le
    chien + un autre) ; la nuit, le loup chasse les zombies avec le chien ; le lendemain matin, le chat a déposé un
    « cadeau » devant la porte.
  - Plus fun : le chat s'assoit parfois sur la tête du héros ; son cadeau est un poisson… ou une vieille botte ;
    la nuit, le loup et le chien hurlent à la lune.
  - Cocotte : dans le panier du chat, qui la regarde d'un drôle d'air.
  - Réduite : le chat seulement ; en session 2, le choix du compagnon et le cadeau du chat.
  - S'appuie sur : chien (`PetManager`), zombies, poissons.
  - Texte lu : « Les chats et les loups peuvent devenir tes amis ! Épelle un mot pour les apprivoiser, donne-leur un nom, puis choisis qui part à l'aventure avec toi. »
  - Devinette : « Quel est le comble pour un chat ? » — « D'avoir un chat dans la gorge ! »

- [ ] **J16 · sam. 5 déc. · v1.34.0 — Le potager.**
  - Session 1 : des carrés de potager devant la chaumière ; graines de carotte, pomme de terre et citrouille ;
    planter, puis arroser en épelant EAU ; les légumes poussent pendant le jeu (environ 10 min).
  - Session 2 : la **récolte** ; une graine sur dix donne un **légume géant** ; replanter ; donner une carotte au
    cheval ; la nuit, les citrouilles deviennent des lanternes rigolotes.
  - Plus fun : un **lapin gourmand** vient grignoter : on le chasse en épelant OUSTE ; arroser fait un petit
    arc-en-ciel ; on peut sauter sur la citrouille géante.
  - Cocotte : entre les citrouilles.
  - Réduite : carottes seulement (géantes possibles), lapin en session 2.
  - S'appuie sur : chaumière, chevaux, J12.
  - Texte lu : « Ton potager t'attend devant la maison ! Plante des graines, arrose-les, et reviens les récolter quand elles ont poussé. Attention au lapin gourmand ! »
  - Devinette : « Pourquoi les carottes sont-elles bonnes pour les yeux ? » — « As-tu déjà vu un lapin avec des lunettes ? »

- [ ] **J17 · dim. 6 déc. · v1.35.0 — La cuisine.**
  - Session 1 : une marmite dans la chaumière ; on cuisine en **épelant les ingrédients dans l'ordre** ; soupe
    (+1 cœur temporaire) ; un livre de recettes à remplir.
  - Session 2 : gâteau (donne un pouvoir de J5), **carotte dorée** (cheval plus rapide, à essayer sur la course
    de J9), et le **gâteau d'anniversaire du chien** avec une bougie à souffler.
  - Plus fun : la marmite fait « blop blop » ; un ingrédient oublié donne un plat raté rigolo (soupe verte qui fait
    roter « Burp ! », sans effet négatif).
  - Cocotte : dans la marmite (sans danger : elle prend un bain !).
  - Réduite : soupe en session 1, carotte dorée et gâteau du chien en session 2.
  - S'appuie sur : J16, J5, J9.
  - Texte lu : « À la cuisine ! Avec tes légumes, prépare une soupe qui donne des forces ou un gâteau magique plein de pouvoirs. Épelle bien chaque ingrédient… sinon, burp ! »
  - Devinette : « Qu'est-ce qui est jaune et qui attend ? » — « Jonathan ! »

- [ ] **J18 · lun. 7 déc. · v1.36.0 — Tableau des quêtes.**
  - Session 1 : à la taverne, un tableau avec 3 demandes de villageois, chacune avec une petite histoire drôle
    (« Le boulanger a perdu sa moustache ! ») : légumes, laine, poissons, plats.
  - Session 2 : 3 nouvelles demandes + une **demande mystère** dont on ne découvre la récompense qu'à la fin ;
    chaque demande réussie fait monter la **réputation du village** (une statue du héros sur la place après
    10 demandes, sur plusieurs jours).
  - Plus fun : le villageois content fait une danse de la joie.
  - Cocotte : sur le tableau, en affiche « Avis de recherche : Cocotte ».
  - Réduite : 3 demandes par session, sans statue.
  - S'appuie sur : J13, J15, J16, J17.
  - Texte lu : « Les villageois ont besoin de toi ! Regarde le tableau de la taverne : chaque demande réussie rapporte des étoiles et des surprises. »
  - Devinette : « Qu'est-ce qui est à toi, mais que les autres utilisent plus que toi ? » — « Ton prénom ! »

- [ ] **J19 · mar. 8 déc. · v1.37.0 — Lettres et facteur.**
  - Session 1 : un sac de facteur ; écrire une courte lettre (phrase dictée, niveau adapté à l'âge) et la porter à
    Fer, au boulanger ou au golem de neige.
  - Session 2 : un **pigeon voyageur** apporte les réponses (chacun répond avec sa personnalité) ; un colis à
    livrer à cheval en moins de 2 minutes ; on écrit une **lettre au Père Noël** (réponse à la fête, J29).
  - Plus fun : Fer écrit comme un robot (« BIP. MERCI. FLEUR. BIP. ») ; le golem de neige envoie une lettre gelée
    qu'il faut réchauffer près de Flammèche.
  - Cocotte : dans la boîte aux lettres.
  - Réduite : une lettre par session, réponse au retour.
  - S'appuie sur : J1, J3, J7, chevaux.
  - Texte lu : « Tu deviens le facteur du village ! Écris une petite lettre, porte-la à son destinataire… et attends que le pigeon t'apporte sa réponse ! »
  - Devinette : « Qu'est-ce qui commence par E, finit par E, et ne contient qu'une seule lettre ? » — « Une enveloppe ! »

- [ ] **J20 · mer. 9 déc. · v1.38.0 — Le sapin du village.**
  - Session 1 : un immense sapin arrive sur la place ; on y accroche les boules et guirlandes gagnées en épelant
    et dans le calendrier ; secouer le sapin fait tomber la neige.
  - Session 2 : poser l'**étoile** au sommet en montant une échelle de mots (un mot par barreau) ; allumer le sapin
    en épelant LUMIÈRE.
  - Plus fun : quand le sapin s'allume, tout le village fait « Ooooh ! » ; la neige du sapin tombe sur la tête du
    héros (et parfois une surprise) ; des boules à la tête du chien, de Fer ou de Cocotte.
  - Cocotte : tout en haut du sapin, à la place de l'étoile (jusqu'à ce qu'on la trouve).
  - Réduite : boules seulement ; étoile + allumage en session 2.
  - S'appuie sur : J12 (calendrier), place du village.
  - Texte lu : « Un immense sapin est arrivé sur la place ! Gagne des boules et des guirlandes en épelant, décore-le, puis allume-le pour la grande fête de Noël. »
  - Devinette : « Qu'est-ce qui est vert l'été, vert l'hiver, et brille à Noël ? » — « Le sapin ! »

- [ ] **J21 · jeu. 10 déc. · v1.39.0 — Grand rallye et journée des farces.**
  - Session 1 : **journée des farces** (24 h) : les moutons portent des lunettes, Fer danse, les zombies ont un nez
    de clown la nuit ; trouver 10 fausses Cocottes en carton (une seule est la vraie).
  - Session 2 : **grand rallye de l'Empire** : 8 balises dans les nouveautés des semaines 1 à 3 (wagonnet, album,
    potager, sapin…), un mot à chaque balise, un diplôme à la fin.
  - En coulisses : corrections des retours, réglage des récompenses et des prix, performance iPad.
  - Plus fun : les farces elles-mêmes ; Alaric fait semblant d'être un zombie, puis rit.
  - Cocotte : la vraie, parmi les 10 en carton.
  - **Point de contrôle joueurs.** Réduite : farces + rallye à 5 balises.
  - S'appuie sur : J1 à J20.
  - Texte lu : « Aujourd'hui, c'est la journée des farces ! Regarde bien les moutons et Fer… Et lance-toi dans le grand rallye de l'Empire pour gagner ton diplôme ! »
  - Devinette : « Qu'est-ce qui devient de plus en plus mouillé quand il sèche ? » — « Une serviette ! »

### Semaine 4 — Le Nether et le grand final

- [ ] **J22 · ven. 11 déc. · v1.40.0 — Le Nether.**
  - Session 1 : le portail mène à une petite zone séparée (chargée à l'entrée) : sol rouge, rivières de lave,
    pierre lumineuse, champignons géants ; ramasser 5 pierres lumineuses (un mot chacune).
  - Session 2 : la **forteresse** et son coffre ; traverser des rivières de lave en les transformant en obsidienne ;
    portail de retour ; la pierre lumineuse devient une lampe dans la chaumière.
  - Plus fun : le passage du portail fait un tourbillon violet (« Wouuuch ! ») ; de petits **cubes de magma**
    rebondissent partout comme des balles (« Boing ! ») ; le chien porte des petites bottes anti-feu.
  - Cocotte : dans le Nether, avec des lunettes de soleil.
  - Réduite : une île rouge + coffre en session 1, forteresse simple en session 2.
  - S'appuie sur : portail, seau de lave, obsidienne.
  - Texte lu : « Le portail s'ouvre sur un monde de feu : le Nether ! Rivières de lave et pierres qui brillent… Explore-le, mais garde ton seau près de toi ! »
  - Devinette : « Qu'est-ce qui est rouge, très chaud, et fait glouglou ? » — « Une rivière de lave qui a soif ! »

- [ ] **J23 · sam. 12 déc. · v1.41.0 — Les habitants du Nether.**
  - Session 1 : les **Piglins** marchands : on leur donne de l'or et ils l'échangent contre des objets rares ; un mot
    pour chaque échange.
  - Session 2 : recette du seau d'eau ; mission « éteins les 6 petits monstres de feu de la forteresse » ; un Piglin
    devenu ami montre le chemin du repaire du dragon (annonce de J24).
  - Plus fun : un Piglin qui reçoit de l'or le regarde, ébahi, puis danse ; ses échanges sont parfois farfelus
    (une chaussure dorée, une plume) ; les monstres de feu éternuent des étincelles et, une fois éteints,
    deviennent de petits nuages de fumée qui boudent.
  - Cocotte : chez un Piglin, sur une pile d'or.
  - Réduite : Piglins en session 1, 3 monstres de feu en session 2.
  - S'appuie sur : J22, or, fabrication.
  - Texte lu : « Dans le Nether vivent les Piglins : ils adorent l'or ! Échange avec eux, et éteins les petits monstres de feu avec ton seau d'eau. »
  - Devinette : « Où les cochons rangent-ils leurs pièces ? » — « Dans une tirelire… cochon ! »

- [ ] **J24 · dim. 13 déc. · v1.42.0 — Le Dragon de lave.**
  - Session 1 : préparer le combat : trouver 3 **écailles de courage** dans le Nether (un mot chacune) ;
    approcher du dragon endormi sur la pointe des pieds ; phase 1 : il se réveille et s'enfuit plus loin.
  - Session 2 : son repaire profond ; phases 2 et 3, 5 mots plus difficiles, pouvoirs + seau d'eau ; victoire.
  - Plus fun : chaque phase finit par un énorme « ATCHOUM » de fumée ; après la victoire, le dragon avoue qu'il
    avait juste mal aux dents ; il laisse un **œuf de dragon** qui bouge dans la chaumière… et éclora à la fête
    (J29).
  - Cocotte : derrière le dragon endormi.
  - Réduite : boss à 5 mots ; écailles en session 1, combat en session 2.
  - S'appuie sur : J5, J22, J23, boss.
  - Texte lu : « Au fond du Nether dort le Dragon de lave, le plus grand boss de l'Empire ! Il faudra du courage, cinq mots et tous tes pouvoirs pour le vaincre. Chut… il dort ! »
  - Devinette : « Comment appelle-t-on un dragon enrhumé ? » — « Un cracheur de mouchoirs ! »

- [ ] **J25 · lun. 14 déc. · v1.43.0 — Le tournoi des mots d'Alaric.**
  - Session 1 : manches 1 à 3 (coupe de bronze), de plus en plus difficiles ; un **mot doré** bonus qui double
    les points.
  - Session 2 : manches 4 à 6 (argent, puis or) avec les mots ratés ces 30 jours (révision espacée) ; la coupe
    trône dans la chaumière ; on peut retenter chaque jour.
  - Plus fun : les gradins se remplissent de tes amis (chien, golems, moutons, Cocotte) qui applaudissent à chaque
    mot ; Alaric commente comme un présentateur.
  - Cocotte : dans les gradins, avec un petit drapeau.
  - Réduite : 3 manches par session, une coupe.
  - S'appuie sur : révision espacée, J9.
  - Texte lu : « Grand tournoi des mots ! Tous tes amis sont dans les gradins. Chaque manche est un peu plus difficile : arriveras-tu jusqu'à la coupe d'or ? »
  - Devinette : « Quel est le mot le plus long ? » — « Élastique : il s'étire tant qu'on veut ! »

- [ ] **J26 · mar. 15 déc. · v1.44.0 — Duel à deux (ou contre le chien).**
  - Session 1 : **duel sur le même iPad** : chacun son animal-avatar, tour à tour, chacun avec les mots de son âge.
    Seul ? **Duel contre le chien**, qui « épelle » en aboyant (niveau réglé pour que l'enfant gagne souvent).
  - Session 2 : **mode équipe** : à deux (ou avec le chien), ensemble contre une vague de zombies de nuit, chacun
    ses mots ; revanche en un bouton.
  - Plus fun : une « manche folle » où les lettres bougent toutes seules ; à la fin les deux gagnent quelque chose
    (couronne pour le gagnant, chapeau du courage pour l'autre).
  - Cocotte : sur l'écran du duel, entre les deux joueurs.
  - Réduite : mêmes mots pour les deux joueurs ; duel contre le chien ; équipe en session 2.
  - S'appuie sur : chien, zombies, J25.
  - Texte lu : « Invite un frère, une sœur ou un copain : c'est l'heure du duel ! Tu es seul ? Défie ton chien… il aboie les lettres ! »
  - Devinette : « Combien de lettres y a-t-il dans "l'alphabet" ? » — « Huit : A, L, P, H, A, B, E, T ! »

- [ ] **J27 · mer. 16 déc. · v1.45.0 — Bulletin et médailles.**
  - Session 1 : le **bulletin** arrive par le pigeon voyageur (mots appris, zombies, lieux) ; Alaric le lit avec une
    petite fanfare ; médailles rigolotes (« Ami des moutons », « Roi des mots longs », « Le plus gourmand ») ;
    résumé dans l'espace parents. Ensuite, chaque dimanche.
  - Session 2 : **5 médailles à gagner** avec leur objectif visible (« Ami des moutons : caresse 10 moutons ») ;
    les médailles se portent sur le costume.
  - Plus fun : la fanfare ; les noms des médailles.
  - Cocotte : sur le podium, avec une médaille en chocolat.
  - Réduite : bilan à la demande ; 3 médailles à gagner.
  - S'appuie sur : J4, J19, statistiques.
  - Texte lu : « Bravo ! Voici ton bulletin, avec tes médailles. Il en reste à gagner : à toi de jouer ! Montre-le à tes parents : ils seront fiers de toi ! »
  - Devinette : « Que dit le zéro au huit ? » — « Jolie ceinture ! »

- [ ] **J28 · jeu. 17 déc. · v1.46.0 — Le temple des énigmes.**
  - Session 1 : un temple englouti sort du marais ; salles 1 et 2 : leviers et anagrammes posées par une statue
    géante.
  - Session 2 : salles 3 et 4 : mots croisés simples, passage secret derrière une lettre à toucher, le trésor
    (couronne du temple).
  - Plus fun : la statue rit très fort quand on trouve ; dans le dernier couloir, un rocher roule derrière toi et
    s'arrête juste avant (« Ouf ! »).
  - Cocotte : sur une statue, une Cocotte en pierre qui cligne de l'œil.
  - **Point de contrôle joueurs.** Réduite : 3 anagrammes par session.
  - S'appuie sur : marais, J5.
  - Texte lu : « Un temple ancien est sorti du marais ! Ses portes s'ouvrent avec des énigmes de mots. Seras-tu assez malin pour atteindre son trésor ? »
  - Devinette : « Je suis plein de trous, mais je garde l'eau. Qui suis-je ? » — « Une éponge ! »

- [ ] **J29 · ven. 18 déc. · v1.47.0 — La grande fête de Noël.**
  - Session 1 : les préparatifs : le pigeon distribue les invitations, l'**œuf de dragon éclot** (un bébé dragon
    devient compagnon), Cocotte arrive avec son chapeau de plumes, le sapin s'illumine.
  - Session 2 : la fête : **feux d'artifice qui écrivent dans le ciel** les mots appris (chaque fusée = un mot
    épelé) ; **photo de groupe** avec tous les amis, à garder ; la réponse du Père Noël (J19).
  - Plus fun : tout le village danse ; le bébé dragon éternue de petites flammes.
  - Cocotte : elle ne se cache plus, elle est l'invitée d'honneur.
  - Réduite : feux d'artifice + amis sur la place en session 2 ; éclosion en session 1.
  - S'appuie sur : J19, J20, J24, fils rouges.
  - Texte lu : « C'est la grande fête de l'Empire des Mots ! Tous tes amis t'attendent sur la place, et quelqu'un sort de son œuf… Joyeux Noël, champion des mots ! »
  - Devinette : « Que fait le Père Noël quand il fait une roulade ? » — « Ho ho ho… à l'envers : oh oh oh ! »

- [ ] **J30 · sam. 19 déc. · v1.48.0 — Mode Légende.**
  - Session 1 : **cérémonie** : Alaric te sacre « Légende des mots » devant tout le village, avec ton bilan des
    30 jours.
  - Session 2 : le **mode Légende**, une deuxième sauvegarde (la partie actuelle continue) : on garde le chien, le
    bébé dragon, la maison et les costumes ; mots plus durs ; nouveaux défis ; **modes farfelus** à choisir (tout
    le monde géant, moutons arc-en-ciel, zombies en pyjama la nuit).
  - Plus fun : les modes farfelus ; Cocotte se cache désormais chaque jour dans une de ses anciennes cachettes, au hasard.
  - Cocotte : nouvelle cachette chaque jour.
  - Réduite : cérémonie + mode Légende qui garde le chien.
  - S'appuie sur : tout.
  - Texte lu : « Tu as terminé l'aventure… mais une légende ne s'arrête jamais ! Le mode Légende t'attend, avec tes amis, ta maison et des mots encore plus forts. »
  - Devinette : « Qu'est-ce qui n'a ni début ni fin ? » — « Un cercle… comme ta légende ! »
