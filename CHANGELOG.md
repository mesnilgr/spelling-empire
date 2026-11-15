# Changelog

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
