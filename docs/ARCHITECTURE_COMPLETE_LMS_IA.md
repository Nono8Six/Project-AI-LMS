# Architecture Auth V1 + Stripe - Spécifications Fonctionnelles

## 🎯 **Vision et Périmètre V1**

### **Objectif Principal**
Établir une fondation auth ultra-solide avec paiements Stripe one-shot et système de parrainage monétisé. Cette V1 pose les bases techniques et business pour les évolutions futures du LMS IA, en respectant les standards de qualité 10/10 déjà établis dans le projet.

### **Périmètre Inclus**
- **Authentification complète** : Inscription, connexion, déconnexion, reset password, vérification email, gestion sessions
- **Onboarding intelligent** : Enrichissement profil post-vérification avec consentements RGPD obligatoires
- **Paiements Stripe one-shot** : Achat de produits individuels (cours futurs) avec réconciliation automatique
- **Système parrainage** : Codes uniques, tracking conversions, commissions % variables configurables
- **Interface administration** : Gestion utilisateurs, configuration système, analytics essentielles

### **Périmètre Exclu (V2)**
- Système de cours, modules, leçons
- IA conversationnelle et évaluation
- Abonnements récurrents Stripe
- Permissions granulaires complexes
- Interface publique de vente

### **Conformité Stack Technique**
Architecture respectant intégralement la stack existante : Next.js 15 App Router, TypeScript strict, Supabase avec RLS, middleware Next.js, orpc pour APIs type-safe, Tailwind + shadcn/ui, validation Zod, tests Vitest, configuration centralisée sans hardcode.

## 🏗️ **Architecture Modulaire en Briques**

### **Principe de Modularité**
L'architecture est conçue en 6 briques totalement indépendantes, développables et testables séparément. Chaque brique respecte le principe de responsabilité unique et peut évoluer sans impacter les autres.

### **Dépendances entre Briques**
- **Auth Base** : Fondation pour toutes les autres briques
- **Permissions & RBAC** : Sécurise toutes les briques, développable en parallèle
- **Paiement** : Dépend d'Auth Base pour l'identification utilisateur
- **Parrainage** : Dépend d'Auth Base et Paiement pour les conversions
- **Administration** : Supervise toutes les briques
- **Observabilité** : Monitore toutes les briques de manière transverse

### **Standards Transverses**
Toutes les briques respectent les mêmes standards : zéro hardcode, configuration centralisée, validation Zod systématique, RLS Supabase stricte, audit logging complet, gestion erreurs normalisée, tests unitaires obligatoires.

## 📊 **Modèle de Données Unifié**

### **Tables Principales**
Le modèle de données sera constitué de six tables principales interconnectées : user_profiles (extension auth Supabase), products (catalogue produits Stripe), purchases (historique achats), referral_conversions (tracking parrainage), system_settings (configuration), audit_logs (traçabilité).

### **Stratégie RLS**
Chaque table aura des politiques RLS ultra-strictes : utilisateurs voient uniquement leurs données, service role pour webhooks Stripe, admins avec accès étendu contrôlé. Aucune requête ne bypass la sécurité.

### **Intégrité Référentielle**
Relations strictes avec contraintes CASCADE/RESTRICT selon logique business. Contraintes CHECK pour validation données critiques. Index optimisés pour requêtes fréquentes.

### **Audit Trail**
Toutes les actions sensibles sont tracées dans audit_logs avec contexte complet : qui, quoi, quand, depuis où, avec quelles métadonnées. Rétention configurable pour compliance.

## 🔐 **BRIQUE 1 : Auth Base**

### **Responsabilités**
Cette brique gère l'intégralité du cycle de vie utilisateur : inscription avec parrainage optionnel, vérification email obligatoire, connexion Magic Link et Google OAuth, onboarding avec consentements RGPD, gestion sessions sécurisée, profils utilisateur enrichis.

### **Intégration Supabase**
Utilisation native de Supabase Auth avec extension via user_profiles. Magic Link configuré avec templates email personnalisés. Google OAuth avec scope minimal nécessaire. Sessions configurées 7 jours maximum avec refresh automatique.

### **Middleware Integration**
Le middleware Next.js gère l'authentification à tous les niveaux : extraction token Supabase, vérification statut utilisateur, redirection onboarding obligatoire, protection routes par rôle, injection contexte auth dans orpc.

### **Onboarding Workflow**
Parcours post-vérification obligatoire : collecte nom complet, avatar optionnel, consentements RGPD explicites (marketing, analytics), validation profil complet avant accès application.

### **Règles Business**
Un seul rôle admin par défaut, membres classiques pour tous les autres. Statuts utilisateur : active, suspended, pending_verification. Profils incomplets bloquent accès. Codes parrainage générés automatiquement (6 caractères alphanumériques).

### **Sécurité**
Rate limiting sur endpoints auth (10 req/min par IP). Validation email obligatoire avant activation. Sessions invalidées côté serveur à la déconnexion. Protection CSRF via tokens Supabase.

## 💳 **BRIQUE 2 : Paiement Stripe**

### **Responsabilités**
Gestion complète des paiements one-shot : catalogue produits Stripe, génération checkout sessions sécurisées, webhooks validation signature, réconciliation paiements, gestion accès produits, calcul commissions parrainage.

### **Architecture Stripe**
Products et Prices gérés directement dans Stripe. Checkout Sessions avec métadonnées complètes pour traçabilité. Customer Stripe créé à l'inscription utilisateur. Mode test/production via configuration environnement.

### **Webhook Security**
Validation obligatoire signature Stripe sur tous webhooks. Traitement idempotent des événements. Gestion états transitoires paiements. Réconciliation automatique en cas d'écart.

### **Commission System**
Calcul automatique commissions parrainage basé sur configuration admin. Métadonnées paiement incluent referrer_id et commission_rate. Création automatique referral_conversion post-paiement réussi.

### **Gestion Accès**
Table purchases comme source de vérité accès produits. États paiement : pending, completed, failed, refunded. Vérification accès middleware + orpc pour chaque ressource protégée.

### **Règles Business**
Un achat par utilisateur par produit maximum. Remboursements gérés via Stripe avec sync BDD. Commissions calculées sur montant HT. Pas de paiement fractionné V1.

### **Monitoring**
Tracking temps réel état webhooks Stripe. Alertes sur échecs paiement répétés. Dashboard admin revenus et conversions. Réconciliation quotidienne automatique.

## 🤝 **BRIQUE 3 : Parrainage**

### **Responsabilités**
Système parrainage complet : génération codes uniques, validation codes existants, tracking inscription avec parrainage, calcul commissions post-achat, interface utilisateur suivi parrainés, paiement commissions.

### **Code Generation**
Codes parrainage uniques 6 caractères (crypto.randomBytes) générés à l'inscription. Vérification unicité base. Format : lettres majuscules et chiffres pour lisibilité.

### **Tracking Conversions**
Liaison referrer_id stockée dans user_profiles à l'inscription. Référence maintenue dans purchases pour calcul commission. Table referral_conversions pour historique détaillé.

### **Commission Logic**
Taux commission configurable par admin (0% à 50% max). Calcul automatique sur montant TTC. États commission : pending, approved, paid, cancelled. Seuil minimum paiement configurable.

### **Interface Utilisateur**
Page dédiée affichage code parrainage personnel avec URL complète. Statistiques conversions : nombre parrainés, commissions gagnées, statut paiements. Historique détaillé avec filtres.

### **Anti-Fraud**
Validation impossible parrainage soi-même. Détection patterns suspects (même IP, timing). Limite commissions par période pour éviter abus. Audit trail complet actions parrainage.

### **Règles Business**
Une commission par achat maximum. Commissions versées uniquement après validation admin. Pas de commission sur remboursements. Expiration liens parrainage optionnelle.

## ⚙️ **BRIQUE 4 : Administration**

### **Responsabilités**
Interface administration complète : gestion utilisateurs (rôles, statuts), configuration système (commissions, seuils), analytics business, modération comptes, audit actions admin.

### **Gestion Utilisateurs**
Liste paginée tous utilisateurs avec filtres avancés. Changement rôle admin/member avec confirmation. Suspension/réactivation comptes avec raisons. Vue détaillée profil + historique achats + parrainage.

### **Configuration Système**
Table system_settings pour paramètres clé-valeur JSON. Configuration taux commission parrainage. Seuils minimum paiement commissions. Templates email personnalisables. Maintenance mode activable.

### **Analytics Dashboard**
Métriques business essentielles : nouveaux utilisateurs, conversions paiement, revenus période, top parrains. Graphiques évolution temporelle. Export données CSV pour analyses poussées.

### **Sécurité Admin**
Accès admin uniquement via rôle database. Toutes actions admin loggées dans audit_logs avec détails complets. Rate limiting renforcé sur endpoints admin. Interface HTTPS obligatoire production.

### **Règles Business**
Un seul super admin par défaut. Actions critiques avec confirmation double. Impossibilité suppression admin dernière. Logs admin conservés minimum 1 an. Sauvegarde données avant modifications bulk.

## 📊 **BRIQUE 5 : Observabilité**

### **Responsabilités**
Monitoring complet application : audit logging toutes actions, métriques performance temps réel, alertes sécurité automatiques, monitoring santé Stripe, dashboard ops.

### **Audit Logging**
Service centralisé logging utilisant service role Supabase bypass RLS. Structure logs normalisée : user_id, action, resource_type, resource_id, metadata JSON, contexte request (IP, user-agent).

### **Monitoring Métier**
Suivi KPI business temps réel : inscriptions/jour, conversions paiement, revenus, commissions versées. Alertes seuils configurables. Intégration possible outils externes (Mixpanel, Amplitude).

### **Security Monitoring**
Détection tentatives brute force auth. Alertes webhooks Stripe échoués. Monitoring usage quotas API. Détection patterns suspects parrainage. Logs sécurité séparés.

### **Performance Tracking**
Métriques Core Web Vitals via Next.js. Monitoring temps réponse orpc endpoints. Usage mémoire/CPU. Monitoring uptime Supabase. Dashboard Grafana optionnel.

### **Alerting Strategy**
Alertes email admin pour événements critiques. Webhooks Discord/Slack pour notifications temps réel. Escalation automatique si admin non réactif. Configuration seuils par environnement.

## 🔐 **BRIQUE 6 : Permissions & RBAC**

### **Responsabilités**
Gestion centralisée permissions et contrôle accès : définition rôles système, vérification permissions granulaires, interface extensible V1→V2, intégration middleware sécurisé, audit trail permissions.

### **Architecture V1 : Simplicité Contrôlée**
Système binaire simple member/admin avec interface extensible préparée pour RBAC complet V2. Vérification permissions via interface unifiée hasPermission même si implémentation V1 basique. Architecture sur-sécurisée dès le départ.

### **Évolution V2 : RBAC Complet**
Extension transparente vers member_premium, moderator, instructor avec permissions granulaires. Migration V1→V2 sans refonte grâce interface abstraite. Ajout table permissions + relations sans casser existant.

### **Rôles et Hiérarchie V1**
Deux rôles uniquement : member (utilisateur authentifié standard) avec accès profil/achats/parrainage, admin (super-utilisateur) avec gestion complète système. Pas de rôles intermédiaires pour simplicité développement V1.

### **Interface Permissions Extensible**
Service centralisé PermissionService avec méthode hasPermission(user, action, resource) utilisée partout. Implémentation V1 simple vérification rôle. Extension V2 table permissions sans changer signatures. Abstraction complète logique permissions.

### **Intégration Middleware Triple**
Vérification permissions trois niveaux obligatoires : middleware Next.js protection routes, middleware orpc validation endpoints, RLS Supabase sécurité données. Aucun niveau bypass possible. Redondance sécurisée.

### **Gestion Contexte Auth**
Context auth injecté toutes requêtes : user complet, profile enrichi, permissions calculées, métadonnées session. Disponible middleware Next.js et handlers orpc. Cache intelligent éviter recalculs.

### **Actions Permissions V1**
Actions définies par constantes typées : AUTH_MANAGE (gestion auth), PROFILE_VIEW/EDIT (profil), PURCHASE_VIEW (achats), REFERRAL_MANAGE (parrainage), ADMIN_USERS/SETTINGS/ANALYTICS (administration). Extensible V2 granularité fine.

### **Validation Granulaire**
Vérification action + resource optionnelle : hasPermission(user, 'PROFILE_EDIT', profileId) vérifie propriété. Support ownership patterns. Validation cascading permissions futures (ex: moderator cours spécifiques).

### **Règles Business V1**
Admin unique super-utilisateur accès total système. Members standard accès leurs données uniquement. Pas de permissions temporaires ou conditionnelles V1. Auto-assignment rôle member inscription. Promotion admin manuelle uniquement.

### **Extension V2 Préparée**
Structure code préparée member_premium (accès cours payants), moderator (modération communauté, support), instructor (création contenu, analytics cours). Permissions granulaires par domaine. Hiérarchie rôles avec héritage.

### **Sécurité Permissions**
Principe moindre privilège strict : accès minimum nécessaire par défaut. Validation côté serveur systématique, jamais confiance client. Permissions cachées utilisateur (pas d'exposition API publique). Audit trail toute modification permission.

### **Performance et Cache**
Cache permissions utilisateur session complète éviter requêtes répétées. Invalidation cache intelligente changement rôle/permissions. Précalcul permissions complexes V2. Optimisation RLS queries avec indexes appropriés.

### **Tests Permissions**
Tests unitaires toute logique permissions : hasPermission toutes combinaisons, middleware protection, escalation privilèges. Tests intégration middleware + orpc + RLS. Tests régression migration V1→V2.

### **Migration Strategy**
Phase transition V1→V2 planifiée : ajout table permissions sans impact, migration données existantes, activation progressive RBAC, décommission vieux système. Rollback possible chaque étape.

### **Anti-Patterns Évités**
Jamais de permissions hardcodées dans composants. Pas de logique permissions dupliquée. Éviter vérifications permissions côté client seules. Pas de court-circuits sécurité développement. Jamais de rôles admin multiples V1.

## 🔧 **Intégration orpc et Middleware**

### **Architecture orpc**
Tous endpoints API exposés via orpc avec contrats Zod strict. Organisation par domaines : auth, payment, referral, admin, monitoring. Middleware orpc pour auth, rate limiting, validation, audit.

### **Contrats par Brique**
Chaque brique expose ses contrats orpc indépendamment : authContract, permissionsContract, paymentContract, referralContract, adminContract, monitoringContract. Validation input/output systématique. Types auto-générés pour client.

### **Middleware Pipeline**
Pipeline middleware Next.js : security headers + CSP, rate limiting global, auth extraction, route protection, onboarding validation. Pipeline orpc : auth context, permissions, validation métier, audit logging.

### **Error Handling**
Gestion erreurs normalisée tous endpoints : BusinessError, ValidationError, SecurityError, TechnicalError. Messages utilisateur internationalisés. Logging détaillé pour debug.

### **Caching Strategy**
Cache Redis optionnel pour sessions utilisateur. Cache Next.js pour données statiques. Invalidation intelligente cache post-mutations. Headers cache appropriés endpoints publics.

## 🛡️ **Sécurité et Compliance**

### **Authentification**
Validation email obligatoire activation compte. Rate limiting strict endpoints sensibles. Sessions sécurisées via cookies httpOnly/secure/sameSite avec capture systématique du refresh token. Un service serveur persiste chaque session dans la table `auth_sessions` (TTL, IP, user-agent) et révoque les tokens via `supabase.auth.admin.signOut`. Logout simple invalide uniquement la session courante (scope « local » + drapeau « revoked » en base), l’option « all devices » déclenche un `signOut` global et marque toutes les sessions comme révoquées.

### ✅ Préflight Auth Checklist
- Variables d’environnement prod validées (`validateServerEnv`) : URL Supabase, clés anon/service role, `SUPABASE_JWT_SECRET`, `SUPABASE_PROJECT_REF`, `SUPABASE_DATABASE_PASSWORD`, Upstash si Redis.
- RLS activées sur toutes les tables (`supabase/migrations/20250915120000_enable_rls_all_tables.sql`).
- Sessions persistées dans `auth_sessions` (tests `auth.sessions.test.ts`).
- Rate limiting & brute-force persistant (`auth_rate_limit_counters`, `auth_bruteforce_attempts` + tests `rateLimit.backoff.test.ts`).
- Tests environnement (`tests/env/server-env.test.ts`) exécutés.
- `supabase db reset` exécutée après chaque migration.

### **Autorisation**
RLS Supabase sur toutes tables sans exception. Vérification permissions middleware + orpc handlers. Context auth injecté toutes requêtes authentifiées. Principe moindre privilège strict.

### **Protection Données**
Chiffrement données sensibles au repos. Pas de PII dans logs applicatifs. Consentements RGPD explicites et granulaires. Droit oubli implémentable. Audit trail immutable.

### **Paiements**
Validation signature Stripe obligatoire. Jamais de prix/montants côté client. Métadonnées paiement signées cryptographiquement. Réconciliation automatique détection fraude.

### **Infrastructure**
HTTPS obligatoire tous environnements. CSP stricte sans unsafe-*. Headers sécurité complets. Variables env validées Zod. Secrets rotation régulière.

## 📈 **Plan de Développement**

### **Phase 1 : Auth Foundation (2 semaines)**
Configuration Supabase Auth complet, schéma database avec RLS, middleware auth pipeline, pages signin/signup/onboarding, service AuthService, tests auth complets.

### **Phase 2 : Permissions & RBAC (1 semaine)**
Interface PermissionService extensible, actions permissions V1, intégration middleware triple, tests permissions complets, préparation architecture V2. **Développable en parallèle**.

### **Phase 3 : Stripe Integration (2 semaines)**
Configuration Stripe Products/Webhooks, service PaymentService, webhooks sécurisés, interface achat basique, réconciliation paiements, tests mode Stripe test.

### **Phase 4 : Referral System (2 semaines)**
Génération codes parrainage, tracking conversions, calcul commissions automatique, interface utilisateur parrainage, service ReferralService, tests système complet.

### **Phase 5 : Admin Interface (2 semaines)**
Dashboard admin, gestion utilisateurs, configuration système, analytics business, service AdminService, interface responsive, tests admin.

### **Phase 6 : Monitoring (1 semaine)**
Audit logging, monitoring business, alertes sécurité, dashboard observabilité, service AuditService, tests monitoring.

### **Phase 7 : Integration & Deploy (1 semaine)**
Tests bout en bout, optimisation performance, configuration production, déploiement, documentation utilisateur.

## ⚠️ **Contraintes et Limitations**

### **Techniques**
Architecture monolithique Next.js uniquement V1. Base données Supabase PostgreSQL sans sharding. Pas de queues/workers pour traitements asynchrones. Cache mémoire local uniquement.

### **Business**
Paiements one-shot seulement, pas abonnements. Commission parrainage unique par achat. Interface anglais uniquement V1. Support client basique. Pas de marketplace multi-vendeurs.

### **Sécurité**
MFA admin repoussé V2. Rotation automatique secrets repoussée. Monitoring avancé (SIEM) reporté. Chiffrement application-level reporté.

### **Performance**
Pas d'optimisation CDN avancée. Cache distribué reporté V2. Optimisation images basique. Monitoring APM externe reporté.

### **Compliance**
RGPD basique compliance. Audit externe sécurité reporté. Certification SOC2 reportée. Documentation compliance minimale V1.

Cette architecture Auth V1 + Stripe établit des fondations techniques et business ultra-solides pour l'évolution future vers le LMS IA complet, tout en restant parfaitement alignée sur les standards de qualité 10/10 déjà établis dans le projet.
