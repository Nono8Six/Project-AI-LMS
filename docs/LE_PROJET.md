# Product Requirements Document (PRD)
## LMS IA - Plateforme d'Apprentissage Adaptatif par Intelligence Artificielle

**Version**: 1.0  
**Date**: Septembre 2025
**Statut**: Document de référence pour développement V1  
**Créateur**: Arnaud

---

## 1. VISION ET OBJECTIFS STRATÉGIQUES

### 1.1 Énoncé de Vision

Créer la première plateforme française d'apprentissage qui utilise l'intelligence artificielle conversationnelle pour personnaliser en temps réel le parcours pédagogique de chaque apprenant. Notre système ne se contente pas de diffuser du contenu : il dialogue, évalue, s'adapte et garantit une vraie compréhension avant chaque progression.

### 1.2 Objectifs Principaux

**Objectif pédagogique**: Amener chaque apprenant de débutant complet en IA à utilisateur autonome et avancé, avec un taux de complétion supérieur à 70% (versus 15% de moyenne dans l'industrie) grâce à l'adaptation personnalisée de l'intelligence artificielle.

**Objectif business**: Atteindre 1000 utilisateurs payants dans les 6 premiers mois avec un panier moyen de 47€ et un taux de conversion visiteur vers acheteur de 3%.

**Objectif technique**: Développer une architecture modulaire permettant l'ajout rapide de nouveaux cours et formats d'interaction sans refonte du système, tout en gardant une simplicité maximale pour un développeur solo non expérimenté.

### 1.3 Principes Directeurs

- **Simplicité avant tout**: Chaque fonctionnalité doit être compréhensible par un utilisateur non-technique et implémentable par un développeur débutant
- **Pédagogie adaptative**: L'IA ne juge pas, elle accompagne et s'adapte au rythme de chacun avec bienveillance
- **Validation par la pratique**: La compréhension théorique est toujours validée par une mise en pratique concrète
- **Transparence du progrès**: L'apprenant sait toujours où il en est et ce qu'il lui reste à accomplir
- **Économie maîtrisée**: Chaque interaction IA est optimisée pour minimiser les coûts tout en maximisant la valeur pédagogique
- **Mono‑app V1**: Monorepo conservé; admin intégré dans la même application Next.js
- **Auth V1**: Supabase Auth avec Magic Link + Google OAuth

---

## 2. ANALYSE DU MARCHÉ ET POSITIONNEMENT

### 2.1 Problèmes Identifiés sur le Marché Actuel

Les plateformes actuelles comme Udemy, Coursera ou OpenClassrooms souffrent de limitations majeures que notre approche résout directement.

Le premier problème est l'apprentissage passif. Sur ces plateformes, les apprenants regardent des vidéos et répondent à des questionnaires à choix multiples, mais rien ne garantit qu'ils ont vraiment compris. Un apprenant peut mettre une vidéo en vitesse accélérée, cocher des cases au hasard, et obtenir son certificat sans avoir réellement assimilé les concepts. Notre approche par IA conversationnelle change complètement la donne : l'intelligence artificielle engage une vraie conversation pédagogique qui révèle immédiatement les zones d'incompréhension et ne laisse rien passer.

Le deuxième problème est l'absence totale de personnalisation. Ces plateformes proposent un cours identique pour tous les apprenants, qu'ils soient visuels, auditifs ou kinesthésiques, qu'ils aient besoin d'exemples concrets ou préfèrent la théorie abstraite. Notre IA détecte progressivement le style d'apprentissage de chaque utilisateur et adapte automatiquement ses explications : des métaphores visuelles pour ceux qui ont besoin de "voir" les concepts, des exemples pratiques pour ceux qui apprennent en faisant, des explications structurées pour les esprits analytiques.

Le troisième problème est le feedback générique et inutile. Quand un apprenant se trompe sur ces plateformes, il reçoit au mieux un message type "Mauvaise réponse, réessayez" qui n'aide en rien à progresser. Notre IA, elle, analyse précisément ce qui n'est pas compris, identifie la source de confusion, et propose une nouvelle approche pédagogique adaptée. Si l'apprenant confond deux concepts, l'IA le détecte et clarifie la distinction. Si c'est un problème de vocabulaire, elle reformule. Si c'est un manque de pratique, elle propose des exercices ciblés.

### 2.2 Notre Différenciation Unique

Notre plateforme combine trois innovations majeures qui créent une expérience d'apprentissage révolutionnaire, particulièrement pour l'apprentissage de l'IA.

Premièrement, l'évaluation conversationnelle par IA rend impossible la triche ou le survol superficiel. Contrairement à un QCM où on peut deviner la bonne réponse, une conversation avec l'IA révèle immédiatement si l'apprenant a vraiment compris ou s'il récite sans comprendre. L'IA peut demander d'expliquer avec ses propres mots, de donner des exemples personnels, de faire des analogies, toutes choses impossibles sans vraie compréhension.

Deuxièmement, l'adaptation pédagogique en temps réel avec notre système de trois tentatives garantit que personne n'est laissé sur le bord de la route. Si un apprenant ne comprend pas avec une explication technique, l'IA bascule automatiquement sur des métaphores du quotidien. Si les métaphores ne fonctionnent pas, elle décompose le concept en micro-étapes ultra simples. C'est comme avoir un tuteur personnel infiniment patient qui essaie différentes approches jusqu'à trouver celle qui fonctionne pour vous.

Troisièmement, nos certificats ont une valeur réelle grâce aux preuves d'apprentissage vérifiables. Un employeur peut scanner le QR code du certificat et consulter des extraits anonymisés des conversations avec l'IA qui prouvent la profondeur de compréhension. C'est infiniment plus crédible qu'un score de 85% à un quiz qu'on peut refaire jusqu'à avoir la bonne note.

### 2.3 Focus sur l'IA : Le Premier Cours Parfait

Le choix de commencer par un cours sur l'IA n'est pas anodin. L'IA est LE sujet du moment, celui qui transforme tous les métiers, et paradoxalement celui sur lequel il y a le plus de confusion et de mésinformation. Les gens savent qu'ils doivent s'y mettre mais ne savent pas par où commencer. Ils ont peur d'être largués, de ne pas comprendre, de mal l'utiliser.

Notre premier cours "Maîtriser l'IA au Quotidien : De Débutant à Expert" est conçu pour transformer cette anxiété en maîtrise confiante. Il ne s'agit pas d'un cours technique sur le machine learning, mais d'un parcours pratique pour apprendre à utiliser l'IA comme un outil quotidien : écrire de meilleurs prompts, comprendre les capacités et limites de l'IA, l'intégrer dans son travail, éviter les pièges courants.

---

## 3. PERSONAS ET PARCOURS UTILISATEURS

### 3.1 Persona Principal - Marie, 35 ans, Responsable Administrative

Marie représente notre cœur de cible : les professionnels qui sentent que l'IA pourrait transformer leur travail mais ne savent pas comment s'y prendre. Elle a entendu parler de ChatGPT par ses collègues, a essayé deux ou trois fois, mais les résultats étaient décevants. Elle ne sait pas comment formuler ses demandes, obtient des réponses génériques, et finit par abandonner en se disant que c'est "pas pour elle".

Ses frustrations actuelles sont multiples. D'abord, elle se sent larguée par la vitesse à laquelle l'IA évolue. Chaque semaine, elle entend parler d'un nouvel outil, d'une nouvelle technique, et elle a l'impression de prendre toujours plus de retard. Ensuite, quand elle essaie d'apprendre par elle-même avec des tutoriels YouTube, elle se perd dans la masse d'information contradictoire. Certains disent qu'il faut faire comme ci, d'autres comme ça, et personne n'explique vraiment pourquoi. Enfin, elle n'a personne à qui poser ses questions "bêtes", celles qu'elle n'ose pas poser à ses collègues de peur de passer pour une débutante.

Son parcours sur notre plateforme commence par une recherche Google "apprendre à utiliser ChatGPT correctement" ou "formation IA pour débutants". Elle tombe sur notre page de cours qui promet quelque chose de différent : une IA qui va lui apprendre à utiliser l'IA. Intriguée, elle teste la première leçon gratuite. Là, surprise : au lieu de regarder passivement une vidéo, elle dialogue avec une IA pédagogue qui lui demande d'abord ce qu'elle veut accomplir avec l'IA dans son travail. Marie explique qu'elle aimerait automatiser ses comptes-rendus de réunion. L'IA lui montre alors, étape par étape, comment formuler le prompt parfait pour son cas précis, pas un exemple générique mais vraiment adapté à ses comptes-rendus à elle.

Convaincue par cette approche personnalisée, Marie achète le cours complet. Elle progresse à son rythme, généralement le soir après avoir couché les enfants, 20-30 minutes par session. L'IA se souvient d'elle, de ses objectifs, de ses difficultés. Quand Marie bloque sur la notion de "prompt engineering", l'IA ne lui sort pas une définition technique mais lui explique avec une métaphore de recette de cuisine : "Un prompt, c'est comme une recette que vous donnez à l'IA. Plus votre recette est précise, meilleur sera le plat." Ça fait tilt, Marie comprend enfin.

Après trois semaines, Marie a terminé le cours. Elle utilise maintenant l'IA quotidiennement dans son travail, gagne 2 heures par jour sur les tâches répétitives, et est devenue la référence IA de son service. Son certificat sur LinkedIn attire l'attention de son manager qui lui propose de former l'équipe.

### 3.2 Persona Secondaire - Thomas, 22 ans, Étudiant en Commerce

Thomas représente la génération qui sait que l'IA sera incontournable dans sa carrière mais qui l'utilise mal. Il connaît ChatGPT, l'utilise pour ses devoirs, mais se fait régulièrement avoir par des hallucinations de l'IA ou obtient des réponses trop génériques pour être utiles. Il a conscience qu'il passe à côté du potentiel de l'outil mais ne sait pas comment s'améliorer.

Ce qui l'attire dans notre formation, c'est la promesse de vraiment comprendre comment fonctionne l'IA, pas juste l'utiliser à l'aveugle. Le fait que ce soit une IA qui l'évalue le rassure paradoxalement : il sait qu'il ne pourra pas bluffer comme il le fait parfois en cours. L'IA conversationnelle devient son sparring partner pour améliorer ses prompts. Il peut tester, se tromper, recommencer, sans jugement.

Les sessions courtes de 15-20 minutes sont parfaites pour son emploi du temps d'étudiant. Il fait une leçon dans le RER le matin, une autre entre deux cours. Le certificat final sera un vrai plus sur son CV pour ses stages, d'autant qu'il peut prouver sa maîtrise avec des exemples concrets de ses échanges avec l'IA évaluatrice.

### 3.3 Persona Tertiaire - Philippe, 52 ans, Consultant Indépendant

Philippe représente les professionnels expérimentés qui voient l'IA arriver dans leur secteur et comprennent qu'ils doivent s'adapter ou devenir obsolètes. Il a une expertise métier solide mais se sent dépassé par la technologie. Les formations techniques le rebutent car trop complexes, mais les formations grand public sont trop superficielles pour ses besoins professionnels.

Notre approche adaptative est parfaite pour lui. L'IA détecte rapidement qu'il a besoin d'exemples concrets liés à son métier de consultant, pas de théorie abstraite. Elle adapte tous ses exemples au conseil en entreprise, lui montre comment utiliser l'IA pour analyser des marchés, rédiger des propositions commerciales, créer des présentations impactantes. Philippe apprécie particulièrement de pouvoir poser des questions précises sur ses cas clients (anonymisés) et recevoir des conseils personnalisés.

---

## 4. STACK TECHNIQUE COMPLÈTE ET EXPLIQUÉE

### 4.1 Comprendre l'Architecture Globale

Avant de plonger dans les détails techniques, prenons un moment pour comprendre ce qu'est une "stack technique" et pourquoi chaque élément est important. Imaginez que vous construisez une maison. La stack technique, c'est l'ensemble des matériaux et outils que vous allez utiliser : les fondations (base de données), les murs (framework web), la plomberie (système d'authentification), l'électricité (APIs), la décoration (interface utilisateur). Chaque élément a un rôle précis et ils doivent tous fonctionner ensemble harmonieusement.

Dans notre cas, nous construisons une plateforme d'apprentissage en ligne sophistiquée mais nous devons rester simples car vous développez seul sans être développeur professionnel. C'est comme construire une maison moderne avec des modules préfabriqués plutôt que de tout faire en partant de zéro. Nous allons utiliser des outils qui font beaucoup de travail pour nous, ce qui nous permet de nous concentrer sur ce qui rend notre plateforme unique : l'expérience d'apprentissage adaptative par IA.

### 4.2 Next.js : Le Cœur de l'Application

Next.js est ce qu'on appelle un "framework React". Pour comprendre ce que cela signifie, imaginez que vous voulez écrire un livre. Vous pourriez partir d'une page blanche et tout écrire vous-même, y compris la mise en page, la numérotation des pages, la table des matières. Ou vous pourriez utiliser un modèle Word qui s'occupe de tout ça pour vous, et vous n'avez qu'à écrire le contenu. Next.js, c'est ce modèle pour créer des sites web modernes.

React est une bibliothèque créée par Facebook pour construire des interfaces utilisateur interactives. Au lieu d'avoir des pages web statiques où il faut recharger toute la page à chaque action, React permet de créer des interfaces dynamiques où seules les parties qui changent sont mises à jour. C'est ce qui permet d'avoir cette fluidité qu'on retrouve dans les applications modernes.

Next.js va encore plus loin en ajoutant tout ce dont un site web moderne a besoin : le routage (comment naviguer entre les pages), l'optimisation des performances (pour que le site soit rapide), le SEO (pour être bien référencé sur Google), et même la possibilité de faire du rendu côté serveur (pour que les pages se chargent plus vite). Pour notre LMS, Next.js nous apporte plusieurs avantages cruciaux. D'abord, il gère automatiquement l'optimisation des images et vidéos, ce qui est essentiel pour une plateforme de formation. Ensuite, son système de routage nous permet de créer facilement la structure cours/modules/leçons. Enfin, sa gestion du SEO nous aidera à être trouvés sur Google quand les gens cherchent des formations IA.

La version 15 avec App Router que nous utilisons est la plus récente et apporte une nouveauté majeure : les React Server Components. C'est un concept un peu technique mais l'idée est simple : certaines parties de votre page peuvent être générées sur le serveur (plus rapide, meilleur pour le SEO) tandis que d'autres restent interactives côté client (pour les interactions utilisateur). C'est le meilleur des deux mondes.

### 4.3 TypeScript : La Sécurité du Code

TypeScript est une surcouche de JavaScript qui ajoute ce qu'on appelle du "typage statique". Pour comprendre l'intérêt, imaginez que vous écrivez une recette de cuisine. En JavaScript normal, vous pourriez écrire "ajouter du sel" sans préciser la quantité, et vous ne vous en rendriez compte qu'en goûtant le plat. TypeScript vous force à être précis dès le départ : "ajouter 5 grammes de sel". Si vous essayez de mettre autre chose qu'un nombre pour la quantité, TypeScript vous avertit immédiatement.

Pour un développeur débutant, TypeScript est une bénédiction déguisée. Au début, cela peut sembler contraignant de devoir déclarer le type de chaque variable, mais cela évite énormément d'erreurs. Par exemple, si vous avez une fonction qui calcule le prix d'un cours et que vous lui passez accidentellement le titre du cours au lieu du prix, TypeScript vous le signalera immédiatement au lieu de faire crasher l'application quand un utilisateur essaiera d'acheter.

TypeScript apporte aussi l'autocomplétion intelligente. Quand vous tapez du code, votre éditeur vous suggère automatiquement les propriétés et méthodes disponibles. C'est comme avoir un assistant qui vous rappelle constamment ce que vous pouvez faire. Pour quelqu'un qui apprend, c'est invaluable.

### 4.4 Supabase : La Base de Données et Plus Encore

Supabase est ce qu'on appelle un "Backend as a Service" (BaaS). C'est une plateforme qui vous donne tout ce dont un backend moderne a besoin : base de données, authentification, stockage de fichiers, et même des fonctions serverless. C'est comme louer un bureau tout équipé plutôt que de devoir installer l'électricité, internet, et les meubles vous-même.

Au cœur de Supabase se trouve PostgreSQL, l'une des bases de données les plus robustes et populaires au monde. Une base de données, c'est l'endroit où vous stockez toutes les informations de votre application : les utilisateurs, les cours, les progressions, les notes des évaluations IA. PostgreSQL est particulièrement adapté à notre usage car il supporte nativement le JSON, ce qui nous permet de stocker des structures de données complexes comme le contenu de nos leçons avec leurs différents blocs.

Mais Supabase ne s'arrête pas à la base de données. Il fournit aussi un système d'authentification complet. L'authentification, c'est tout ce qui concerne la connexion des utilisateurs : inscription, connexion, mot de passe oublié, validation d'email. Créer tout ça soi-même est complexe et risqué (les failles de sécurité dans l'authentification sont catastrophiques). Supabase s'occupe de tout avec les meilleures pratiques de sécurité.

Le système de stockage de Supabase nous servira pour héberger les fichiers uploadés par les utilisateurs (photos de profil, ressources téléchargeables des cours). C'est comme un Google Drive intégré à notre application, avec des permissions granulaires pour contrôler qui peut accéder à quoi.

Les Edge Functions de Supabase sont des petits morceaux de code qui s'exécutent sur les serveurs de Supabase. Nous les utiliserons principalement pour communiquer avec l'API de Gemini (notre IA) de manière sécurisée, sans exposer nos clés API aux utilisateurs.

### 4.5 Tailwind CSS et shadcn/ui : L'Interface Utilisateur

Tailwind CSS est ce qu'on appelle un framework CSS "utility-first". Le CSS, c'est le langage qui définit l'apparence de votre site : couleurs, tailles, espacements, animations. Traditionnellement, vous écrivez des règles CSS dans des fichiers séparés. Avec Tailwind, vous appliquez des classes directement dans votre HTML/JSX.

Pour comprendre la différence, imaginez que vous décorez une pièce. L'approche traditionnelle serait de créer un plan de décoration détaillé sur papier, puis de l'appliquer. L'approche Tailwind, c'est d'avoir une boîte à outils avec des éléments prédéfinis (coussin rouge, cadre doré, lampe moderne) que vous arrangez directement dans la pièce. C'est plus intuitif et plus rapide, surtout pour quelqu'un qui n'est pas designer professionnel.

shadcn/ui va encore plus loin en fournissant des composants complets pré-construits : boutons, formulaires, modales, cartes. C'est comme avoir des meubles IKEA prêts à assembler plutôt que de devoir les construire planche par planche. Ces composants sont beaux, accessibles (utilisables par les personnes handicapées), et personnalisables. Pour notre LMS, cela signifie que nous pouvons avoir une interface professionnelle sans passer des mois sur le design.

### 4.6 MDX : Le Contenu Riche et Interactif

MDX est une extension de Markdown qui permet d'inclure des composants React dans du contenu textuel. Markdown, c'est un langage de formatage simple où vous écrivez du texte avec quelques symboles pour le formater. Par exemple, entourer un mot d'astérisques le met en italique, deux astérisques le mettent en gras.

MDX pousse ce concept plus loin en permettant d'insérer des composants interactifs directement dans le texte. Pour notre LMS, c'est parfait : vous pouvez écrire le contenu de vos leçons de manière naturelle, presque comme dans Word, mais insérer des vidéos Mux, des quiz interactifs, ou des zones de chat IA exactement où vous le souhaitez.

L'avantage énorme de MDX est que le contenu reste lisible même sans rendu. Si vous ouvrez un fichier MDX dans un éditeur de texte basique, vous pouvez toujours lire et comprendre le contenu. C'est important pour la maintenance et les modifications futures.

### 4.7 Mux : La Plateforme Vidéo Professionnelle

Mux est une plateforme spécialisée dans la diffusion de vidéos. Pourquoi ne pas simplement utiliser YouTube ? Plusieurs raisons. D'abord, avec YouTube, vous perdez le contrôle : des publicités peuvent apparaître, des vidéos recommandées peuvent distraire vos apprenants, et vous ne savez pas exactement qui regarde quoi et pendant combien de temps.

Mux vous donne un contrôle total. Quand vous uploadez une vidéo sur Mux, leur système la convertit automatiquement en plusieurs qualités et formats. Ainsi, quelqu'un avec une connexion lente aura automatiquement une version basse qualité qui ne saccade pas, tandis que quelqu'un en fibre optique aura la version haute définition. C'est ce qu'on appelle l'adaptive bitrate streaming.

Pour notre système de progression, Mux est crucial car il nous donne des analytics détaillées. Nous savons exactement où chaque apprenant en est dans chaque vidéo. Si beaucoup d'apprenants mettent pause ou abandonnent à un moment précis, c'est probablement que l'explication est confuse et mérite d'être retravaillée. Ces données sont de l'or pour améliorer continuellement nos cours.

### 4.8 Gemini Flash : L'IA Évaluatrice

Google Gemini Flash est le modèle d'intelligence artificielle que nous utilisons pour nos évaluations conversationnelles. C'est un modèle de langage large (LLM) similaire à GPT-4 mais optimisé pour être rapide et économique. Le "Flash" dans son nom indique qu'il privilégie la vitesse de réponse, ce qui est crucial pour une conversation fluide avec les apprenants.

Le choix de Gemini Flash plutôt que GPT-4 ou Claude est stratégique. Avec un coût de 0,30$ pour un million de tokens en entrée et 2,50$ en sortie, nous pouvons offrir des dizaines d'interactions par apprenant pour moins d'un euro. C'est ce qui rend notre modèle économique viable. Un token, c'est environ 4 caractères de texte. Une conversation d'évaluation typique de 15 minutes représente environ 2000-3000 tokens, soit moins d'un centime de coût.

Gemini Flash a aussi l'avantage d'avoir une fenêtre de contexte d'un million de tokens. Cela signifie qu'il peut "se souvenir" de conversations très longues, ce qui est parfait pour notre système de trois tentatives où l'IA doit garder en mémoire tout l'historique des échanges précédents pour adapter son approche.

### 4.9 Stripe : Les Paiements Sécurisés

Stripe est la référence mondiale pour les paiements en ligne. Gérer des paiements soi-même est non seulement complexe mais aussi dangereux : une faille de sécurité avec des données de carte bancaire peut ruiner votre entreprise. Stripe s'occupe de toute la complexité et la sécurité pour vous.

Pour notre LMS, Stripe gère plusieurs aspects cruciaux. D'abord, le processus de paiement lui-même avec Stripe Checkout, une page de paiement hébergée par Stripe, belle et sécurisée. Ensuite, les webhooks, qui sont des notifications automatiques quand un paiement est effectué. C'est ce qui nous permet de débloquer automatiquement l'accès au cours dès que le paiement est confirmé.

Stripe gérera aussi notre système d'affiliation. Quand un affilié amène un client, Stripe peut automatiquement diviser le paiement : 80% pour nous, 20% pour l'affilié. C'est transparent et automatique, pas besoin de faire des virements manuels chaque mois.

### 4.10 Vercel : L'Hébergement et le Déploiement

Vercel est la plateforme d'hébergement créée par les mêmes personnes qui ont fait Next.js. C'est donc l'endroit optimal pour héberger une application Next.js. Mais qu'est-ce que l'hébergement exactement ? C'est l'endroit où votre site web "vit" sur internet, les serveurs qui envoient votre site aux visiteurs quand ils tapent votre adresse.

Vercel apporte plusieurs avantages majeurs. D'abord, le déploiement automatique : vous poussez votre code sur GitHub, et Vercel détecte automatiquement les changements et met à jour votre site. Pas besoin de manipulations complexes. Ensuite, le CDN global : votre site est automatiquement distribué sur des serveurs dans le monde entier, donc un visiteur à Tokyo aura la même vitesse qu'un visiteur à Paris.

Pour un développeur solo, Vercel est parfait car il gère automatiquement les aspects complexes : mise à l'échelle si vous avez soudainement beaucoup de visiteurs, certificats SSL pour la sécurité, optimisation des performances. Vous vous concentrez sur le code, Vercel s'occupe de l'infrastructure.

---

## 5. SYSTÈME DE SÉCURITÉ ET PERMISSIONS (RBAC & RLS)

### 5.1 Comprendre RBAC : Qui Peut Faire Quoi

RBAC signifie "Role-Based Access Control", soit "Contrôle d'Accès Basé sur les Rôles" en français. C'est un système de sécurité qui détermine ce que chaque utilisateur peut faire dans votre application en fonction de son rôle.

Pour comprendre RBAC, imaginez une école. Dans une école, vous avez différents types de personnes : les élèves, les professeurs, le directeur, le personnel administratif. Chacun a des droits différents. Un élève peut voir ses notes mais pas les modifier. Un professeur peut voir et modifier les notes de ses élèves mais pas celles des autres classes. Le directeur peut tout voir et tout modifier. C'est exactement ça, le RBAC.

Dans notre LMS, nous avons plusieurs rôles. Le rôle "visiteur" peut voir les pages publiques et les leçons gratuites, mais c'est tout. Le rôle "membre" peut accéder aux cours qu'il a achetés, voir sa progression, télécharger son certificat. Le rôle "instructeur" pourrait créer et modifier ses propres cours (pour une évolution future). Le rôle "admin" peut tout voir et tout modifier : créer des cours, gérer les utilisateurs, voir les analytics. Le rôle "super_admin" a en plus accès aux fonctions critiques comme la gestion des rôles eux-mêmes et les configurations système.

L'avantage du RBAC est sa simplicité et sa sécurité. Au lieu de définir les permissions utilisateur par utilisateur (imagine gérer ça pour 1000 utilisateurs !), vous assignez simplement un rôle à chaque utilisateur et les permissions viennent automatiquement avec. Si vous voulez changer les permissions d'un rôle, tous les utilisateurs avec ce rôle sont impactés instantanément.

Dans notre système, quand Marie s'inscrit, elle obtient automatiquement le rôle "membre". Ce rôle lui donne le droit de voir son tableau de bord, d'accéder aux cours qu'elle a achetés, de voir sa progression, mais pas d'accéder à l'interface admin ou de modifier les cours. Si plus tard nous voulions faire de Marie une modératrice du forum (feature future), nous pourrions créer un rôle "modérateur" avec les permissions appropriées et le lui assigner en plus de son rôle membre.

### 5.2 Comprendre RLS : La Sécurité au Niveau de la Base de Données

RLS signifie "Row Level Security", soit "Sécurité au Niveau Ligne" en français. C'est une fonctionnalité de PostgreSQL (notre base de données via Supabase) qui ajoute une couche de sécurité directement dans la base de données.

Pour comprendre RLS, reprenons notre métaphore de l'école, mais cette fois imaginez les dossiers des élèves dans une armoire. Sans RLS, c'est comme si l'armoire était ouverte et que vous comptiez sur les gens pour ne regarder que leur propre dossier. Avec RLS, c'est comme si chaque dossier avait un verrou magique qui ne s'ouvre que pour la bonne personne.

Concrètement, RLS permet de définir des règles qui déterminent quelles lignes de vos tables de base de données chaque utilisateur peut voir ou modifier. Par exemple, dans notre table de progression des leçons, nous avons une règle RLS qui dit : "Un utilisateur ne peut voir et modifier que les lignes où user_id correspond à son propre ID". Ainsi, même si quelqu'un trouvait un moyen de contourner votre application et d'accéder directement à la base de données, il ne pourrait voir que ses propres données.

La beauté de RLS est que ces règles s'appliquent automatiquement, peu importe comment on accède aux données. Que ce soit depuis votre application web, une application mobile, ou même un outil d'administration, les règles RLS sont toujours actives. C'est une sécurité en profondeur : même si votre code frontend a un bug, vos données restent protégées.

Dans notre LMS, nous utilisons RLS pour plusieurs protections critiques. Pour les leçons premium, nous avons une règle qui vérifie que l'utilisateur a bien un "entitlement" (droit d'accès) pour le cours avant de lui montrer le contenu. Pour les sessions d'évaluation IA, chaque utilisateur ne peut voir que ses propres conversations, garantissant la confidentialité des échanges pédagogiques. Pour les certificats, seul le propriétaire peut voir les détails complets, tandis que la vérification publique ne montre que les informations essentielles.

### 5.3 La Synergie entre RBAC et RLS

RBAC et RLS travaillent ensemble pour créer un système de sécurité multicouche. RBAC contrôle ce que vous pouvez faire (les actions), tandis que RLS contrôle ce que vous pouvez voir (les données). C'est cette combinaison qui rend notre système vraiment sécurisé.

Prenons un exemple concret. Quand un administrateur veut voir les statistiques du cours, RBAC vérifie d'abord qu'il a bien le rôle "admin" qui lui donne le droit d'accéder à l'interface d'administration. Ensuite, quand il demande les données, RLS vérifie qu'il a le droit de voir ces statistiques spécifiques. Cette double vérification élimine la plupart des failles de sécurité possibles.

Un aspect important à comprendre est que ces systèmes de sécurité ne ralentissent pas votre application. Les vérifications RBAC sont quasi-instantanées car elles ne font que vérifier une valeur (le rôle) contre une liste de permissions. Les règles RLS sont exécutées directement par PostgreSQL qui est optimisé pour ça. C'est infiniment plus rapide et plus sûr que de faire ces vérifications dans votre code application.

---

## 6. SYSTÈME DE GARDE-FOUS POUR LES TOKENS IA

### 6.1 Pourquoi les Garde-Fous sont Critiques

L'utilisation de l'IA dans notre plateforme est notre grande force, mais elle présente un risque économique majeur si elle n'est pas contrôlée. Chaque interaction avec Gemini Flash coûte de l'argent, et même si les coûts unitaires sont faibles, ils peuvent exploser rapidement sans garde-fous appropriés.

Imaginez qu'un utilisateur malveillant ou simplement trop enthousiaste décide de passer 10 heures par jour à discuter avec l'IA évaluatrice. Sans limites, il pourrait générer des centaines d'euros de coûts en quelques jours. Ou imaginez un bug dans votre code qui fait que l'IA est appelée en boucle. En quelques minutes, vous pourriez avoir des milliers d'appels API et une facture astronomique.

Les garde-fous ne sont pas là pour brider l'expérience utilisateur mais pour garantir la viabilité économique de la plateforme tout en protégeant contre les abus. C'est un équilibre délicat : trop restrictif et vous frustrez les apprenants légitimes, trop laxiste et vous risquez la faillite.

### 6.2 Architecture du Système de Limitations

Notre système de garde-fous fonctionne sur plusieurs niveaux pour une protection maximale tout en restant flexible. Voici comment nous structurons ces limitations.

**Niveau 1 : Limitations par Session**
Chaque session d'évaluation IA est limitée à un maximum de 20 échanges (10 messages de l'utilisateur, 10 réponses de l'IA). C'est largement suffisant pour une évaluation pédagogique complète. Si un apprenant n'a pas démontré sa compréhension en 20 échanges, c'est qu'il doit revoir la leçon. Cette limite est réinitialisée à chaque nouvelle tentative (rappel : maximum 3 tentatives par leçon).

**Niveau 2 : Limitations Quotidiennes par Utilisateur**
Chaque utilisateur a un quota quotidien de 50 000 tokens, ce qui représente environ 15-20 sessions d'évaluation complètes. C'est plus que ce qu'un apprenant sérieux peut raisonnablement consommer en une journée. Ce compteur se réinitialise automatiquement à minuit chaque jour.

**Niveau 3 : Limitations Mensuelles par Utilisateur**
En plus du quota quotidien, nous avons un plafond mensuel de 500 000 tokens par utilisateur. Cela permet de gérer les cas où quelqu'un utiliserait son quota quotidien maximum chaque jour. Avec ce plafond, même dans le pire cas, un utilisateur ne peut pas générer plus de 5-10€ de coûts par mois, ce qui reste absorbable dans notre modèle économique.

**Niveau 4 : Détection d'Anomalies**
Au-delà des limites fixes, nous avons un système de détection d'anomalies. Si un utilisateur atteint 80% de son quota quotidien en moins d'une heure, c'est suspect. Si le même utilisateur atteint ses limites quotidiennes 5 jours de suite, c'est anormal. Ces patterns déclenchent des alertes pour investigation manuelle.

### 6.3 Gestion des Dépassements avec Pédagogie

Quand un utilisateur atteint une limite, la façon dont nous communiquons est cruciale. Au lieu d'un message d'erreur frustrant, nous expliquons pédagogiquement la situation.

Par exemple, quand un apprenant atteint sa limite quotidienne, il voit : "Vous avez été très productif aujourd'hui ! Pour garantir une expérience optimale à tous nos apprenants, nous avons une limite quotidienne d'interactions avec l'IA. Vos quotas seront réinitialisés demain à minuit. En attendant, pourquoi ne pas revoir les leçons précédentes ou regarder les vidéos du module suivant ?"

Cette approche transforme une limitation technique en opportunité pédagogique. L'apprenant est encouragé à varier ses méthodes d'apprentissage plutôt que de se reposer uniquement sur l'IA. C'est meilleur pour son apprentissage et pour nos coûts.

### 6.4 Système de Crédits Premium (Évolution Future)

Pour les utilisateurs avancés qui voudraient vraiment plus d'interactions IA, nous pourrions introduire un système de crédits supplémentaires achetables. Mais attention, ce n'est pas pour la V1. L'idée serait qu'un apprenant particulièrement motivé puisse acheter des packs de 100 000 tokens supplémentaires pour quelques euros.

Ce système aurait plusieurs avantages. D'abord, il monétise les power users sans pénaliser les utilisateurs normaux. Ensuite, il nous donne un signal fort sur qui sont nos utilisateurs les plus engagés. Enfin, le fait de payer pour des tokens supplémentaires réduit naturellement les abus : les gens font attention à ce qu'ils payent.

### 6.5 Monitoring et Alertes

Le système de garde-fous n'est efficace que s'il est accompagné d'un monitoring rigoureux. Nous devons suivre en temps réel plusieurs métriques critiques.

Le coût total journalier en API IA doit être surveillé avec une alerte si on dépasse 50€ par jour (seuil à ajuster selon votre nombre d'utilisateurs). Le coût par utilisateur est aussi crucial : si un utilisateur génère plus de 5€ de coûts dans une journée, c'est anormal et mérite investigation. La distribution des usages nous dit si nos limites sont bien calibrées : si 90% des utilisateurs n'utilisent que 10% de leur quota, on peut le réduire.

Ces données nous permettent aussi d'optimiser continuellement. Par exemple, si on remarque que les sessions d'évaluation sur un module particulier consomment systématiquement plus de tokens, c'est peut-être que le prompt système est mal optimisé ou que le concept est trop complexe pour le niveau des apprenants.

---

## 7. ARCHITECTURE FONCTIONNELLE DÉTAILLÉE

### 7.1 Structure Hiérarchique du Contenu Pédagogique

Notre contenu s'organise en quatre niveaux hiérarchiques, chacun ayant un rôle pédagogique précis. Cette structure n'est pas arbitraire, elle suit les principes de la pédagogie progressive où chaque niveau de granularité sert un objectif d'apprentissage spécifique.

Au plus haut niveau, nous avons le **Cours**. Un cours représente un objectif de compétence complet. Par exemple, notre premier cours "Maîtriser l'IA au Quotidien" vise à transformer un débutant complet en utilisateur autonome de l'IA. Un cours est une promesse de transformation : "À la fin de ce cours, vous saurez faire X, Y et Z."

Ensuite viennent les **Modules**, qui sont des étapes logiques vers l'objectif final. Chaque module représente une compétence intermédiaire cohérente. Dans notre cours IA, nous pourrions avoir : "Module 1 : Comprendre ce qu'est l'IA et ce qu'elle n'est pas", "Module 2 : Maîtriser l'art du prompt", "Module 3 : Utiliser l'IA pour la productivité quotidienne". Chaque module peut être vu comme un chapitre qui a du sens en lui-même.

Les **Leçons** sont les unités d'apprentissage atomiques. Une leçon enseigne un concept ou une compétence spécifique. Elle dure typiquement 15-30 minutes et peut être complétée en une session. Par exemple : "Leçon 2.3 : Les 5 éléments d'un prompt efficace". Une leçon doit avoir un objectif clair et mesurable.

Enfin, les **Blocs** sont les éléments qui composent une leçon. Un bloc peut être un paragraphe de texte explicatif, une vidéo, un quiz, une session avec l'IA évaluatrice. Les blocs s'enchaînent pour créer une expérience d'apprentissage variée et engageante. L'ordre des blocs est crucial : on commence généralement par exposer le concept (texte ou vidéo), puis on vérifie la compréhension basique (quiz), et enfin on valide la maîtrise par la pratique (IA évaluatrice).

### 7.1 bis Organisation des routes V1 (Mono‑app)

Nous conservons un monorepo mais avec une seule application Next.js, qui contient trois espaces distincts via des route groups:

- (public): découverte, pages cours publiques, connexion (Magic Link), inscription
- (member): tableau de bord, mes cours, pages cours/module/leçon (contrôle d’accès via entitlements)
- (admin): dashboard + CRUD simple cours/modules/leçons/utilisateurs (accès réservé au rôle admin)

Principes d’accès:
- RBAC pour les actions (création/édition côté admin)
- RLS pour les données (visibilité restreinte par utilisateur)
- Entitlements pour l’accès lecture au contenu premium

### 7.2 Le Système d'Évaluation par IA Conversationnelle

Notre système d'évaluation par IA est le cœur innovant de la plateforme. Contrairement aux évaluations traditionnelles qui sont binaires (juste ou faux), notre système comprend les nuances de l'apprentissage.

Quand un apprenant arrive sur un bloc d'évaluation IA, voici ce qui se passe dans les coulisses. D'abord, le système initialise une session d'évaluation. Cette session contient le prompt système que vous avez défini (qui dit à l'IA son rôle et ses objectifs), le contexte de la leçon (ce qui doit être évalué), et l'historique de l'apprenant (son style d'apprentissage détecté, ses points de blocage habituels).

L'IA ne pose pas des questions fermées mais engage une vraie conversation pédagogique. Elle peut demander à l'apprenant d'expliquer un concept avec ses propres mots, de donner des exemples personnels, de faire des connexions avec d'autres concepts. Cette approche conversationnelle révèle la vraie compréhension, pas juste la mémorisation.

Le système des trois tentatives est conçu pour maximiser l'apprentissage tout en maintenant des standards. La première tentative utilise l'approche standard que vous avez conçue. Si l'apprenant obtient moins de 60%, l'IA analyse précisément ce qui n'est pas compris. Pour la deuxième tentative, l'IA change complètement d'approche basée sur cette analyse. Si c'était trop théorique, elle devient pratique. Si c'était trop rapide, elle décompose. La troisième tentative est l'approche "filet de sécurité" : l'IA reprend depuis les bases absolues, vérifie chaque brique de compréhension.

Entre chaque tentative, l'apprenant peut revoir la leçon, consulter des ressources supplémentaires, prendre le temps de digérer. Ce n'est pas une punition mais une opportunité d'apprentissage. L'IA se souvient de tout et peut dire : "La dernière fois, vous aviez des difficultés avec le concept de contexte dans les prompts. Voyons si c'est plus clair maintenant."

### 7.3 Système de Progression et Déblocage

La progression dans notre LMS n'est pas linéaire mais adaptative. Chaque apprenant avance à son rythme, avec des chemins potentiellement différents selon ses besoins.

Une leçon peut avoir quatre statuts. "Non commencée" signifie que l'apprenant n'a pas encore accédé à la leçon. "En cours" indique qu'au moins un bloc a été complété mais pas tous. "Complétée" confirme que tous les blocs obligatoires ont été validés avec succès. "Échec - Révision requise" apparaît après trois échecs consécutifs sur l'évaluation IA, forçant l'apprenant à revoir la leçon depuis le début.

Le calcul de la progression est sophistiqué. Au niveau leçon, nous calculons le pourcentage de blocs complétés, mais en pondérant différemment selon leur importance. Un bloc d'évaluation IA compte plus qu'un simple bouton de validation de lecture. Au niveau module, nous regardons le pourcentage de leçons terminées, mais aussi la qualité de completion (les scores moyens aux évaluations). Au niveau cours, nous combinons la progression quantitative (pourcentage complété) et qualitative (niveau de maîtrise démontré).

Le déblocage du contenu suit des règles pédagogiques. Par défaut, les leçons d'un module se débloquent séquentiellement : vous devez finir la leçon 1 pour accéder à la leçon 2. Mais nous pouvons définir des exceptions. Par exemple, après avoir complété 3 leçons sur 5 dans un module, les 2 dernières pourraient se débloquer simultanément, permettant à l'apprenant de choisir son ordre.

Nous avons aussi des "chemins conditionnels". Si un apprenant excelle (plus de 90% à toutes les évaluations), nous pourrions lui proposer un "fast track" qui saute certaines leçons basiques. À l'inverse, si un apprenant lutte (moins de 70% en moyenne), nous pourrions débloquer des leçons de renforcement optionnelles.

### 7.4 Système de Certification Vérifiable

Notre système de certification va au-delà du simple PDF téléchargeable. C'est une preuve vérifiable et détaillée de compétence qui a une vraie valeur sur le marché du travail.

Pour obtenir un certificat, l'apprenant doit avoir complété 100% des leçons obligatoires du cours avec un score moyen d'au moins 70% aux évaluations IA. Mais le certificat ne dit pas juste "cours complété". Il contient des métadonnées riches : le temps total passé, le nombre de tentatives par évaluation, les points forts identifiés par l'IA, et surtout, des extraits des conversations avec l'IA qui démontrent la compréhension.

Chaque certificat a un code unique (un UUID court, facile à taper) et un QR code. Quand un employeur scanne ce code ou entre l'UUID sur notre site, il accède à une page de vérification. Cette page confirme l'authenticité du certificat et montre les "preuves d'apprentissage" : des extraits sélectionnés des meilleures réponses de l'apprenant lors des évaluations IA.

L'apprenant contrôle ce qui est partagé. Lors de la génération du certificat, il peut choisir quels extraits rendre publics. C'est important pour la confidentialité : certains apprenants peuvent avoir partagé des exemples personnels ou professionnels durant les évaluations.

Le certificat évolue dans le temps. Si l'apprenant revient six mois plus tard pour une session de révision et démontre que les compétences sont toujours maîtrisées, le certificat est mis à jour avec une mention "Compétences confirmées le [date]". C'est unique dans l'industrie et ajoute énormément de crédibilité.

### 7.5 Système d'Affiliation et Parrainage

Le système d'affiliation est conçu pour créer une croissance virale organique. Chaque membre devient potentiellement un ambassadeur rémunéré de la plateforme.

Techniquement, voici comment cela fonctionne. À l'inscription, chaque utilisateur reçoit automatiquement un code d'affiliation unique. Ce peut être un code personnalisé (MARIE2024) ou un UUID court généré automatiquement. Ce code est lié à une URL de parrainage personnalisée.

Quand quelqu'un visite le site via un lien de parrainage, nous stockons le code d'affiliation dans un cookie qui dure 30 jours. Si cette personne s'inscrit et achète un cours dans ces 30 jours, l'affiliation est créditée au parrain. Le choix de 30 jours est stratégique : assez long pour que les gens prennent leur décision, assez court pour que l'attribution reste légitime.

La commission est de 20% sur le premier achat. C'est généreux mais justifié : acquérir un nouveau client coûte cher en publicité, autant récompenser nos membres qui font ce travail. Le paiement peut se faire de deux façons selon votre choix technique : soit automatiquement via Stripe Connect (plus complexe à mettre en place mais automatique), soit manuellement une fois par mois (plus simple mais demande du travail manuel).

Le dashboard d'affiliation montre aux membres leurs performances. Ils voient leur lien unique, le nombre de clics générés, le nombre d'inscriptions, les conversions en achat, et leurs commissions (en attente et payées). Nous pourrions même ajouter des conseils : "Vos liens partagés sur LinkedIn convertissent 3x mieux que sur Facebook."

Pour éviter les abus, nous avons des garde-fous. Un utilisateur ne peut pas utiliser son propre code de parrainage. Les achats depuis la même adresse IP que le parrain sont signalés pour vérification. Les patterns suspects (10 achats en 1 minute) déclenchent une vérification manuelle avant paiement des commissions.

---

## 8. MÉTRIQUES ET ANALYTICS

### 8.1 Les KPIs Essentiels pour Piloter la Plateforme

Les métriques ne sont pas juste des chiffres pour faire joli dans un dashboard. Ce sont les instruments de navigation qui vous disent si vous allez dans la bonne direction et à quelle vitesse. Pour notre LMS, certaines métriques sont vitales.

**Le taux de conversion visiteur vers inscription** nous dit si notre proposition de valeur est claire et attractive. Si seulement 1% des visiteurs s'inscrivent, c'est que quelque chose cloche sur la landing page ou dans le messaging. Notre cible est 5%, ce qui est excellent pour une plateforme éducative.

**Le taux de conversion inscription vers premier achat** est encore plus critique. C'est lui qui détermine la viabilité économique. Si les gens s'inscrivent mais n'achètent pas, c'est peut-être que le prix est trop élevé, ou que la valeur n'est pas assez démontrée dans les leçons gratuites. Notre cible de 3% est ambitieuse mais atteignable avec notre approche IA différenciante.

**Le taux de complétion des cours** est notre métrique de qualité pédagogique. L'industrie moyenne est catastrophique : 15% seulement des gens finissent les cours en ligne qu'ils achètent. Avec notre système adaptatif, nous visons 70%. Si nous n'atteignons pas ce chiffre, c'est que notre pédagogie n'est pas aussi révolutionnaire que nous le pensons.

**Le coût d'acquisition client (CAC) versus la valeur vie client (LTV)** détermine la rentabilité long terme. Si nous dépensons 50€ pour acquérir un client qui ne dépense que 47€, nous courrons à la faillite. L'affiliation devrait nous aider à garder un CAC bas, et la qualité de nos cours devrait générer des achats répétés pour augmenter la LTV.

**Le Net Promoter Score (NPS)** mesure si nos utilisateurs nous recommanderaient. Un NPS supérieur à 50 est excellent et génère une croissance organique. Avec notre système de certification vérifiable et notre pédagogie adaptative, nous devrions y arriver.

### 8.2 Métriques Pédagogiques Spécifiques

Au-delà des métriques business, nous devons tracker des indicateurs pédagogiques uniques à notre approche.

**Le nombre de tentatives moyennes avant réussite** sur les évaluations IA nous dit si notre difficulté est bien calibrée. Si tout le monde réussit du premier coup, c'est trop facile. Si tout le monde a besoin de trois tentatives, c'est trop dur. L'idéal est une distribution : 60% réussissent à la première tentative, 30% à la seconde, 10% à la troisième.

**L'évolution du style d'apprentissage détecté** est fascinante. Si nous détectons qu'un apprenant commence comme "théorique" mais devient progressivement "pratique", c'est peut-être que notre pédagogie l'aide à développer de nouvelles façons d'apprendre. C'est de la métacognition appliquée.

**Les points de blocage récurrents** identifiés par l'IA nous disent où notre contenu doit être amélioré. Si 40% des apprenants butent sur le même concept, ce n'est pas eux le problème, c'est notre explication. Ces données sont de l'or pour l'amélioration continue du cours.

**La corrélation entre temps passé et score obtenu** révèle l'efficacité de notre pédagogie. Dans l'idéal, cette corrélation devrait être faible : notre système adaptatif devrait permettre à chacun d'atteindre la maîtrise, peu importe le temps nécessaire.

### 8.3 Métriques Économiques de l'IA

L'utilisation de l'IA introduit des métriques économiques nouvelles qu'il faut surveiller comme le lait sur le feu.

**Le coût moyen en IA par apprenant et par cours** est crucial. Si ce coût dépasse 10% du prix du cours, notre modèle économique est en danger. Avec Gemini Flash et nos garde-fous, nous devrions rester autour de 2-3%, ce qui est très sain.

**La distribution des coûts par utilisateur** révèle les comportements anormaux. Si 1% des utilisateurs génèrent 50% des coûts, nous avons un problème d'abus ou de bug à résoudre.

**Le ratio tokens utilisés versus valeur pédagogique générée** est plus subtil mais important. Si une session de 10 000 tokens aboutit à un échec de compréhension, c'est de l'argent gaspillé. Si 1 000 tokens suffisent pour valider la maîtrise, c'est efficient.

### 8.4 Dashboard de Pilotage en Temps Réel

Toutes ces métriques doivent être visibles dans un dashboard de pilotage accessible en un coup d'œil. Ce dashboard n'est pas un nice-to-have, c'est votre tour de contrôle.

Le dashboard principal devrait montrer en temps réel : le nombre d'utilisateurs actifs actuellement, le nombre de sessions IA en cours, les revenus du jour, les coûts IA du jour, et la marge brute résultante. Ces cinq chiffres vous disent instantanément si tout va bien ou si une intervention est nécessaire.

Un niveau en dessous, vous avez les tendances hebdomadaires : évolution des inscriptions, progression du taux de conversion, évolution du taux de complétion. Ces courbes vous montrent la direction et la vélocité.

Enfin, les alertes automatiques sont cruciales. Si les coûts IA dépassent 50€ en une heure, alerte immédiate. Si le taux de conversion chute de 50% d'un jour à l'autre, alerte. Si un utilisateur génère 100 sessions IA en une journée, alerte. Ces alertes vous permettent de réagir vite avant qu'un problème ne devienne une catastrophe.

---

## 9. PLAN DE DÉVELOPPEMENT PROGRESSIF

### 9.1 Philosophie du Développement Itératif

Le plus grand piège quand on développe seul est de vouloir tout faire parfaitement du premier coup. C'est la garantie de ne jamais lancer. Notre approche est différente : nous construisons par couches successives, chaque couche étant fonctionnelle et apportant de la valeur.

Imaginez que vous construisez une maison. L'approche traditionnelle serait de finir complètement les fondations, puis les murs, puis le toit. Notre approche est de construire d'abord une petite pièce habitable, puis d'ajouter des pièces, puis d'améliorer chaque pièce. À chaque étape, vous avez quelque chose d'utilisable.

Cette approche a plusieurs avantages critiques. D'abord, vous pouvez tester avec de vrais utilisateurs très tôt et ajuster selon leurs retours. Ensuite, vous gardez la motivation en voyant des résultats concrets rapidement. Enfin, si vous devez arrêter pour une raison quelconque, vous avez au moins quelque chose de fonctionnel.

### 9.2 Phase 1 : Le Socle Minimal Viable (Semaines 1-2)

La première phase pose les fondations absolument essentielles. Sans ces éléments, rien d'autre ne peut fonctionner.

L'objectif est d'avoir un système où les utilisateurs peuvent créer un compte, se connecter, et naviguer dans une structure basique. C'est tout. Pas de contenu, pas d'IA, pas de paiement. Juste la plomberie de base.

Concrètement, vous aurez : un système d'authentification fonctionnel avec inscription, connexion, et récupération de mot de passe. Une base de données avec les tables utilisateurs et une structure RBAC basique. Une interface minimale avec navigation entre quelques pages. Le tout déployé en local avec Supabase CLI.

Le critère de validation est simple : vous devez pouvoir créer un compte, vous connecter, voir votre profil, et vous déconnecter. Si ça marche, la phase 1 est réussie.

### 9.3 Phase 2 : Structure du Contenu (Semaines 3-4)

La phase 2 introduit la structure du contenu pédagogique, mais sans le contenu lui-même.

L'objectif est de pouvoir créer la structure cours/modules/leçons depuis une interface admin basique, et de naviguer dans cette structure côté apprenant. Pas encore de vrai contenu dans les leçons, juste des placeholders.

Vous construirez : les tables de base de données pour cours, modules, et leçons. Une interface admin CRUD (Create, Read, Update, Delete) basique. La navigation côté apprenant dans la structure. Le système de publication (brouillon vs publié).

La validation : vous devez pouvoir créer un cours "Test" avec 2 modules de 3 leçons chacun depuis l'admin, et naviguer dans cette structure côté apprenant.

### 9.4 Phase 3 : Contenu et Progression (Semaines 5-6)

La phase 3 rend les leçons réelles avec du vrai contenu et un système de progression.

L'objectif est de pouvoir créer des leçons avec différents types de blocs (texte, vidéo, quiz simple), et de tracker la progression des apprenants.

Vous ajouterez : l'éditeur de contenu MDX pour les leçons. L'intégration de Mux pour les vidéos. Le système de blocs dans les leçons. Le tracking de progression. Un dashboard basique de progression pour l'apprenant.

La validation : un apprenant doit pouvoir suivre une leçon complète avec texte, vidéo et quiz, voir sa progression sauvegardée, et reprendre où il s'était arrêté.

### 9.5 Phase 4 : L'IA Évaluatrice (Semaines 7-8)

La phase 4 introduit notre différenciateur majeur : l'évaluation par IA conversationnelle.

C'est la phase la plus complexe techniquement mais aussi la plus importante pour notre proposition de valeur. L'objectif est d'avoir des sessions d'évaluation IA fonctionnelles avec le système de trois tentatives.

Vous implémenterez : l'intégration de l'API Gemini Flash. Le composant de chat IA évaluateur. Le système de sessions avec mémoire. La logique des trois tentatives. Les garde-fous sur les tokens.

La validation : un apprenant doit pouvoir avoir une conversation d'évaluation avec l'IA, échouer, retenter avec une approche différente de l'IA, et voir son score final.

### 9.6 Phase 5 : Monétisation (Semaine 9)

La phase 5 permet enfin de gagner de l'argent avec le système de paiement.

L'objectif est simple : permettre l'achat de cours et débloquer automatiquement l'accès après paiement.

Vous intégrerez : Stripe Checkout pour le paiement. Le système d'entitlements. Les webhooks Stripe. Le paywall sur le contenu premium.

La validation : un utilisateur peut acheter un cours avec une vraie carte de test Stripe et accéder immédiatement au contenu complet.

### 9.7 Phase 6 : Croissance et Engagement (Semaine 10)

La phase 6 ajoute les mécanismes de croissance : affiliation et certification.

Ces features ne sont pas essentielles au fonctionnement mais sont cruciales pour la croissance et la crédibilité.

Vous ajouterez : le système de codes d'affiliation et tracking. Le dashboard affilié. La génération de certificats PDF. La page de vérification publique des certificats.

La validation : un utilisateur peut partager son lien d'affiliation, voir ses statistiques, et télécharger son certificat après avoir complété un cours.

### 9.8 Phase 7 : Optimisation et Polish (Semaines 11-12)

La phase finale prépare le lancement public en polissant l'expérience et optimisant les performances.

Cette phase est souvent négligée mais cruciale. L'objectif est d'avoir une expérience utilisateur fluide et professionnelle.

Vous travaillerez sur : l'optimisation des performances (temps de chargement). La gestion des erreurs (messages clairs, pas de pages blanches). Les emails transactionnels (bienvenue, achat, certificat). La documentation utilisateur. Les tests sur différents appareils et navigateurs.

La validation : pouvoir faire le parcours complet d'un nouvel utilisateur (découverte, inscription, achat, apprentissage, certification) sans bug ni friction.

---

## 10. GESTION DES RISQUES ET MITIGATION

### 10.1 Risques Techniques et Leurs Solutions

Le développement solo d'une plateforme complexe présente des risques techniques significatifs qu'il faut anticiper.

**Le risque de dette technique** est le plus insidieux. Quand on code vite pour avancer, on prend des raccourcis. Ces raccourcis s'accumulent jusqu'à rendre le code inmaintenable. La solution : réserver 20% de votre temps au refactoring. Chaque semaine, prenez une journée pour nettoyer, réorganiser, documenter. C'est un investissement, pas une perte de temps.

**Le risque de sécurité** est critique. Une faille peut ruiner votre réputation instantanément. La solution : ne jamais réinventer la roue en sécurité. Utilisez les systèmes d'authentification de Supabase, les paiements de Stripe, les validations de TypeScript. Faites faire un audit de sécurité basique avant le lancement public.

**Le risque de scalabilité** peut vous prendre par surprise. Si votre site devient viral, peut-il gérer 1000 utilisateurs simultanés ? La solution : architecturer pour la scalabilité dès le début. Avec Next.js sur Vercel et Supabase, vous avez une base solide. Faites des tests de charge avant le lancement.

### 10.2 Risques Business et Leurs Solutions

Les risques business sont souvent plus dangereux que les risques techniques car moins visibles.

**Le risque de positionnement** est crucial. Si les gens ne comprennent pas ce qui vous différencie d'Udemy ou Coursera, ils n'achèteront pas. La solution : marteler votre différenciation (IA adaptative, certificats vérifiables) dans toute votre communication. Faire tester votre messaging par des personnes de votre cible.

**Le risque de prix** peut tuer votre business dans les deux sens. Trop cher, personne n'achète. Trop bas, vous ne couvrez pas vos coûts. La solution : commencer avec un prix "beta" réduit pour les early adopters, puis augmenter progressivement en ajoutant de la valeur. Surveiller obsessionnellement le ratio CAC/LTV.

**Le risque de contenu** est spécifique à votre secteur. Si votre premier cours n'est pas excellent, vous ne vous en remettrez pas. La solution : sur-investir dans la qualité du premier cours. Le faire tester par au moins 10 beta testeurs avant le lancement public. Itérer selon leurs retours.

### 10.3 Risques Liés à l'IA et Leurs Solutions

L'utilisation centrale de l'IA introduit des risques spécifiques nouveaux.

**Le risque de coûts incontrôlés** peut transformer votre business model en gouffre financier. La solution : les garde-fous stricts sur les tokens, le monitoring temps réel, et un plan B (passer à un modèle moins cher si nécessaire).

**Le risque d'hallucinations de l'IA** pourrait donner de mauvaises évaluations. La solution : des prompts système ultra-précis, la possibilité pour l'apprenant de contester une évaluation, et une review manuelle des cas limites.

**Le risque de dépendance à Google** (Gemini) vous rend vulnérable. Si Google change ses prix ou ferme l'API, vous êtes bloqué. La solution : architecturer de façon à pouvoir switcher vers OpenAI ou Anthropic rapidement. Garder une abstraction entre votre code et l'API spécifique.

### 10.4 Risques Pédagogiques et Leurs Solutions

Les risques pédagogiques sont subtils mais peuvent ruiner l'expérience d'apprentissage.

**Le risque de sur-gamification** peut transformer l'apprentissage en jeu superficiel. Les gens collectionnent les badges sans vraiment apprendre. La solution : toujours privilégier la substance sur la forme. Les récompenses doivent célébrer la vraie maîtrise, pas juste la complétion.

**Le risque de frustration** avec le système de trois tentatives peut décourager les apprenants fragiles. La solution : un ton toujours encourageant de l'IA, des messages qui normalisent la difficulté ("C'est normal de ne pas comprendre du premier coup, Einstein aussi a mis du temps à comprendre la relativité !").

**Le risque d'isolement** de l'apprentissage en ligne peut réduire la motivation. La solution : créer des moments de connexion humaine, même dans la V1. Un simple système de commentaires sur les leçons peut suffire à créer un sentiment de communauté.

---

## 11. ÉVOLUTION POST-V1 ET VISION LONG TERME

### 11.1 Roadmap Immédiate Post-Lancement (Mois 1-3)

Les trois premiers mois après le lancement sont critiques. C'est là que vous découvrez ce qui marche vraiment et ce qui doit être ajusté.

La priorité absolue sera d'écouter les utilisateurs et d'itérer rapidement. Chaque semaine, vous devriez shipper au moins une amélioration basée sur les retours utilisateurs. Ces améliorations peuvent être mineures (clarifier un message d'erreur) ou majeures (restructurer une leçon confuse), mais le rythme constant d'amélioration montre que la plateforme est vivante et à l'écoute.

Les features prioritaires pour cette période incluent un système de notifications email intelligent qui relance les apprenants qui décrochent, un mode sombre pour les sessions tardives, et surtout, l'optimisation mobile. Beaucoup d'apprenants voudront réviser dans les transports, et l'expérience mobile doit être irréprochable.

### 11.2 Expansion du Catalogue (Mois 4-6)

Une fois le premier cours stabilisé et apprécié, l'expansion du catalogue devient prioritaire.

Le deuxième cours devrait rester dans la thématique IA mais viser un niveau différent ou un angle différent. Par exemple, si le premier cours est "L'IA au quotidien", le second pourrait être "L'IA pour les créateurs de contenu" ou "Automatiser son business avec l'IA". Cette approche permet de capitaliser sur votre expertise tout en élargissant votre audience.

L'introduction d'un abonnement mensuel "all-access" devient pertinente quand vous avez au moins 3-4 cours. C'est un changement de modèle économique majeur mais potentiellement très lucratif : les revenus récurrents sont le Saint Graal du SaaS.

### 11.3 Features Avancées (Mois 7-12)

La deuxième moitié de l'année 1 peut voir l'introduction de features plus sophistiquées.

Un système de parcours personnalisés où l'IA recommande le prochain cours basé sur les objectifs et le profil de l'apprenant. C'est Netflix pour l'éducation : "Parce que vous avez aimé 'Excel avec l'IA', vous devriez essayer 'Python pour non-développeurs'."

L'introduction du social learning avec des forums par cours, des sessions de groupe virtuelles, peut-être même du peer-to-peer learning où les apprenants avancés aident les débutants (et gagnent des crédits ou badges).

La gamification avancée avec des "learning streaks" (apprentissage quotidien), des challenges mensuels, des leaderboards optionnels. Attention à ne pas tomber dans le piège de la gamification superficielle : chaque élément ludique doit servir l'apprentissage, pas le remplacer.

### 11.4 Vision à 2-3 Ans

À moyen terme, la plateforme peut évoluer vers quelque chose de beaucoup plus ambitieux.

L'ouverture à d'autres formateurs transformerait la plateforme en marketplace. Mais attention, c'est un changement fondamental de business model qui demande de nouvelles compétences (curation de contenu, gestion de formateurs, partage de revenus). Ne le faire que si la demande est claire et forte.

L'internationalisation, d'abord vers l'anglais puis d'autres langues, multiplierait votre marché potentiel par 10 ou 100. Mais c'est complexe : traduction du contenu, adaptation culturelle, support multilingue, aspects légaux différents par pays.

L'IA générative de cours est le Saint Graal : imaginez pouvoir créer un cours complet à partir d'un syllabus et de quelques vidéos. L'IA génère les textes, crée les quiz, définit les évaluations. Vous devenez alors une plateforme de création de cours, pas juste de diffusion.

### 11.5 L'Endgame : Redéfinir l'Éducation en Ligne

La vision ultime est de créer un nouveau standard pour l'éducation en ligne.

Imaginez un monde où chaque cours en ligne doit prouver que les apprenants ont vraiment compris, pas juste regardé. Où les certificats ont une vraie valeur car ils sont vérifiables et détaillés. Où l'apprentissage s'adapte à chaque individu comme un tuteur personnel le ferait.

Cette vision peut sembler ambitieuse pour un projet solo, mais souvenez-vous : Khan Academy a commencé avec une personne faisant des vidéos pour son cousin. Duolingo a commencé comme un projet de recherche. Les grandes transformations commencent souvent petit.

---

## 12. CONCLUSION ET PROCHAINES ÉTAPES

### 12.1 Récapitulatif de la Vision

Ce PRD décrit un projet ambitieux mais réalisable : créer une plateforme d'apprentissage qui utilise l'IA non comme un gadget mais comme un véritable assistant pédagogique personnalisé. Notre approche résout les trois problèmes majeurs de l'éducation en ligne actuelle : l'apprentissage passif, l'absence de personnalisation, et les certificats sans valeur.

La force de ce projet réside dans sa simplicité conceptuelle cachant une sophistication technique. Pour l'apprenant, c'est simple : il suit des leçons, dialogue avec une IA bienveillante qui s'assure qu'il comprend, et obtient un certificat qui prouve sa maîtrise. Pour vous en tant que créateur, c'est un système modulaire où chaque pièce a un rôle clair et peut être améliorée indépendamment.

### 12.2 Le Mindset pour Réussir

Développer seul une plateforme de cette envergure demande un mindset particulier.

Acceptez l'imperfection. Votre V1 ne sera pas parfaite, et c'est normal. L'important est qu'elle apporte de la valeur et que vous puissiez itérer. Parfait est l'ennemi de bien.

Célébrez les petites victoires. Chaque feature qui fonctionne, chaque utilisateur satisfait, chaque bug résolu est une victoire. Le développement solo peut être solitaire, il faut savoir se motiver.

Restez focalisé sur la valeur utilisateur. Quand vous hésitez entre deux approches, choisissez toujours celle qui apporte le plus de valeur à l'apprenant, même si elle est plus complexe à implémenter.

### 12.3 Les Ressources pour Avancer

Ce PRD est votre carte, mais vous aurez besoin d'autres ressources pour naviguer.

La documentation officielle de vos outils (Next.js, Supabase, Stripe) sera votre bible technique. Gardez toujours un onglet ouvert sur ces docs.

Ce PRD est maintenant votre compagnon de route. Revenez-y régulièrement, annotez-le, faites-le évoluer. C'est un document vivant qui grandira avec votre projet.

La révolution de l'éducation personnalisée commence avec une ligne de code. Il est temps d'écrire la vôtre.

---

*Fin du Product Requirements Document V1.0*  
*Ce document est la propriété intellectuelle de son créateur et constitue la base stratégique du projet LMS IA*  
*Dernière mise à jour : Septembre 2025*
