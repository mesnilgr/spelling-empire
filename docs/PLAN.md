# Plan des 30 releases (21 novembre → 20 décembre 2026)

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

## Processus

`npm test` → `CHROME_PATH=/usr/bin/google-chrome node tests/e2e/run.mjs` (suite complète ~3–4 min) →
`npx vite build` → CHANGELOG.md (section en tête, en français, pour les parents) → commit (auteur
`mesnilgr <gregoire@incalia.fr>`) → `git push origin HEAD:main` → publier `dist/` sur l'artifact
`272c1d81-9603-4155-88c3-832920e17093` (mode replace, label = version) → cocher la ligne ci-dessous.

## Les 30 releases

Statut : `[x]` publiée · `[ ]` à faire. Version : J1 = v1.19.0, puis +1 en mineure par jour (J2 = v1.20.0…).

### Semaine 1 — Revenir chaque jour

- [x] **J1 · sam. 21 nov. (publiée le 20) · v1.19.0 — Quoi de neuf, journal et Fer le golem de fer.**
  Carte d'Alaric écrite + lue à chaque release (Montre-moi / Plus tard), journal 📜 ; Fer patrouille la place,
  écrase les zombies la nuit, offre une fleur par jour.
- [ ] **J2 · dim. 22 nov. · v1.20.0 — Défis du jour.** Trois missions qui changent chaque jour (« Nourris ton chien »,
  « Trouve 2 coffres », « Épelle 5 mots du premier coup », « Dis bonjour à Fer »…), un coffre surprise devant la
  chaumière quand les trois sont faites. S'appuie sur : J1, chien, coffres, zombies, lieux.
  Réduite : 3 missions fixes du jour tirées d'une liste.
  Texte lu : « Nouveau ! Chaque jour, trois défis t'attendent. Réussis-les tous et un coffre surprise apparaîtra devant ta maison ! »
- [ ] **J3 · lun. 23 nov. · v1.21.0 — Série de jours 🔥.** Flamme qui grandit pour chaque jour joué d'affilée (jour où un
  défi du jour est fait), calendrier de 7 récompenses (7e jour : un chapeau pour le chien). S'appuie sur : J2.
  Réduite : la flamme + une récompense au 7e jour.
  Texte lu : « Ta flamme 🔥 grandit chaque jour où tu joues ! Reviens demain pour la faire grandir encore. Au septième jour, une grosse surprise ! »
- [ ] **J4 · mar. 24 nov. · v1.22.0 — Album de collection.** Carnet à cases : espèces d'animaux (`fauna.js`), lieux
  (`landmarks.js`), boss, objets fabriqués, Mimots ; une page complète donne un costume. S'appuie sur : J2, J3.
  Réduite : pages animaux et lieux seulement.
  Texte lu : « Voici ton album ! Chaque animal que tu croises, chaque lieu, chaque boss va s'y coller. Remplis une page entière pour gagner un costume ! »
- [ ] **J5 · mer. 25 nov. · v1.23.0 — Pouvoirs des mots.** Un mot difficile (niveau au-dessus de l'âge ou mot « en cours »)
  réussi du premier coup donne un pouvoir de 20 s : vitesse, super saut, géant, planer. Icône + compte à rebours.
  Réduite : vitesse et super saut.
  Texte lu : « Les mots ont des pouvoirs ! Réussis un mot difficile et tu pourras courir comme le vent, sauter jusqu'aux nuages ou devenir géant ! »
- [ ] **J6 · jeu. 26 nov. · v1.24.0 — Boss vivants et golem de cuivre.** Les golems des boss (mousse, pierre) marchent
  dans leur repaire et lèvent les bras quand on approche ; nouvelle recette « petit golem de cuivre » (fer + pierre +
  feu) qui suit le héros 3 minutes et ouvre les coffres secrets (boutons cachés dans 3 lieux). S'appuie sur : J1 (Fer), boss.
  Réduite : boss qui marchent + golem de cuivre qui suit.
  Texte lu : « Les golems des boss se réveillent un peu : ils marchent dans leur repaire ! Et tu peux fabriquer ton propre petit golem de cuivre. Il connaît des coffres secrets… »
- [ ] **J7 · ven. 27 nov. · v1.25.0 — Golem de neige et boules de neige.** Un golem de neige dans la montagne lance des
  boules de neige (pas de dégâts, juste « Pouf ! ») ; bouton pour en renvoyer ; 3 touches = il donne un cristal.
  **Point de contrôle joueurs.** Réduite : il lance, on esquive.
  Texte lu : « Dans la montagne, un golem de neige veut jouer ! Évite ses boules de neige et renvoie-lui les tiennes. Qui gagnera la bataille ? »

### Semaine 2 — Aventures et hiver

- [ ] **J8 · sam. 28 nov. · v1.26.0 — Wagonnet de la mine.** Trajet en wagonnet depuis la mine abandonnée (rails,
  tunnels) ; à chaque aiguillage, choisir le mot bien écrit entre deux ; la bonne voie mène aux diamants. Réduite : rail droit, 3 aiguillages.
  Texte lu : « Monte dans le wagonnet de la mine ! À chaque aiguillage, choisis le mot bien écrit : la bonne voie mène au trésor de diamants ! »
- [ ] **J9 · dim. 29 nov. · v1.27.0 — Chronos et records.** Parcours de lave, wagonnet, course à cheval chronométrés ;
  meilleur temps sur un panneau. Réduite : lave + wagonnet.
  Texte lu : « Attention, prêts, partez ! Le parcours de lave, le wagonnet et la course à cheval ont un chrono. Bats ton record ! »
- [ ] **J10 · lun. 30 nov. · v1.28.0 — Chasse au trésor.** Carte du pirate (épave) : indices courts à lire qui mènent de
  lieu en lieu jusqu'au grand coffre. Réduite : 3 indices.
  Texte lu : « Le pirate a laissé une carte au trésor ! Lis bien chaque indice : il te dira où aller ensuite. Au bout, un coffre plein d'or ! »
- [ ] **J11 · mar. 1er déc. · v1.29.0 — L'hiver et le calendrier de l'Avent.** Neige sur le monde (décembre) ; une case par
  jour jusqu'au 24 : un mot de Noël à épeler, un cadeau (boules de sapin pour J20, décorations, étoiles). Réduite : calendrier sans neige au sol.
  Texte lu : « Il neige sur l'Empire des Mots ! Chaque matin jusqu'à Noël, ouvre une case du calendrier : épelle le mot caché et découvre ton cadeau ! »
- [ ] **J12 · mer. 2 déc. · v1.30.0 — Surprises et marchand ambulant.** Étoile filante à attraper la nuit, arc-en-ciel
  qui mène à un coffre, marchand qui passe 5 min avec des objets rares (contre étoiles + un mot). Réduite : étoile filante + marchand.
  Texte lu : « Ouvre l'œil ! Des étoiles filantes, des arcs-en-ciel et un marchand mystérieux apparaissent parfois. Ne les rate pas ! »
- [ ] **J13 · jeu. 3 déc. · v1.31.0 — Laine et couleurs.** Ciseaux (recette), tondre les moutons (laine selon leur couleur,
  repousse), teinture avec des fleurs. Réduite : tonte + laine blanche/rose.
  Texte lu : « Tes moutons ont une belle laine ! Tonds-les avec des ciseaux, puis colore la laine avec des fleurs. Tu vas pouvoir construire en couleurs ! »
- [ ] **J14 · ven. 4 déc. · v1.32.0 — Mode construction.** Poser / empiler / retirer des blocs (bois, pierre, verre, laine)
  sur un terrain près de la chaumière ; chaque bloc coûte un matériau ; sauvegardé. **Point de contrôle joueurs.** Réduite : un niveau, 3 sortes de blocs.
  Texte lu : « À toi de construire ! Pose des blocs de bois, de pierre, de verre ou de laine sur ton terrain. Tour, château ou cabane : tout est possible ! »

### Semaine 3 — Mes amis, ma maison, mon village

- [ ] **J15 · sam. 5 déc. · v1.33.0 — Chats et loups apprivoisables.** Un mot pour apprivoiser ; le chat rapporte des poissons,
  le loup chasse les zombies avec le chien ; choisir qui accompagne. Réduite : le chat seulement.
  Texte lu : « Les chats et les loups peuvent devenir tes amis ! Épelle un mot pour les apprivoiser, puis choisis qui part à l'aventure avec toi. »
- [ ] **J16 · dim. 6 déc. · v1.34.0 — Le potager.** Graines (carotte, pomme de terre, citrouille), arroser avec un mot, pousse en
  temps réel (quelques minutes), récolte. Réduite : carottes seulement.
  Texte lu : « Ton potager t'attend devant la maison ! Plante des graines, arrose-les, et reviens les récolter quand elles ont poussé. »
- [ ] **J17 · lun. 7 déc. · v1.35.0 — La cuisine.** Recettes : soupe (+1 cœur temporaire), gâteau (un pouvoir de J5),
  carotte dorée (cheval plus rapide). Réduite : soupe + carotte dorée.
  Texte lu : « À la cuisine ! Avec tes légumes, prépare une soupe qui donne des forces ou un gâteau magique plein de pouvoirs. Miam ! »
- [ ] **J18 · mar. 8 déc. · v1.36.0 — Tableau des quêtes.** Tableau à la taverne : demandes des villageois qui changent
  (légumes, laine, poissons, plats), récompenses. Réduite : 3 demandes par jour.
  Texte lu : « Les villageois ont besoin de toi ! Regarde le tableau de la taverne : chaque demande réussie rapporte des étoiles et des surprises. »
- [ ] **J19 · mer. 9 déc. · v1.37.0 — Lettres et facteur.** Écrire une courte lettre (phrase dictée, niveau phrases adapté à l'âge)
  et la porter ; réponse le lendemain. Réduite : une lettre par jour, réponse immédiate.
  Texte lu : « Tu deviens le facteur du village ! Écris une petite lettre, porte-la à son destinataire… et attends sa réponse demain ! »
- [ ] **J20 · jeu. 10 déc. · v1.38.0 — Le sapin du village.** Grand sapin sur la place à décorer (boules et guirlandes gagnées
  en épelant et dans le calendrier). Réduite : boules seulement.
  Texte lu : « Un immense sapin est arrivé sur la place ! Gagne des boules et des guirlandes en épelant, et décore-le pour la grande fête de Noël. »
- [ ] **J21 · ven. 11 déc. · v1.39.0 — Équilibrage et fluidité.** Corrections des retours, réglage des récompenses et des prix,
  performance iPad. **Point de contrôle joueurs.**
  Texte lu : « Cette fois, j'ai fait le grand ménage : le jeu est plus rapide et j'ai réparé les petits soucis que vous m'avez signalés. Merci ! »

### Semaine 4 — Le Nether et le grand final

- [ ] **J22 · sam. 12 déc. · v1.40.0 — Le Nether.** Le portail mène à une petite zone séparée (chargée à l'entrée) : sol rouge,
  rivières de lave, pierre lumineuse, champignons géants, forteresse avec coffre ; portail de retour. Réduite : une île rouge + coffre.
  Texte lu : « Le portail s'ouvre sur un monde de feu : le Nether ! Rivières de lave et pierres qui brillent… Explore-le, mais garde ton seau de lave près de toi ! »
- [ ] **J23 · dim. 13 déc. · v1.41.0 — Les habitants du Nether.** Piglins marchands (or ↔ objets rares), petits monstres de feu à
  éteindre avec un seau d'eau (recette). Réduite : Piglins seulement.
  Texte lu : « Dans le Nether vivent les Piglins : ils adorent l'or ! Échange avec eux, et éteins les petits monstres de feu avec ton seau d'eau. »
- [ ] **J24 · lun. 14 déc. · v1.42.0 — Le Dragon de lave.** Boss du Nether, 3 phases, 5 mots plus difficiles, pouvoirs + seau d'eau. Réduite : boss à 5 mots.
  Texte lu : « Au fond du Nether dort le Dragon de lave, le plus grand boss de l'Empire ! Il faudra cinq mots et tous tes pouvoirs pour le vaincre. Courage ! »
- [ ] **J25 · mar. 15 déc. · v1.43.0 — Le tournoi des mots d'Alaric.** Manches de plus en plus difficiles (révision espacée),
  coupe bronze / argent / or dans la chaumière. Réduite : 3 manches, une coupe.
  Texte lu : « Grand tournoi des mots ! Chaque manche est un peu plus difficile. Arriveras-tu jusqu'à la coupe d'or ? »
- [ ] **J26 · mer. 16 déc. · v1.44.0 — Duel à deux sur le même iPad.** Tour à tour, chacun avec les mots de son âge. Réduite : mêmes mots pour les deux.
  Texte lu : « Invite un frère, une sœur ou un copain : c'est l'heure du duel ! Chacun épelle ses mots à son tour. Que le meilleur gagne ! »
- [ ] **J27 · jeu. 17 déc. · v1.45.0 — Bulletin et médailles.** Bilan du dimanche (mots appris, zombies, lieux) avec médailles pour
  l'enfant, résumé dans l'espace parents. Réduite : bilan à la demande.
  Texte lu : « Bravo ! Chaque dimanche, je te remettrai ton bulletin avec tes médailles. Montre-le à tes parents : ils seront fiers de toi ! »
- [ ] **J28 · ven. 18 déc. · v1.46.0 — Le temple des énigmes.** Temple englouti du marais : leviers, anagrammes, mots croisés simples.
  **Point de contrôle joueurs.** Réduite : 3 anagrammes.
  Texte lu : « Un temple ancien est sorti du marais ! Ses portes s'ouvrent avec des énigmes de mots. Seras-tu assez malin pour atteindre son trésor ? »
- [ ] **J29 · sam. 19 déc. · v1.47.0 — La grande fête de Noël.** Sapin illuminé, feux d'artifice, tous les amis sur la place,
  cadeaux du calendrier, générique avec le chien de l'enfant. Réduite : feux d'artifice + amis sur la place.
  Texte lu : « C'est la grande fête de l'Empire des Mots ! Tous tes amis t'attendent sur la place pour les feux d'artifice. Joyeux Noël, champion des mots ! »
- [ ] **J30 · dim. 20 déc. · v1.48.0 — Mode Légende.** Nouvelle partie « + » : on garde chien, maison, costumes ; mots plus durs ;
  nouveaux défis. Réduite : garder le chien.
  Texte lu : « Tu as terminé l'aventure… mais une légende ne s'arrête jamais ! Le mode Légende t'attend, avec ton chien, ta maison et des mots encore plus forts. »
