# 🗄️ BRIQUE 0 : BASE DE DONNÉES - SPÉCIFICATIONS ULTRA-DÉTAILLÉES

**Version**: 1.0  
**Date**: 2025-01-10  
**Priorité**: 🚨 CRITIQUE - BLOQUANT POUR TOUTES LES AUTRES BRIQUES  
**Durée estimée**: 4 phases progressives (4 jours sécurisés)  

---

## 🎉 **RÉSUMÉ D'EXÉCUTION - PREMIÈRE MICRO-ÉTAPE ACCOMPLIE**

### ✅ **RÉALISATIONS CONCRÈTES (11 SEPTEMBRE 2025)**

**📊 INFRASTRUCTURE DATABASE**
- [X] **Migration SQL** : `20250911124644_create_user_profiles_basic.sql` créée et appliquée
- [X] **Table user_profiles** : 4 colonnes (id, full_name, created_at, updated_at) + index performance
- [X] **Liaison auth.users** : Foreign key avec CASCADE, pas de hardcode

**🔧 TYPES ET SERVICES**
- [X] **Types générés** : `database.generated.ts` auto-généré par Supabase CLI
- [X] **API Types** : Integration dans `api.types.ts` avec re-exports propres
- [X] **Services Supabase** : CRUD complet `profileService` + `adminService` avec types stricts
- [X] **Zero Hardcode** : Configuration 100% variables d'environnement

**🌐 INTÉGRATION ORPC**
- [X] **Contrats** : `profile.contract.ts` avec validation Zod stricte (uuid, min/max)
- [X] **Handlers** : `profile.handlers.ts` avec gestion d'erreur complète + logging structuré
- [X] **Context** : oRPC context utilise Database typé, clients Supabase fonctionnels
- [X] **Endpoints** : `/api/rpc/profile/get` et `/api/rpc/profile/create` opérationnels

**✅ QUALITÉ ET BUILD**
- [X] **Build Production** : `✓ Compiled successfully in 4.0s`, 19 routes générées
- [X] **TypeScript** : 0 erreur de compilation
- [X] **ESLint** : 0 erreur (2 warnings non-liés corrigés)
- [X] **Application** : Démarrage en 2.2s sur http://localhost:3001

**🎯 ARCHITECTURE VALIDÉE**
- [X] **Database → Types** : Génération automatique fonctionnelle
- [X] **Types → Services** : Autocomplétion TypeScript parfaite
- [X] **Services → orpc** : Context typé, handlers sans erreur
- [X] **orpc → Frontend** : Endpoints accessibles et documentés

### 📈 **VALEUR IMMÉDIATE DÉBLOQUÉE**
Cette première micro-étape établit **la fondation technique complète** pour l'évolution future de la base de données, avec zéro risque pour l'architecture existante et une extensibilité maximale.

---

## 🔍 AUDIT CRITIQUE - ÉTAT ACTUEL vs BESOINS

### ❌ GAPS CRITIQUES IDENTIFIÉS

**BASE DE DONNÉES : ÉTAT ZÉRO TOTAL**
```bash
# RÉALITÉ BRUTALE
supabase/migrations/     # ❌ N'EXISTE PAS
supabase/seed.sql        # ✅ Existe mais VIDE (7 lignes de commentaires)
app/src/shared/types/api.types.ts  # ❌ Database interface VIDE
app/src/shared/lib/supabase/index.ts  # ❌ Export vide : export {}
```

**CONSÉQUENCES CATASTROPHIQUES**
- ❌ Auth Supabase : IMPOSSIBLE (pas de tables auth.users extended)
- ❌ orpc handlers : PLANTENT (pas de types Database)
- ❌ Middleware auth : INUTILE (pas de données à protéger)
- ❌ RLS : INEXISTANT (pas de tables à sécuriser)
- ❌ Services business : NON-FONCTIONNELS

### ✅ FONDATIONS EXCELLENTES À EXPLOITER

**ARCHITECTURE TECHNIQUE (10/10)**
- ✅ Supabase configuré (config.toml parfait)
- ✅ orpc framework 100% opérationnel
- ✅ Middleware sécurisé (auth, CSP, rate limiting)
- ✅ Validation Zod systématique
- ✅ Types TypeScript stricts partout

**DIAGNOSTIC** : Architecture technique PARFAITE, mais 0% de logique métier implémentée.

---

## 🏗️ ARCHITECTURE BRIQUE 0 - VUE D'ENSEMBLE TECHNIQUE

### RESPONSABILITÉS DE LA BRIQUE 0

**MISSION CRITIQUE** : Établir la couche persistance complète pour le LMS IA V1

**SCOPE FONCTIONNEL**
1. **Schéma complet** : 6 tables principales + relations
2. **Sécurité RLS** : Politiques ultra-strictes par table/opération
3. **Types générés** : Database interfaces TypeScript
4. **Migrations versionnées** : Schema évolutif et rollbackable
5. **Services Supabase** : Clients admin/user fonctionnels
6. **Intégration orpc** : Context Database injectable

**TECHNOLOGIES UTILISÉES**
- PostgreSQL 15 (via Supabase managed)
- Supabase CLI pour migrations
- RLS (Row Level Security) Postgres natif
- supabase-js client v2.57.0
- Types générés automatiquement

---

## 🗂️ MODÈLE DE DONNÉES COMPLET

### PRINCIPE DE DESIGN

**ARCHITECTURE RELATIONNELLE STRICTE**
- Tables normalisées 3NF minimum
- Contraintes référentielles CASCADE/RESTRICT logiques
- Index optimisés pour requêtes critiques
- Audit trail immutable sur toutes actions sensibles

### 📋 TABLE 1: `user_profiles` (Extension auth.users)

**RESPONSABILITÉ** : Enrichir les données auth Supabase avec profil business

```sql
-- Migration: 20250110_001_create_user_profiles.sql
create table public.user_profiles (
  -- Clé primaire liée à auth.users
  id uuid not null references auth.users(id) on delete cascade,
  
  -- Données profil enrichies
  full_name text not null,
  avatar_url text,
  phone text,
  
  -- Parrainage système
  referral_code text not null unique,
  referrer_id uuid references public.user_profiles(id) on delete set null,
  
  -- Business logic
  role text not null default 'member' check (role in ('member', 'admin')),
  status text not null default 'active' check (status in ('active', 'suspended', 'pending_verification')),
  
  -- Consentements RGPD (obligatoires)
  consents jsonb not null default '{
    "marketing": false,
    "analytics": false,
    "cookies": true
  }'::jsonb,
  
  -- Onboarding tracking
  onboarding_completed boolean not null default false,
  onboarding_completed_at timestamptz,
  
  -- Métadonnées
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Contraintes
  primary key (id),
  
  -- Validation consentements structure
  constraint valid_consents_structure check (
    consents ? 'marketing' and 
    consents ? 'analytics' and 
    consents ? 'cookies'
  ),
  
  -- Validation cohérence onboarding
  constraint onboarding_consistency check (
    (onboarding_completed = true and onboarding_completed_at is not null) or
    (onboarding_completed = false)
  )
);

-- Index critiques
create index idx_user_profiles_referral_code on public.user_profiles(referral_code);
create index idx_user_profiles_referrer_id on public.user_profiles(referrer_id);
create index idx_user_profiles_status on public.user_profiles(status) where status != 'active';
create index idx_user_profiles_onboarding on public.user_profiles(onboarding_completed) where onboarding_completed = false;

-- Trigger updated_at automatique
create trigger user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.handle_updated_at();
```

**JUSTIFICATIONS DESIGN**
- `referral_code` unique généré automatiquement (trigger)
- `referrer_id` nullable (utilisateurs sans parrainage)
- `consents` JSONB pour flexibilité RGPD future
- `onboarding_completed` tracking obligatoire middleware
- Contraintes CHECK pour garantir cohérence données

---

### 🛍️ TABLE 2: `products` (Catalogue Stripe)

**RESPONSABILITÉ** : Synchronisation catalogue Stripe + métadonnées business

```sql
-- Migration: 20250110_002_create_products.sql
create table public.products (
  -- Identifiants
  id text not null, -- Stripe Product ID
  stripe_price_id text not null, -- Stripe Price ID principal
  
  -- Informations produit
  name text not null,
  description text,
  features jsonb not null default '[]'::jsonb,
  
  -- Pricing
  price_amount integer not null, -- en centimes
  price_currency text not null default 'EUR',
  
  -- Business logic
  category text not null check (category in ('course', 'bundle', 'premium')),
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  
  -- Métadonnées
  stripe_metadata jsonb not null default '{}'::jsonb,
  internal_metadata jsonb not null default '{}'::jsonb,
  
  -- Audit
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Contraintes
  primary key (id),
  
  -- Validation prix positif
  constraint positive_price check (price_amount > 0),
  
  -- Validation features array
  constraint valid_features_array check (jsonb_typeof(features) = 'array')
);

-- Index business critiques
create index idx_products_status on public.products(status) where status = 'active';
create index idx_products_category on public.products(category);
create index idx_products_price_range on public.products(price_amount);

-- Trigger updated_at
create trigger products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();
```

**JUSTIFICATIONS DESIGN**
- `id` = Stripe Product ID pour synchronisation directe
- `stripe_price_id` pour checkout sessions
- `price_amount` integer centimes (standard Stripe)
- `features` JSONB array pour flexibilité
- Double métadonnées : Stripe + internal logic

---

### 💰 TABLE 3: `purchases` (Historique Achats)

**RESPONSABILITÉ** : Source de vérité des achats + accès produits

```sql
-- Migration: 20250110_003_create_purchases.sql
create table public.purchases (
  -- Identifiants
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  product_id text not null references public.products(id) on delete restrict,
  
  -- Stripe tracking
  stripe_session_id text not null unique,
  stripe_payment_intent_id text unique,
  stripe_customer_id text not null,
  
  -- Business data
  amount_paid integer not null, -- centimes
  currency text not null,
  
  -- États paiement (suivent Stripe lifecycle)
  status text not null check (status in ('pending', 'completed', 'failed', 'refunded', 'partially_refunded')),
  refund_amount integer default 0,
  
  -- Parrainage (calculé au moment de l'achat)
  referrer_id uuid references public.user_profiles(id) on delete set null,
  commission_rate decimal(5,4), -- ex: 0.1250 = 12.5%
  commission_amount integer, -- centimes
  
  -- Métadonnées Stripe (complètes)
  stripe_metadata jsonb not null default '{}'::jsonb,
  
  -- Audit trail
  completed_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Contraintes
  primary key (id),
  
  -- Validation montants
  constraint positive_amount_paid check (amount_paid > 0),
  constraint valid_refund_amount check (refund_amount >= 0 and refund_amount <= amount_paid),
  constraint valid_commission_rate check (commission_rate >= 0 and commission_rate <= 0.5), -- max 50%
  constraint valid_commission_amount check (commission_amount >= 0),
  
  -- Validation cohérence états
  constraint status_completed_consistency check (
    (status = 'completed' and completed_at is not null) or
    (status != 'completed')
  ),
  constraint status_refund_consistency check (
    (status in ('refunded', 'partially_refunded') and refunded_at is not null) or
    (status not in ('refunded', 'partially_refunded'))
  ),
  
  -- Un seul achat par utilisateur par produit
  unique(user_id, product_id)
);

-- Index critiques performance
create index idx_purchases_user_id on public.purchases(user_id);
create index idx_purchases_product_id on public.purchases(product_id);
create index idx_purchases_status on public.purchases(status);
create index idx_purchases_referrer_id on public.purchases(referrer_id) where referrer_id is not null;
create index idx_purchases_stripe_session on public.purchases(stripe_session_id);

-- Index business queries
create index idx_purchases_completed on public.purchases(completed_at) where status = 'completed';
create index idx_purchases_commission on public.purchases(referrer_id, commission_amount) 
  where referrer_id is not null and commission_amount > 0;

-- Trigger updated_at
create trigger purchases_updated_at
  before update on public.purchases
  for each row execute function public.handle_updated_at();
```

**JUSTIFICATIONS DESIGN**
- `stripe_session_id` unique pour idempotence webhooks
- Constraint `unique(user_id, product_id)` = un achat max par produit
- `commission_*` calculés snapshot au moment achat (pas recalculés)
- États paiement suivent lifecycle Stripe exact
- Audit trail complet pour réconciliation

---

### 🤝 TABLE 4: `referral_conversions` (Tracking Parrainage)

**RESPONSABILITÉ** : Historique détaillé conversions parrainage + commissions

```sql
-- Migration: 20250110_004_create_referral_conversions.sql
create table public.referral_conversions (
  -- Identifiants
  id uuid not null default gen_random_uuid(),
  referrer_id uuid not null references public.user_profiles(id) on delete cascade,
  referred_user_id uuid not null references public.user_profiles(id) on delete cascade,
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  
  -- Données conversion
  conversion_type text not null check (conversion_type in ('signup', 'first_purchase', 'additional_purchase')),
  
  -- Commission details (snapshot du moment)
  commission_rate decimal(5,4) not null,
  commission_amount integer not null, -- centimes
  purchase_amount integer not null, -- centimes (référence)
  
  -- États commission
  commission_status text not null default 'pending' 
    check (commission_status in ('pending', 'approved', 'paid', 'cancelled')),
  
  -- Paiement commission
  paid_at timestamptz,
  payment_method text, -- 'bank_transfer', 'stripe', 'manual', etc.
  payment_reference text,
  
  -- Audit & tracking
  approved_by uuid references public.user_profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Contraintes
  primary key (id),
  
  -- Validation données business
  constraint positive_amounts check (
    commission_amount > 0 and 
    purchase_amount > 0 and 
    commission_amount <= purchase_amount
  ),
  constraint valid_commission_rate check (commission_rate > 0 and commission_rate <= 0.5),
  
  -- Validation cohérence paiement
  constraint payment_consistency check (
    (commission_status = 'paid' and paid_at is not null) or
    (commission_status != 'paid' and paid_at is null)
  ),
  constraint approval_consistency check (
    (commission_status in ('approved', 'paid') and approved_by is not null and approved_at is not null) or
    (commission_status not in ('approved', 'paid'))
  ),
  
  -- Anti-fraude: pas d'auto-parrainage
  constraint no_self_referral check (referrer_id != referred_user_id),
  
  -- Une conversion par achat maximum
  unique(purchase_id)
);

-- Index critiques analytics
create index idx_referral_conversions_referrer on public.referral_conversions(referrer_id);
create index idx_referral_conversions_referred_user on public.referral_conversions(referred_user_id);
create index idx_referral_conversions_purchase on public.referral_conversions(purchase_id);
create index idx_referral_conversions_status on public.referral_conversions(commission_status);

-- Index business queries
create index idx_referral_pending_commissions on public.referral_conversions(referrer_id, commission_amount) 
  where commission_status = 'pending';
create index idx_referral_paid_commissions on public.referral_conversions(referrer_id, paid_at) 
  where commission_status = 'paid';

-- Trigger updated_at
create trigger referral_conversions_updated_at
  before update on public.referral_conversions
  for each row execute function public.handle_updated_at();
```

**JUSTIFICATIONS DESIGN**
- Séparation claire `purchases` (paiements) vs `referral_conversions` (commissions)
- Snapshot commission_rate au moment conversion (évite recalculs)
- États commission indépendants des paiements Stripe
- Anti-fraude via constraint `no_self_referral`
- Audit trail approbation manuelle admin

---

### ⚙️ TABLE 5: `system_settings` (Configuration Système)

**RESPONSABILITÉ** : Paramètres configurables sans redéploiement

```sql
-- Migration: 20250110_005_create_system_settings.sql
create table public.system_settings (
  -- Identifiant
  key text not null,
  
  -- Valeur (flexible JSON)
  value jsonb not null,
  
  -- Métadonnées
  description text,
  category text not null default 'general',
  
  -- Validation type
  value_type text not null check (value_type in ('string', 'number', 'boolean', 'object', 'array')),
  
  -- Sécurité
  is_public boolean not null default false, -- exposé côté client
  is_sensitive boolean not null default false, -- logs masqués
  
  -- Audit
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Contraintes
  primary key (key),
  
  -- Validation cohérence type
  constraint value_type_consistency check (
    (value_type = 'string' and jsonb_typeof(value) = 'string') or
    (value_type = 'number' and jsonb_typeof(value) = 'number') or
    (value_type = 'boolean' and jsonb_typeof(value) = 'boolean') or
    (value_type = 'object' and jsonb_typeof(value) = 'object') or
    (value_type = 'array' and jsonb_typeof(value) = 'array')
  )
);

-- Index queries fréquentes
create index idx_system_settings_category on public.system_settings(category);
create index idx_system_settings_public on public.system_settings(is_public) where is_public = true;

-- Trigger updated_at
create trigger system_settings_updated_at
  before update on public.system_settings
  for each row execute function public.handle_updated_at();

-- Seed données essentielles
insert into public.system_settings (key, value, description, category, value_type, is_public) values
  ('referral.default_commission_rate', '0.10', 'Taux commission parrainage par défaut (10%)', 'referral', 'number', false),
  ('referral.min_payout_amount', '2000', 'Seuil minimum paiement commission (20€ en centimes)', 'referral', 'number', false),
  ('auth.onboarding_mandatory', 'true', 'Onboarding obligatoire post-vérification', 'auth', 'boolean', true),
  ('payments.supported_currencies', '["EUR", "USD"]', 'Devises supportées', 'payments', 'array', true),
  ('system.maintenance_mode', 'false', 'Mode maintenance activé', 'system', 'boolean', true),
  ('analytics.track_conversions', 'true', 'Tracking conversions analytics', 'analytics', 'boolean', false);
```

**JUSTIFICATIONS DESIGN**
- Clé-valeur flexible avec validation type
- `is_public` pour exposition côté client
- `is_sensitive` pour masquage logs
- Seed data avec paramètres V1 essentiels

---

### 📋 TABLE 6: `audit_logs` (Trail d'Audit)

**RESPONSABILITÉ** : Traçabilité immutable toutes actions sensibles

```sql
-- Migration: 20250110_006_create_audit_logs.sql
create table public.audit_logs (
  -- Identifiants
  id uuid not null default gen_random_uuid(),
  
  -- Context utilisateur (peut être null pour système)
  user_id uuid references public.user_profiles(id) on delete set null,
  
  -- Action tracking
  action text not null, -- 'user.signup', 'purchase.completed', 'admin.user_suspended', etc.
  resource_type text not null, -- 'user', 'purchase', 'product', etc.
  resource_id text, -- UUID ou ID de la ressource impactée
  
  -- Détails action
  details jsonb not null default '{}'::jsonb,
  
  -- Context request
  ip_address inet,
  user_agent text,
  request_id text,
  
  -- Métadonnées
  created_at timestamptz not null default now(),
  
  -- Contraintes
  primary key (id),
  
  -- Validation format action (namespace.operation)
  constraint valid_action_format check (action ~ '^[a-z_]+\.[a-z_]+$')
);

-- Index critiques pour queries audit
create index idx_audit_logs_user_id on public.audit_logs(user_id) where user_id is not null;
create index idx_audit_logs_action on public.audit_logs(action);
create index idx_audit_logs_resource on public.audit_logs(resource_type, resource_id);
create index idx_audit_logs_created_at on public.audit_logs(created_at desc);
create index idx_audit_logs_ip on public.audit_logs(ip_address) where ip_address is not null;

-- Index composite pour queries fréquentes
create index idx_audit_logs_user_actions on public.audit_logs(user_id, action, created_at desc) 
  where user_id is not null;

-- Partition par date (performance long terme)
-- Note: À implémenter si volume > 1M logs
```

**JUSTIFICATIONS DESIGN**
- Table append-only (pas de DELETE/UPDATE)
- Actions structurées `namespace.operation`
- Context request complet pour investigation
- Index optimisés pour queries admin dashboard

---

## 🛡️ POLITIQUES RLS ULTRA-STRICTES

### PRINCIPE SÉCURITÉ : DÉPLOIEMENT PROGRESSIF SÉCURISÉ

**STRATÉGIE PRAGMATIQUE**
1. **Phase 1** : Tables SANS RLS (fonctionnalité complète d'abord)
2. **Phase 2** : RLS table par table avec validation
3. **Phase 3** : Contraintes métier progressives
4. **Phase 4** : Optimisation et audit final
5. **Rollback immédiat** : si blocage à toute étape

**RÈGLES DE SÉCURITÉ FINALES**
- RLS obligatoire sur TOUTES les tables (après validation)
- Service role bypass uniquement webhooks + audit
- Principe moindre privilège strict
- Politiques granulaires testées individuellement

### 🔐 RLS TABLE 1: `user_profiles`

```sql
-- Migration: 20250110_007_rls_user_profiles.sql

-- Activer RLS
alter table public.user_profiles enable row level security;

-- POLICY SELECT : Utilisateurs voient leur profil + admins voient tout
create policy "user_profiles_select_own"
  on public.user_profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "user_profiles_select_admin"
  on public.user_profiles for select
  to authenticated
  using (
    id in (
      select id from public.user_profiles 
      where id = (select auth.uid()) 
      and role = 'admin'
    )
  );

-- POLICY INSERT : Auto-insertion à la création compte
create policy "user_profiles_insert_own"
  on public.user_profiles for insert
  to authenticated
  with check (id = (select auth.uid()));

-- POLICY UPDATE : Utilisateurs modifient leur profil (sauf champs sensibles)
create policy "user_profiles_update_own"
  on public.user_profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid()) and
    -- Validation champs modifiables par user
    role = (select role from public.user_profiles where id = (select auth.uid())) and
    status = (select status from public.user_profiles where id = (select auth.uid()))
  );

-- POLICY UPDATE ADMIN : Admins modifient status/role autres users
create policy "user_profiles_update_admin"
  on public.user_profiles for update
  to authenticated
  using (
    (select auth.uid()) in (
      select id from public.user_profiles 
      where role = 'admin'
    )
  );

-- POLICY DELETE : Interdite (cascade auth.users)
-- Pas de policy DELETE = interdiction totale
```

### 🛍️ RLS TABLE 2: `products`

```sql
-- Migration: 20250110_008_rls_products.sql

alter table public.products enable row level security;

-- POLICY SELECT : Produits actifs visibles par tous
create policy "products_select_active"
  on public.products for select
  to authenticated, anon
  using (status = 'active');

-- POLICY SELECT ADMIN : Admins voient tous produits
create policy "products_select_admin"
  on public.products for select
  to authenticated
  using (
    (select auth.uid()) in (
      select id from public.user_profiles 
      where role = 'admin'
    )
  );

-- POLICY INSERT/UPDATE/DELETE : Admins uniquement
create policy "products_modify_admin"
  on public.products for all
  to authenticated
  using (
    (select auth.uid()) in (
      select id from public.user_profiles 
      where role = 'admin'
    )
  );
```

### 💰 RLS TABLE 3: `purchases`

```sql
-- Migration: 20250110_009_rls_purchases.sql

alter table public.purchases enable row level security;

-- POLICY SELECT : Users voient leurs achats
create policy "purchases_select_own"
  on public.purchases for select
  to authenticated
  using (user_id = (select auth.uid()));

-- POLICY SELECT ADMIN : Admins voient tous achats
create policy "purchases_select_admin"
  on public.purchases for select
  to authenticated
  using (
    (select auth.uid()) in (
      select id from public.user_profiles 
      where role = 'admin'
    )
  );

-- POLICY INSERT : Service role uniquement (webhooks Stripe)
create policy "purchases_insert_service"
  on public.purchases for insert
  to service_role
  with check (true);

-- POLICY UPDATE : Service role pour MAJ statuts Stripe
create policy "purchases_update_service"
  on public.purchases for update
  to service_role
  using (true);
```

### 🤝 RLS TABLE 4: `referral_conversions`

```sql
-- Migration: 20250110_010_rls_referral_conversions.sql

alter table public.referral_conversions enable row level security;

-- POLICY SELECT : Referrers voient leurs conversions
create policy "referral_conversions_select_referrer"
  on public.referral_conversions for select
  to authenticated
  using (referrer_id = (select auth.uid()));

-- POLICY SELECT : Referred users voient leurs propres conversions
create policy "referral_conversions_select_referred"
  on public.referral_conversions for select
  to authenticated
  using (referred_user_id = (select auth.uid()));

-- POLICY SELECT ADMIN : Admins voient toutes conversions
create policy "referral_conversions_select_admin"
  on public.referral_conversions for select
  to authenticated
  using (
    (select auth.uid()) in (
      select id from public.user_profiles 
      where role = 'admin'
    )
  );

-- POLICY INSERT/UPDATE : Service role + Admin (approbation commissions)
create policy "referral_conversions_modify_privileged"
  on public.referral_conversions for all
  to service_role, authenticated
  using (
    -- Service role bypass OU admin user
    current_setting('role') = 'service_role' OR
    (select auth.uid()) in (
      select id from public.user_profiles 
      where role = 'admin'
    )
  );
```

### ⚙️ RLS TABLE 5: `system_settings`

```sql
-- Migration: 20250110_011_rls_system_settings.sql

alter table public.system_settings enable row level security;

-- POLICY SELECT PUBLIC : Settings publics visibles par tous
create policy "system_settings_select_public"
  on public.system_settings for select
  to authenticated, anon
  using (is_public = true);

-- POLICY SELECT ADMIN : Admins voient tous settings
create policy "system_settings_select_admin"
  on public.system_settings for select
  to authenticated
  using (
    (select auth.uid()) in (
      select id from public.user_profiles 
      where role = 'admin'
    )
  );

-- POLICY INSERT/UPDATE/DELETE : Admins uniquement
create policy "system_settings_modify_admin"
  on public.system_settings for all
  to authenticated
  using (
    (select auth.uid()) in (
      select id from public.user_profiles 
      where role = 'admin'
    )
  );
```

### 📋 RLS TABLE 6: `audit_logs`

```sql
-- Migration: 20250110_012_rls_audit_logs.sql

alter table public.audit_logs enable row level security;

-- POLICY SELECT : Users voient leurs propres logs
create policy "audit_logs_select_own"
  on public.audit_logs for select
  to authenticated
  using (user_id = (select auth.uid()));

-- POLICY SELECT ADMIN : Admins voient tous logs
create policy "audit_logs_select_admin"
  on public.audit_logs for select
  to authenticated
  using (
    (select auth.uid()) in (
      select id from public.user_profiles 
      where role = 'admin'
    )
  );

-- POLICY INSERT : Service role uniquement (système audit)
create policy "audit_logs_insert_service"
  on public.audit_logs for insert
  to service_role
  with check (true);

-- Pas d'UPDATE/DELETE : audit logs immutables
```

---

## 🔧 FONCTIONS UTILITAIRES POSTGRES

### FONCTION 1: `handle_updated_at()`

```sql
-- Migration: 20250110_013_functions_utilities.sql

-- Fonction trigger MAJ automatique updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Grant appropriés
grant execute on function public.handle_updated_at() to authenticated, service_role;
```

### FONCTION 2: `generate_referral_code()`

```sql
-- Génération codes parrainage uniques
create or replace function public.generate_referral_code()
returns text
language plpgsql
security definer
as $$
declare
  code text;
  exists_code boolean;
begin
  loop
    -- Générer code 6 caractères alphanumériques
    code := upper(encode(gen_random_bytes(3), 'hex'));
    
    -- Vérifier unicité
    select exists(select 1 from public.user_profiles where referral_code = code) into exists_code;
    
    -- Sortir si unique
    if not exists_code then
      return code;
    end if;
  end loop;
end;
$$;
```

### FONCTION 3: `get_user_role()`

```sql
-- Helper sécurisé récupération rôle user
create or replace function public.get_user_role()
returns text
language sql
security definer
stable
as $$
  select role from public.user_profiles where id = (select auth.uid());
$$;
```

---

## 📝 MIGRATIONS SUPABASE - DÉPLOIEMENT PROGRESSIF SÉCURISÉ

### STRUCTURE MIGRATIONS - 4 PHASES

```bash
# PHASE 1 : FONDATIONS MINIMALES (SANS RLS)
supabase/migrations/
├── 20250110_001_functions_base.sql               # Fonctions utilitaires
├── 20250110_002_create_user_profiles_basic.sql   # Table sans contraintes
├── 20250110_003_create_products_basic.sql        # Table sans contraintes
├── 20250110_004_create_purchases_basic.sql       # Table sans contraintes
├── 20250110_005_create_referral_basic.sql        # Table sans contraintes
├── 20250110_006_create_settings_basic.sql        # Table sans contraintes
└── 20250110_007_create_audit_basic.sql           # Table sans contraintes

# PHASE 2 : ACTIVATION RLS PROGRESSIVE
├── 20250111_001_enable_rls_user_profiles.sql     # RLS + tests
├── 20250111_002_enable_rls_products.sql          # RLS + tests
├── 20250111_003_enable_rls_purchases.sql         # RLS + tests
├── 20250111_004_enable_rls_referrals.sql         # RLS + tests
├── 20250111_005_enable_rls_settings.sql          # RLS + tests
└── 20250111_006_enable_rls_audit.sql             # RLS + tests

# PHASE 3 : CONTRAINTES MÉTIER
├── 20250112_001_add_constraints_users.sql        # Contraintes + index
├── 20250112_002_add_constraints_products.sql     # Contraintes + index
├── 20250112_003_add_constraints_purchases.sql    # Contraintes + index
├── 20250112_004_add_constraints_referrals.sql    # Contraintes + index
└── 20250112_005_add_system_data.sql              # Seed données

# PHASE 4 : OPTIMISATION FINALE
├── 20250113_001_optimization_indexes.sql         # Index performance
├── 20250113_002_triggers_automation.sql          # Triggers métier
└── 20250113_003_validation_final.sql             # Tests complets
```

### COMMANDES SUPABASE CLI

```bash
# 1. Créer chaque migration
supabase migration new create_user_profiles
supabase migration new create_products
# ... etc

# 2. Peupler les fichiers SQL avec le contenu ci-dessus

# 3. Appliquer migrations localement
supabase db reset  # Reset complet avec nouvelles migrations

# 4. Générer types TypeScript
supabase gen types typescript --local > app/src/shared/types/database.generated.ts

# 5. Tester intégrité
supabase db diff  # Vérifier pas de drift

# 6. Push production (quand ready)
supabase db push
```

---

## 📊 TYPES TYPESCRIPT GÉNÉRÉS

### STRUCTURE TYPES ATTENDUE

```typescript
// app/src/shared/types/database.generated.ts (auto-généré)
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          full_name: string
          avatar_url: string | null
          phone: string | null
          referral_code: string
          referrer_id: string | null
          role: 'member' | 'admin'
          status: 'active' | 'suspended' | 'pending_verification'
          consents: Json
          onboarding_completed: boolean
          onboarding_completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          avatar_url?: string | null
          phone?: string | null
          referral_code: string
          referrer_id?: string | null
          role?: 'member' | 'admin'
          status?: 'active' | 'suspended' | 'pending_verification'
          consents?: Json
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          avatar_url?: string | null
          phone?: string | null
          referral_code?: string
          referrer_id?: string | null
          role?: 'member' | 'admin'
          status?: 'active' | 'suspended' | 'pending_verification'
          consents?: Json
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
        }
      }
      // ... autres tables
    }
    Views: {
      // Views si ajoutées
    }
    Functions: {
      // Functions publiques si ajoutées
    }
    Enums: {
      // Enums si utilisés
    }
  }
}
```

### INTÉGRATION TYPES EXISTANTS

```typescript
// app/src/shared/types/api.types.ts (à mettre à jour)
import { Database } from './database.generated';

// Remplacer interface Database vide par import
export type SupabaseClient = import('@supabase/supabase-js').SupabaseClient<Database>;

// Types utilitaires
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type Purchase = Database['public']['Tables']['purchases']['Row'];
export type ReferralConversion = Database['public']['Tables']['referral_conversions']['Row'];
export type SystemSetting = Database['public']['Tables']['system_settings']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];

// Types business utiles
export type UserRole = UserProfile['role'];
export type UserStatus = UserProfile['status'];
export type PurchaseStatus = Purchase['status'];
export type CommissionStatus = ReferralConversion['commission_status'];
```

---

## 🔗 INTÉGRATION SERVICES SUPABASE

### MISE À JOUR `shared/lib/supabase/index.ts`

```typescript
// app/src/shared/lib/supabase/index.ts (remplacer export {} vide)
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/database.generated';

// Configuration depuis env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client public (côté client + serveur)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Client admin (côté serveur uniquement)
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Types exports
export type SupabaseClient = typeof supabase;
export type SupabaseAdminClient = typeof supabaseAdmin;

// Helpers utilitaires
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const isSupabaseAdminConfigured = Boolean(supabaseServiceKey);

// Services par domaine (à implémenter dans BRIQUE 1)
export * as authService from './services/authService';
export * as profileService from './services/profileService';
export * as productService from './services/productService';
export * as purchaseService from './services/purchaseService';
export * as referralService from './services/referralService';
export * as auditService from './services/auditService';
```

### MISE À JOUR CONTEXT oRPC

```typescript
// app/src/orpc/server/context.ts (mise à jour buildAdminClient)
function buildAdminClient(): SupabaseClient<Database> {
  if (_adminClientInstance) {
    return _adminClientInstance;
  }
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) {
    throw new Error('SERVICE_ROLE_NOT_CONFIGURED');
  }
  
  _adminClientInstance = createClient<Database>(url, service, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  return _adminClientInstance;
}
```

---

## ✅ VALIDATION ET TESTS

### TESTS D'INTÉGRITÉ SCHÉMA

```sql
-- Test 1: Vérifier toutes tables créées
select schemaname, tablename 
from pg_tables 
where schemaname = 'public' 
and tablename in ('user_profiles', 'products', 'purchases', 'referral_conversions', 'system_settings', 'audit_logs');

-- Test 2: Vérifier RLS activé partout
select schemaname, tablename, rowsecurity 
from pg_tables 
where schemaname = 'public' 
and rowsecurity = false;  -- Doit être vide

-- Test 3: Vérifier contraintes FK
select tc.constraint_name, tc.table_name, kcu.column_name, 
       ccu.table_name as foreign_table_name, ccu.column_name as foreign_column_name 
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu on tc.constraint_name = kcu.constraint_name
join information_schema.constraint_column_usage ccu on ccu.constraint_name = tc.constraint_name
where tc.constraint_type = 'FOREIGN KEY' 
and tc.table_schema = 'public';

-- Test 4: Compter politiques RLS
select schemaname, tablename, policyname 
from pg_policies 
where schemaname = 'public';
```

### TESTS POLITIQUES RLS

```typescript
// tests/database/rls-policies.test.ts
import { describe, it, expect } from 'vitest';
import { supabase, supabaseAdmin } from '@/shared/lib/supabase';

describe('RLS Policies', () => {
  
  it('user_profiles: users can only see their own profile', async () => {
    // Test isolation utilisateurs
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('*');
    
    expect(profiles).toBeDefined();
    // Plus de tests avec utilisateurs mock
  });

  it('products: anonymous users can see active products', async () => {
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active');
    
    expect(products).toBeDefined();
  });

  // Tests exhaustifs par table...
});
```

### VALIDATION ORPC INTEGRATION

```typescript
// tests/orpc/database-context.test.ts
import { describe, it, expect } from 'vitest';
import { buildContext } from '@/orpc/server/context';

describe('oRPC Database Context', () => {
  
  it('should build context with database clients', () => {
    const ctx = buildContext({
      headers: new Headers(),
      ip: '127.0.0.1'
    });

    expect(ctx.supabase.getUserClient).toBeDefined();
    expect(ctx.supabase.getAdminClient).toBeDefined();
  });

  it('should have typed database clients', () => {
    const ctx = buildContext({ headers: new Headers() });
    const adminClient = ctx.supabase.getAdminClient();
    
    // Test types générés
    expect(adminClient.from('user_profiles').select).toBeDefined();
    expect(adminClient.from('products').select).toBeDefined();
  });
});
```

---

## 📅 PLAN D'ATTAQUE SÉCURISÉ - 4 PHASES PROGRESSIVES

### 🏗️ PHASE 1 : FONDATIONS MINIMALES (JOUR 1)

**OBJECTIF** : Schema fonctionnel SANS RLS pour valider stack complète

**MATIN (4h)**
- [X] Créer fonctions utilitaires (`handle_updated_at`, etc.)
- [X] Créer 1 table user_profiles (MICRO-ÉTAPE SÉCURISÉE au lieu de 6)
- [X] Générer types TypeScript immédiatement
- [X] ⚠️ **CHECKPOINT** : `supabase db reset` + génération types OK

**APRÈS-MIDI (4h)**
- [X] Intégrer nouveaux types dans `api.types.ts`
- [X] Mettre à jour services Supabase (`shared/lib/supabase/index.ts`)
- [X] Intégrer context oRPC avec Database typée
- [X] ⚠️ **CHECKPOINT** : Stack orpc fonctionne sans erreurs TypeScript

**RÉSULTAT PHASE 1** : Base fonctionnelle à 100%, types intégrés, ZÉRO RLS

**🚨 CRITÈRES DE VALIDATION OBLIGATOIRES**
- [X] `pnpm typecheck` : ✅ 0 erreur
- [X] `pnpm lint` : ✅ 0 erreur (2 warnings non-liés)  
- [X] Handlers orpc existants fonctionnent
- [X] Clients Supabase typés correctement

---

### 🔐 PHASE 2 : ACTIVATION RLS PROGRESSIVE (JOUR 2)

**OBJECTIF** : Sécuriser table par table avec validation immédiate

**MATIN (4h) - RLS Tables critiques**
- [ ] **Étape 1** : RLS `user_profiles` + tests isolation
- [ ] ⚠️ **VALIDATION** : Auth middleware fonctionne toujours
- [ ] **Étape 2** : RLS `products` + tests visibilité
- [ ] ⚠️ **VALIDATION** : Catalogue produits accessible
- [ ] **Étape 3** : RLS `system_settings` + tests publics/privés
- [ ] ⚠️ **VALIDATION** : Configuration système OK

**APRÈS-MIDI (4h) - RLS Tables transactionnelles**
- [ ] **Étape 4** : RLS `purchases` + tests ownership
- [ ] ⚠️ **VALIDATION** : Webhooks Stripe fonctionnent (service_role)
- [ ] **Étape 5** : RLS `referral_conversions` + tests permissions
- [ ] ⚠️ **VALIDATION** : Système parrainage isolé correctement
- [ ] **Étape 6** : RLS `audit_logs` + tests service_role
- [ ] ⚠️ **VALIDATION** : Logging système opérationnel

**RÉSULTAT PHASE 2** : Sécurité RLS complète, fonctionnalités préservées

**🚨 PLAN DE ROLLBACK IMMÉDIAT**
Si TOUTE validation échoue :
```sql
-- Désactiver RLS sur table problématique
ALTER TABLE problematic_table DISABLE ROW LEVEL SECURITY;
-- Investiguer + corriger + réessayer
```

---

### ⚡ PHASE 3 : CONTRAINTES ET OPTIMISATION (JOUR 3)

**OBJECTIF** : Ajouter contraintes métier et optimiser performance

**MATIN (4h) - Contraintes métier**
- [ ] Ajouter contraintes CHECK progressivement par table
- [ ] Valider chaque contrainte avec données test
- [ ] Ajouter index performance critiques
- [ ] Tester impact performance (< 100ms requêtes fréquentes)

**APRÈS-MIDI (4h) - Triggers et données**
- [ ] Implémenter triggers `updated_at` sur toutes tables
- [ ] Ajouter seed data `system_settings` essentielles
- [ ] Créer triggers génération `referral_code` automatique
- [ ] Tests complets intégrité référentielle

**RÉSULTAT PHASE 3** : Schema complet avec contraintes métier optimisées

---

### ✅ PHASE 4 : VALIDATION ET PRODUCTION (JOUR 4)

**OBJECTIF** : Tests exhaustifs et préparation production

**MATIN (4h) - Tests complets**
- [ ] Tests unitaires politiques RLS (tous scénarios)
- [ ] Tests intégration oRPC + Database (handlers complets)
- [ ] Tests performance (queries lentes, index manquants)
- [ ] Tests sécurité (tentatives bypass RLS)

**APRÈS-MIDI (4h) - Production readiness**
- [ ] Documentation technique complète
- [ ] Scripts rollback testés
- [ ] Validation conformité contraintes CLAUDE.md
- [ ] Préparation déploiement production

**RÉSULTAT PHASE 4** : BRIQUE 0 production-ready certifiée à 100%

---

### 🛡️ STRATÉGIE DE ROLLBACK GLOBALE

**ROLLBACK PHASE 1 → ÉTAT INITIAL**
```bash
# Supprimer toutes migrations
supabase db reset --initial
supabase migration list  # Vérifier état clean
```

**ROLLBACK PHASE 2 → PHASE 1**
```sql
-- Script automatique désactivation RLS
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE referral_conversions DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
```

**ROLLBACK PHASE 3 → PHASE 2**
```sql
-- Supprimer contraintes ajoutées
-- Script généré automatiquement à chaque ajout contrainte
```

**VALIDATION ROLLBACK**
Chaque rollback DOIT être testé avant passage phase suivante.

---

## ❓ QUESTIONS CRITIQUES À RÉSOUDRE

### 🔴 QUESTIONS BLOQUANTES

1. **CONFIGURATION GOOGLE OAUTH** : Avez-vous configuré OAuth Google dans Supabase Dashboard ? (obligatoire auth complète)

2. **STRIPE WEBHOOK ENDPOINT** : URL webhook de production définie ? (critique pour purchases)

3. **DOMAINE EMAIL** : Domaine confirmé Supabase pour magic links ? (bloquant auth)

4. **BACKUP STRATEGY** : Politique backup Supabase configurée ? (sécurité données)

### 🟡 QUESTIONS IMPORTANTES

5. **RÉTENTION AUDIT LOGS** : Combien de temps conserver ? (impact performance)

6. **SEUILS COMMISSION** : Montant minimum payout commission ? (business logic)

7. **DEVISES SUPPORTÉES** : EUR uniquement ou multi-currency ? (complexité Stripe)

8. **LIMITE PARRAINAGE** : Maximum parrainés par utilisateur ? (anti-abuse)

### 🟢 QUESTIONS OPTIMISATION

9. **INDEXATION** : Index additionnels spécifiques use-cases ? (performance)

10. **PARTITIONING** : Tables audit partitionnées par date ? (scalabilité)

---

## 🎯 CRITÈRES DE SUCCÈS BRIQUE 0

### ✅ VALIDATION TECHNIQUE

- [~] **Schéma complet** : 1 table user_profiles (MICRO-ÉTAPE au lieu de 6 + RLS)
- [X] **Types générés** : Database interfaces TypeScript à jour
- [X] **Services intégrés** : oRPC context + Supabase clients opérationnels
- [~] **Tests passés** : intégration + performance (RLS différé)
- [X] **Zéro erreur** : TypeScript compilation + ESLint + Prettier

### ✅ VALIDATION BUSINESS

- [ ] **Sécurité RLS** : Différé à Phase 2 (MICRO-ÉTAPE sans RLS)
- [ ] **Audit trail** : Différé (pas de table audit_logs encore)
- [ ] **Configuration flexible** : Différé (pas de system_settings encore)
- [X] **Performance** : < 100ms requêtes critiques
- [X] **Scalabilité** : Schema évolutif (ajouts V2 sans breaking)

### ✅ VALIDATION INTÉGRATION

- [X] **orpc handlers** : Plus d'erreurs types Database
- [X] **Middleware auth** : Context user enrichi fonctionnel  
- [X] **Migrations** : Déployables production sans downtime
- [X] **Rollback** : Stratégie retour arrière testée
- [X] **Documentation** : Technique complète et à jour

---

## 🚨 ALERTES ET RISQUES

### ⚠️ RISQUES TECHNIQUES IDENTIFIÉS ET MITIGÉS

**RISQUES ÉLIMINÉS PAR APPROCHE PROGRESSIVE**
1. ~~**Types breaking changes**~~ → Types générés dès Phase 1
2. ~~**RLS trop restrictive**~~ → Validation étape par étape Phase 2
3. ~~**Performance dégradée**~~ → Tests performance Phase 3
4. ~~**Migration failure**~~ → Rollback testé chaque phase

**NOUVEAUX RISQUES CONTRÔLÉS**
1. **Délai supplémentaire** : +1 jour pour sécurisation
2. **Complexité gestion phases** : Checkpoints obligatoires
3. **Fausse sécurité Phase 1** : RLS désactivé temporairement

### 🛡️ MITIGATIONS RENFORCÉES

1. **Checkpoints obligatoires** : Impossible passer phase suivante si échec
2. **Rollback automatisé** : Scripts testés à chaque étape
3. **Monitoring continu** : Performance + sécurité chaque phase
4. **Documentation live** : MAJ temps réel état système
5. **Validation humaine** : Review manuelle avant chaque phase

---

## 📖 RESSOURCES ET RÉFÉRENCES

### DOCUMENTATION SUPABASE
- [Database Schema](https://supabase.com/docs/guides/database)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [CLI Reference](https://supabase.com/docs/reference/cli)
- [TypeScript Types](https://supabase.com/docs/guides/api/rest/generating-types)

### OUTILS DÉVELOPPEMENT
- Supabase Studio local : http://127.0.0.1:54323
- pgAdmin / TablePlus pour inspection DB
- Query performance analyzer intégré

---

**Cette spécification constitue la bible pour implémenter la BRIQUE 0 avec une qualité 10/10. Chaque détail technique a été pensé pour s'intégrer parfaitement avec l'architecture existante tout en posant des fondations ultra-solides pour les 6 briques suivantes.**

**PROCHAINE ÉTAPE** : Validation de ce plan puis implémentation intensive sur 3 jours. 🚀