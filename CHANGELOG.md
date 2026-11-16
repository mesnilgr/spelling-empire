# Changelog

## v1.6.0 — Apprendre plus, et des tests qui veillent

- **Deux fois plus de mots** : 22 lettres, 40 syllabes, 36 premiers mots, 40 mots CP, 53 sons complexes, 40 pièges CE1, 40 mots CE2 et 40 mots irréguliers. Chaque mot a sa phrase d'exemple.
- **Révision espacée à la Anki** (algorithme SM-2, adapté au jeu) : chaque mot est une carte qui revient juste avant d'être oublié.
  - Un nouveau mot réussi revient une fois dans la partie (10 minutes plus tard), puis le lendemain, puis à des intervalles qui grandissent (3 jours, une semaine, un mois…) selon la facilité du mot pour l'enfant.
  - Une erreur fait revenir le mot 10 minutes plus tard, rend son intervalle plus court et le mot plus « difficile ».
  - Le jeu note tout seul, sans boutons : erreur = « à revoir », réussi après une erreur = « difficile », réussi du premier coup = « bien », réussi vite = « facile ».
  - Ordre de choix : les mots en cours d'apprentissage, puis les mots à revoir (les plus en retard d'abord, y compris dans les listes plus faciles), puis de nouveaux mots, jusqu'à une limite par jour (15 par défaut, réglable dans l'espace parents), puis l'entraînement des mots connus les plus difficiles.
  - L'espace parents indique les mots à revoir aujourd'hui, les mots appris, les nouveaux mots du jour et la prochaine révision de chaque mot.
- **Pour les 8 ans, deux nouveaux niveaux :**
  - **homophones** : une phrase à trous s'affiche (« Le chat ___ le chien jouent. ») et l'enfant écrit le petit mot qui manque (a/à, et/est, son/sont, on/ont, ou/où) ;
  - **petites phrases** en dictée (« les chats dorment »), avec les accords ; les espaces se mettent tout seuls.
- Les 8 ans commencent maintenant au CE2 (les pièges CE1 restent pour les 7 ans).
- **Tests de parcours** dans le dépôt (`npm run test:e2e`) : 8 scénarios et 85 vérifications (plus 17 tests unitaires de l'algorithme de révision), qui jouent toute l'histoire, la magie, l'écriture à la main, les homophones, les phrases, la révision, et contrôlent un budget d'affichage pour l'iPad. Une action GitHub les lance à chaque modification.

## v1.5.0 — La montagne, la mer et la fin de l'histoire

- 🏔️ **La montagne** (nord) : pentes, rochers, sapins, un sommet enneigé entouré d'une falaise. Le nouveau sort **Pierre** fait apparaître un escalier jusqu'à la tour d'Alaric.
- 🏖️ **La plage** (sud) : la mer, des dunes, un phare à rallumer avec le sort **Lumière**, un ponton, et l'**île de papier**, une page du grand livre couverte de mots et entourée de lettres flottantes.
- **Chapitre 4** : grimper au sommet, apprivoiser 2 Mimots de la neige, lire le grand livre. **Deuxième rebondissement :** les mots sont vivants dans le livre.
- **Chapitre 5** : rallumer le phare, poser un pont vers l'île de papier, apprivoiser 3 Mimots de papier, puis **choisir quoi proposer à Alaric**. Les deux choix mènent à un épilogue doux : l'album des mots de l'enfant devient la mémoire d'Alaric.
- **Écran de fin** (mots, Mimots, étoiles) avec un feu d'artifice, puis le jeu continue en épilogue. 13 Mimots au total.
- **Espace parents** : réussite du premier coup par famille de sons (ch, ou, on, an/en, in/ain, au/eau, oi, gn, e muet, lettres muettes, consonnes doubles, accents) et chapitre en cours.

## v1.4.0 — La forêt et le marais (chapitres 2 et 3)

- **Carte quatre fois plus grande** : le village reste au centre, des vallées traversent les collines vers deux nouvelles régions, et des collines ferment le bout du monde.
- 🌲 **La forêt des sapins** (ouest) : 150 sapins, champignons, fougères, une rivière, la cabane de **Sylvain le forestier**.
- 🪷 **Le marais** (est) : mares, roseaux, nénuphars, arbres morts, une passerelle de bois, et **Mélusine la pêcheuse**.
- **Chapitre 2** : réparer le panneau de la forêt, jeter un pont sur la rivière (sort Pont), aider Sylvain, apprivoiser 2 Mimots, trouver la deuxième page.
- **Chapitre 3** : réparer le panneau du marais, chasser la brume (nouveau sort **Vent**), aider Mélusine, rallumer les lanternes (sort Feu), apprivoiser 2 Mimots, trouver la troisième page… et découvrir qui emprunte les mots du village.
- **Panneaux de voyage** : un panneau réparé permet de s'y rendre d'un coup depuis n'importe quel autre panneau (celui du village est près de la fontaine).
- **Fluidité iPad** : chaque région est fusionnée et masquée quand on est loin, les arbres, roseaux et brumes sont dessinés en instances, et le terrain est découpé en morceaux pour ne dessiner que ce qui est à l'écran. Le village reste aussi léger qu'avant. Le soleil et les ombres suivent le héros.

## v1.3.0 — Le village qui oubliait ses mots (chapitre 1)

- **Une histoire commence.** Au début d'une partie, le conteur explique que les mots se sont envolés du village. Tous les dialogues sont lus à voix haute, avec un bouton 🔊 pour réécouter.
- **Bandeau d'objectif** en haut de l'écran (chapitre et objectif), et une ⭐ sur la minicarte qui montre où aller.
- **Chapitre 1, « Les panneaux effacés » :**
  1. parler à Alaric, qui confie le grimoire (les sorts se débloquent à ce moment-là) ;
  2. réécrire le nom de 3 maisons sur leur panneau (taverne, forge, tour ; à 5 ans, la première lettre) ;
  3. apprivoiser le premier **Mimot**, une petite créature-mot, près de la fontaine ;
  4. ramasser une page arrachée, écrite d'une main mystérieuse…
- **Mimots :** 4 Mimots se promènent dans le village, avec la première lettre de leur mot sur le ventre. On écrit leur mot pour les apprivoiser. Leur nombre est indiqué dans l'album.
- Le chapitre 2 (la forêt) est annoncé : il arrive avec la carte agrandie.

## v1.2.0 — La magie des mots

- **Grimoire 🔮** : 8 sorts. Le mot à écrire dépend de l'âge : la première lettre à 5 ans (« P comme pont »), un mot simple à 6 ans (« lune » pour Lumière), le mot entier à 7 et 8 ans.
- **Cercles magiques violets** dans le village : on les touche, on écrit le mot, le sort se lance.
  - 🌉 **Pont** : un pont au-dessus de la mare, qu'on peut traverser, avec une île et un coffre au trésor.
  - 🌸 **Fleur** et 🌳 **Arbre** : des fleurs et un arbre magique à ramasser sans outil.
  - 🌧️ **Pluie** : le blé repousse tout de suite.
  - ✨ **Lumière** : une boule de lumière suit le héros et éclaire la nuit.
  - 🔥 **Feu** : les braseros de la place s'allument et donnent du feu.
  - 🌬️ Vent et 🪨 Pierre arriveront avec les nouvelles régions.
- **Puissance du sort** : pleine si le mot est juste du premier coup, « un peu de travers » après une erreur, petite si on a recopié. On n'est jamais bloqué.
- Certains sorts se débloquent avec les étoiles. Le pont et les braseros restent après une sauvegarde.
- Près du pont, le héros est guidé sur son axe, pour traverser facilement au joystick.

## v1.1.0 — Les âges

- **Choix de l'âge (5, 6, 7 ou 8 ans)** au premier lancement, modifiable dans l'espace parents.
- **Des mots pour chaque âge**, calés sur l'école :
  - 5 ans (grande section) : lettres (« La lettre èm… comme dans maman »), syllabes (ma, lo, ri), petits mots (lama, kiwi, pyjama) ;
  - 6 ans (CP) : mots simples, puis e muet et sons à plusieurs lettres ;
  - 7 ans (CE1) : sons complexes, lettres muettes, consonnes doubles ;
  - 8 ans (CE2) : accents, ç, g doux, gu, ph, -tion (forêt, garçon, dauphin), puis mots irréguliers (femme, monsieur, beaucoup).
- Comme avant, les maisons donnent les mots les plus faciles de l'âge, l'extérieur le niveau au-dessus, le diamant et l'obsidienne le niveau encore au-dessus.
- **Le jeu grandit avec l'enfant :** quand 90 % d'une liste est réussie du premier coup, il passe à la suivante.
- **Aides selon l'âge :** modèle grisé activé à 5 et 6 ans, mode écriture par défaut à 5 ans.
- En mode écriture, un mot terminé se valide tout seul, puisque chaque lettre est déjà vérifiée.
- L'album des mots et le tableau des parents montrent les listes de l'âge de l'enfant.

## v1.0.0 — 15 novembre 2026

Première version jouable d'**Empire des Mots / Spelling Empires**, un jeu d'orthographe bilingue (français / anglais) dans un village en blocs, pensé pour l'iPad.

### Jouer
- Village en blocs avec 6 bâtiments à explorer (vue en coupe quand on entre), collines, carrière, mare et forêt.
- Chaque point de minage montre le matériau qu'il donne ; on le touche, le héros y va, on écoute le mot et on l'écrit.
- Difficulté intégrée au monde : maisons = niveau 1, dehors = niveau 2, diamant et obsidienne = niveau 3.
- 16 objets à fabriquer (outils, torche, lanterne, canne à pêche, baguette, potion, pain, maison, bateau, outils en diamant et en obsidienne), utilisables avec un bouton.
- Coffres au trésor, cycle jour / nuit avec champignons lumineux, pêche, quêtes de 5 villageois, album des mots, garde-robe de 9 tenues.
- Saut, retour au village, minicarte, sauvegarde automatique de la partie.
- Un lit dans la chaumière pour passer à la nuit ou revenir au matin, repéré « 🛏️ Lit » sur la minicarte.

### Écrire
- Clavier à l'écran (voyelles surlignées) ou **mode écriture à la main** reconnu sur l'appareil (capitales, minuscules, écriture attachée, accents).
- Lettre modèle grisée à repasser (désactivable), nom et son de la lettre dits quand elle est juste, bouton pour revenir au clavier.
- Après 3 erreurs, le mot s'affiche et doit être recopié pour continuer.
- Une phrase d'exemple lue à voix haute pour chaque mot.

### Parents
- Espace parents : mots rencontrés, réussites, dernières erreurs, activité sur 14 jours, sauvegarde / restauration.

### iPad
- Plein écran, commandes tactiles, qualité graphique qui s'adapte si le jeu ralentit. Ajoutez `?fps` à l'adresse pour afficher un compteur d'images par seconde.

### Correctifs inclus
- En écriture à la main, un « a » avec une petite queue ou une barre un peu longue était lu comme un « q » : réseau réentraîné, et entre deux lettres qui se ressemblent (a/q, i/l, n/h…) c'est le mot qui tranche.
- En écriture à la main, une mauvaise lettre n'est plus écrite : l'enfant reste sur la même lettre jusqu'à ce qu'elle soit juste (« On dirait un X, essaie encore ! »). S'il manque juste le point ou l'accent, le dessin est gardé pour qu'il l'ajoute. Après 3 essais, le modèle grisé réapparaît et le jeu se montre plus tolérant.
- Avec beaucoup d'objets dans l'inventaire, le bouton « Fabrication » sortait de l'écran : il reste maintenant toujours visible et l'inventaire passe sur plusieurs lignes.
