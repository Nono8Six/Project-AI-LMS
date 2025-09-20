# Supabase - Guide de Développement Local

## Vue d'ensemble

Ce document fournit toutes les informations nécessaires pour travailler avec Supabase en développement local sur le projet LMS IA. L'environnement local utilise Docker pour héberger tous les services Supabase nécessaires.

## Prérequis

- **Docker Desktop** installé et fonctionnel
- **Supabase CLI** version 2.39.2 ou supérieure
- **Scoop** (gestionnaire de paquets Windows)

## Installation

### 1. Vérification des prérequis

```bash
# Vérifier Docker
docker --version

# Vérifier Scoop
scoop --version
```

### 2. Installation de la CLI Supabase

```bash
# Ajouter le bucket Supabase à Scoop (si pas déjà fait)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git

# Installer Supabase CLI
scoop install supabase

# Vérifier l'installation
supabase --version
```

### 3. Mise à jour

```bash
# Mettre à jour vers la dernière version
scoop update supabase
```

## Configuration du Projet

## Hygiène des secrets

1. Rotatez toutes les clés Supabase depuis https://app.supabase.com > Project Settings > API (`Reset` pour anon et service role, régénérez le JWT).
2. Supprimez les anciens tokens via `supabase secrets unset` si nécessaire puis mettez à jour vos services qui les consomment.
3. Générez un nouveau `SUPABASE_ACCESS_TOKEN` (Account Settings > Access Tokens) et stockez-le dans votre gestionnaire de secrets.
4. Pour Stripe, utilisez `stripe login` puis `stripe listen --print-secret` pour récupérer un webhook secret local et recréez les clés test depuis le dashboard.
5. Conservez tous les secrets dans un gestionnaire (1Password, Vault, Bitwarden) et injectez-les dans `.env` à l'exécution uniquement.
6. Après toute rotation, exécutez `git grep "__SET_SUPABASE"` et `git grep "__SET_STRIPE"` pour vérifier que seuls des placeholders subsistent dans le dépôt.

> Astuce : gardez un fichier chiffré `.env.encrypted` hors Git si vous avez besoin d'une sauvegarde locale.


### Initialisation

Le projet est déjà initialisé avec la configuration dans `supabase/config.toml`. Cette configuration définit :

- **Ports locaux** : API (54321), DB (54322), Studio (54323), etc.
- **Authentification** : Magic Links, OAuth Google
- **Stockage** : Limite de 50MB par fichier
- **Email** : Serveur de test Inbucket
- **Base de données** : PostgreSQL 17

### Structure des fichiers

```
supabase/
├── config.toml          # Configuration principale
├── seed.sql            # Données de test (à créer)
├── migrations/         # Migrations de base de données
├── functions/          # Edge Functions
└── tests/             # Tests SQL
```

## Commandes Principales

### Gestion des Services

```bash
# Démarrer l'environnement local complet
supabase start

# Arrêter tous les services
supabase stop

# Redémarrer les services
supabase restart

# Vérifier l'état des services
supabase status
```

### Gestion de la Base de Données

```bash
# Reset complet de la base (efface toutes les données)
supabase db reset

# Appliquer les migrations en attente
supabase db push

# Récupérer le schéma depuis l'environnement distant
supabase db pull

# Créer une nouvelle migration
supabase migration new nom_de_la_migration

# Générer les types TypeScript depuis le schéma
supabase gen types typescript --local > src/types/supabase.ts
```

### Edge Functions

```bash
# Créer une nouvelle fonction
supabase functions new nom_fonction

# Servir les fonctions localement
supabase functions serve

# Déployer une fonction
supabase functions deploy nom_fonction

# Invoquer une fonction pour test
supabase functions invoke nom_fonction --data '{"key":"value"}'
```

### Seed Data

```bash
# Charger les données de test
supabase db reset --seed

# Exécuter seulement les seeds (sans reset)
supabase seed run
```

## URLs et Accès Local

Quand les services sont démarrés :

| Service      | URL                               | Description                |
| ------------ | --------------------------------- | -------------------------- |
| **API REST** | http://127.0.0.1:54321            | Endpoint principal API     |
| **GraphQL**  | http://127.0.0.1:54321/graphql/v1 | Interface GraphQL          |
| **Studio**   | http://127.0.0.1:54323            | Interface d'administration |
| **Inbucket** | http://127.0.0.1:54324            | Tests d'emails             |
| **Storage**  | http://127.0.0.1:54321/storage/v1 | API de stockage            |

## Authentification Locale

### Clés d'API

```bash
# Clé publique (côté client)
anon key: __SET_SUPABASE_ANON_KEY__

# Clé service (côté serveur - permissions élevées)
service_role key: __SET_SUPABASE_SERVICE_ROLE_KEY__

# JWT Secret
super-secret-jwt-token-with-at-least-32-characters-long
```

### Configuration OAuth

Pour tester Google OAuth localement, configurez dans Supabase Studio :

1. Aller dans Authentication > Settings > Auth Providers
2. Activer Google
3. Configurer les Client ID et Secret

## Tests et Validation

### Sanité des Services

```bash
# Tester l'API REST
curl -H "apikey: $SUPABASE_ANON_KEY" http://127.0.0.1:54321/rest/v1/

# Tester la connexion DB
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
```

### Studio Web

Ouvrir http://127.0.0.1:54323 pour :

- Gérer les tables et données
- Configurer l'authentification
- Monitorer les requêtes
- Tester les APIs

## Flux de Développement

### 1. Démarrage quotidien

```bash
# Démarrer les services
supabase start

# Vérifier que tout fonctionne
supabase status
```

### 2. Modifications de schéma

```bash
# Créer une migration pour vos changements
supabase migration new add_users_table

# Éditer le fichier de migration dans supabase/migrations/
# Appliquer les changements
supabase db reset

# Générer les nouveaux types
supabase gen types typescript --local > src/types/supabase.ts
```

### 3. Tests avec données

```bash
# Créer/modifier supabase/seed.sql avec vos données de test
# Recharger avec les données
supabase db reset --seed
```

### 4. Fin de journée

```bash
# Arrêter les services (optionnel, les données sont persistées)
supabase stop
```

## Gestion des Données

### Persistence

Les données sont automatiquement sauvegardées dans des volumes Docker. Pour voir :

```bash
# Lister les volumes du projet
docker volume ls --filter label=com.supabase.cli.project=Project-AI-LMS
```

### Backup/Restore

```bash
# Sauvegarder le schéma et les données
pg_dump "postgresql://postgres:postgres@127.0.0.1:54322/postgres" > backup.sql

# Restaurer depuis un backup
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" < backup.sql
```

## Dépannage

### Services qui ne démarrent pas

```bash
# Arrêter complètement
supabase stop

# Nettoyer les conteneurs
docker system prune

# Redémarrer
supabase start
```

### Ports occupés

Si les ports par défaut sont occupés, modifiez `supabase/config.toml` :

```toml
[api]
port = 55321  # Au lieu de 54321

[db]
port = 55322  # Au lieu de 54322
```

### Problèmes de permissions

```bash
# Réinitialiser les permissions Docker
docker system reset

# Ou redémarrer Docker Desktop complètement
```

### Logs des services

```bash
# Voir les logs en temps réel
supabase logs

# Logs d'un service spécifique
docker logs supabase_db_Project-AI-LMS
```

## Intégration avec Next.js

### Variables d'environnement

Vos fichiers `.env` et `.env.example` doivent contenir :

```env
# Supabase Local Development
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=__SET_SUPABASE_ANON_KEY__
SUPABASE_SERVICE_ROLE_KEY=__SET_SUPABASE_SERVICE_ROLE_KEY__
SUPABASE_JWT_SECRET=__SET_SUPABASE_JWT_SECRET__
SUPABASE_ACCESS_TOKEN=__SET_SUPABASE_ACCESS_TOKEN__
```

### Pattern d''injection Supabase

Nous n''exposons plus de clients Supabase globaux. Chaque couche crée le ou les clients nécessaires via les factories de `app/src/shared/lib/supabase`.

```typescript
// app/src/orpc/server/context.ts
import { createSupabaseClients, getSupabaseEnvConfig } from '@/shared/lib/supabase';

const clients = createSupabaseClients(getSupabaseEnvConfig());

export function buildContext(...) {
  return {
    supabase: {
      getUserClient: () => clients.public,
      getAdminClient: () => clients.admin,
    },
    // ...autres propriétés du contexte
  };
}
```

- **Côté tests** : utilisez `createSupabaseClient` / `createSupabaseAdminClient` avec les mêmes variables d''environnement (voir `tests/integration/profile.rls.test.ts`).
- **Côté services** : importez les factories (`createProfileService`, `createProductService`, etc.) et injectez le client approprié dans les modules qui en ont besoin. Aucune dépendance globale n''est conservée.

## Bonnes Pratiques

### Sécurité

- ⚠️ **Jamais** committer les vraies clés de production
- Utiliser `service_role_key` uniquement côté serveur
- Activer RLS sur toutes les tables sensibles

### Performance

- Utiliser la génération de types pour l'autocomplétion
- Créer des index sur les colonnes fréquemment requêtées
- Monitorer les requêtes lentes dans Studio

### Développement

- Committer les migrations dans Git
- Tester les migrations sur données de seed
- Utiliser des transactions pour les opérations complexes

## Support et Resources

- [Documentation officielle Supabase](https://supabase.com/docs)
- [CLI Reference](https://supabase.com/docs/reference/cli)
- [Local Development Guide](https://supabase.com/docs/guides/local-development)

---

**Note** : Ce guide couvre l'environnement de développement local. Pour la production, référez-vous à la documentation de déploiement.
## Tests automatisés

- Démarrer Supabase (`supabase start`) avant `pnpm test`
- Utiliser `.env.test` (ou `.env.test.example`) pour injecter les clés de test
- Les tests orpc (`tests/route.*.ts`) valident les endpoints health/auth/rate-limit et demandent Supabase actif
- Après une campagne de tests, exécuter `pnpm cleanup:rate-limit` pour purger `auth_rate_limit_counters`
