/**
 * Configuration globale des tests - Vitest Setup
 * Charge l'environnement de test et configure les mocks nécessaires
 */

import { beforeAll } from 'vitest';
import { loadEnvConfig } from '@next/env';
import path from 'node:path';

// Charger les variables d'environnement depuis .env.test
beforeAll(async () => {
  const projectDir = path.resolve(__dirname, '..');
  loadEnvConfig(projectDir, true, { info: () => {}, error: () => {} });

  // S'assurer que NODE_ENV est configuré pour les tests
  process.env.NODE_ENV = 'test';

  // Charger explicitement .env.test si disponible
  try {
    const dotenv = await import('dotenv');
    dotenv.config({
      path: path.resolve(projectDir, '.env.test'),
      override: true,
    });
  } catch (error) {
    // Si dotenv n'est pas disponible, continuer sans erreur
    console.warn('Could not load .env.test file');
  }

  // Variables d'environnement minimales pour les tests
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
  }

  if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:3000/api';
  }

  if (!process.env.LOG_LEVEL) {
    process.env.LOG_LEVEL = 'error';
  }
});