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

| Service | URL | Description |
|---------|-----|-------------|
| **API REST** | http://127.0.0.1:54321 | Endpoint principal API |
| **GraphQL** | http://127.0.0.1:54321/graphql/v1 | Interface GraphQL |
| **Studio** | http://127.0.0.1:54323 | Interface d'administration |
| **Inbucket** | http://127.0.0.1:54324 | Tests d'emails |
| **Storage** | http://127.0.0.1:54321/storage/v1 | API de stockage |

## Authentification Locale

### Clés d'API

```bash
# Clé publique (côté client)
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Clé service (côté serveur - permissions élevées)
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

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
curl -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" http://127.0.0.1:54321/rest/v1/

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
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

### Configuration Supabase Client

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

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