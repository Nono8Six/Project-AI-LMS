/**
 * Services Supabase avec types Database generés automatiquement
 * Client public pour côté client + serveur
 * Client admin pour service role (côté serveur uniquement)
 */
import { createClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/shared/types/database.generated';
import type { 
  PurchaseWithRelations, 
  ReferralConversionWithRelations, 
  SupabaseServiceResult 
} from '@/shared/types/api.types';

// Configuration depuis variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Validation configuration
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('SUPABASE_CONFIG_MISSING: URL ou ANON_KEY manquant');
}

// Client public (côté client + serveur avec auth utilisateur)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Client admin (côté serveur uniquement avec service role)
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Types exports pour utilisation externe
export type SupabaseClient = typeof supabase;
export type SupabaseAdminClient = typeof supabaseAdmin;

// Helpers utilitaires
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const isSupabaseAdminConfigured = Boolean(supabaseServiceKey);

// =============================================================================
// SERVICES PAR DOMAINE
// =============================================================================

/**
 * Service pour gestion des profils utilisateurs
 * CRUD basique pour table user_profiles
 */
export const profileService = {
  /**
   * Récupérer un profil utilisateur par ID
   * @param userId - ID utilisateur (UUID)
   * @returns Profil utilisateur ou null si non trouvé
   */
  async getProfile(userId: string) {
    return supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
  },

  /**
   * Créer un nouveau profil utilisateur
   * @param profile - Données du profil à créer
   * @returns Profil créé ou erreur
   */
  async createProfile(profile: Database['public']['Tables']['user_profiles']['Insert']) {
    return supabase
      .from('user_profiles')
      .insert(profile)
      .select()
      .single();
  },

  /**
   * Mettre à jour un profil utilisateur
   * @param userId - ID utilisateur
   * @param updates - Champs à mettre à jour
   * @returns Profil mis à jour ou erreur
   */
  async updateProfile(userId: string, updates: Database['public']['Tables']['user_profiles']['Update']) {
    return supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
  },

  /**
   * Supprimer un profil utilisateur
   * @param userId - ID utilisateur
   * @returns Confirmation suppression ou erreur
   */
  async deleteProfile(userId: string) {
    return supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId);
  }
};

/**
 * Service pour gestion du catalogue produits
 * CRUD pour table products avec synchronisation Stripe
 */
export const productService = {
  /**
   * Lister tous les produits actifs
   * @param limit - Nombre de produits à retourner
   * @returns Liste des produits actifs
   */
  async listActiveProducts(limit = 50) {
    return supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);
  },

  /**
   * Récupérer un produit par ID
   * @param productId - ID produit Stripe
   * @returns Produit ou null si non trouvé
   */
  async getProduct(productId: string) {
    return supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
  },

  /**
   * Créer un nouveau produit (admin uniquement)
   * @param product - Données du produit à créer
   * @returns Produit créé ou erreur
   */
  async createProduct(product: Database['public']['Tables']['products']['Insert']) {
    return supabaseAdmin
      .from('products')
      .insert(product)
      .select()
      .single();
  },

  /**
   * Mettre à jour un produit (admin uniquement)
   * @param productId - ID produit
   * @param updates - Champs à mettre à jour
   * @returns Produit mis à jour ou erreur
   */
  async updateProduct(productId: string, updates: Database['public']['Tables']['products']['Update']) {
    return supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single();
  }
};

/**
 * Service pour gestion des achats
 * Tracking complet avec Stripe et parrainage
 */
export const purchaseService = {
  /**
   * Lister les achats d'un utilisateur avec relations
   * @param userId - ID utilisateur
   * @returns Liste des achats avec produit et parrain
   */
  async getUserPurchases(userId: string): SupabaseServiceResult<PurchaseWithRelations[]> {
    return supabase
      .from('purchases')
      .select(`
        id,
        amount_paid,
        currency,
        status,
        completed_at,
        refunded_at,
        created_at,
        commission_rate,
        commission_amount,
        stripe_session_id,
        products!inner (
          id,
          name,
          description,
          price_amount,
          price_currency,
          category
        ),
        referrer:user_profiles!referrer_id (
          id,
          full_name
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  },

  /**
   * Récupérer un achat par session Stripe
   * @param sessionId - Session ID Stripe
   * @returns Achat ou null si non trouvé
   */
  async getPurchaseBySession(sessionId: string) {
    return supabase
      .from('purchases')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .single();
  },

  /**
   * Créer un nouvel achat (webhooks Stripe)
   * @param purchase - Données de l'achat
   * @returns Achat créé ou erreur
   */
  async createPurchase(purchase: Database['public']['Tables']['purchases']['Insert']) {
    return supabaseAdmin
      .from('purchases')
      .insert(purchase)
      .select()
      .single();
  },

  /**
   * Mettre à jour le statut d'un achat (webhooks Stripe)
   * @param sessionId - Session ID Stripe
   * @param updates - Statut et métadonnées
   * @returns Achat mis à jour ou erreur
   */
  async updatePurchaseStatus(sessionId: string, updates: Database['public']['Tables']['purchases']['Update']) {
    return supabaseAdmin
      .from('purchases')
      .update(updates)
      .eq('stripe_session_id', sessionId)
      .select()
      .single();
  }
};

/**
 * Service pour gestion du parrainage
 * Tracking des conversions et commissions
 */
export const referralService = {
  /**
   * Lister les conversions d'un parrain avec détails
   * @param referrerId - ID du parrain  
   * @returns Liste des conversions avec utilisateur parrainé et achat
   */
  async getReferrerConversions(referrerId: string): SupabaseServiceResult<ReferralConversionWithRelations[]> {
    return supabase
      .from('referral_conversions')
      .select(`
        id,
        conversion_type,
        commission_rate,
        commission_amount,
        commission_status,
        purchase_amount,
        paid_at,
        approved_at,
        created_at,
        referred_user:user_profiles!referred_user_id (
          id,
          full_name
        ),
        purchase:purchases!purchase_id (
          id,
          amount_paid,
          completed_at,
          stripe_session_id
        )
      `)
      .eq('referrer_id', referrerId)
      .order('created_at', { ascending: false });
  },

  /**
   * Créer une nouvelle conversion (système)
   * @param conversion - Données de la conversion
   * @returns Conversion créée ou erreur
   */
  async createConversion(conversion: Database['public']['Tables']['referral_conversions']['Insert']) {
    return supabaseAdmin
      .from('referral_conversions')
      .insert(conversion)
      .select()
      .single();
  },

  /**
   * Approuver une commission (admin)
   * @param conversionId - ID de la conversion
   * @param approvedBy - ID de l'admin
   * @returns Conversion approuvée ou erreur
   */
  async approveCommission(conversionId: string, approvedBy: string) {
    return supabaseAdmin
      .from('referral_conversions')
      .update({
        commission_status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString()
      })
      .eq('id', conversionId)
      .select()
      .single();
  }
};

/**
 * Service pour configuration système
 * Paramètres dynamiques sans redéploiement
 */
export const systemService = {
  /**
   * Récupérer une configuration par clé
   * @param key - Clé de configuration
   * @returns Configuration ou null
   */
  async getSetting(key: string) {
    return supabase
      .from('system_settings')
      .select('*')
      .eq('key', key)
      .single();
  },

  /**
   * Lister les configurations publiques (côté client)
   * @returns Configurations exposées publiquement
   */
  async getPublicSettings() {
    return supabase
      .from('system_settings')
      .select('key, value, description')
      .eq('is_public', true);
  },

  /**
   * Mettre à jour une configuration (admin uniquement)
   * @param key - Clé de configuration
   * @param value - Nouvelle valeur
   * @param description - Description optionnelle
   * @returns Configuration mise à jour
   */
  async updateSetting(key: string, value: Json, description?: string | null) {
    return supabaseAdmin
      .from('system_settings')
      .upsert({
        key,
        value,
        description: description ?? null,
        value_type: typeof value === 'object' ? 'object' : typeof value
      })
      .select()
      .single();
  }
};

/**
 * Service pour audit et logging
 * Trail d'audit immutable
 */
export const auditService = {
  /**
   * Créer un log d'audit (système)
   * @param log - Données du log
   * @returns Log créé ou erreur
   */
  async createLog(log: Database['public']['Tables']['audit_logs']['Insert']) {
    return supabaseAdmin
      .from('audit_logs')
      .insert(log)
      .select()
      .single();
  },

  /**
   * Lister les logs d'un utilisateur
   * @param userId - ID utilisateur
   * @param limit - Nombre de logs
   * @returns Logs de l'utilisateur
   */
  async getUserLogs(userId: string, limit = 100) {
    return supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
  }
};

// =============================================================================
// SERVICES ADMIN (Service Role)
// =============================================================================

/**
 * Services admin avec accès privilégié via service role
 * À utiliser uniquement côté serveur
 */
export const adminService = {
  /**
   * Lister tous les profils utilisateurs (admin only)
   * @param limit - Nombre de profils à retourner
   * @returns Liste des profils
   */
  async listAllProfiles(limit = 50) {
    return supabaseAdmin
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
  },

  /**
   * Compter le nombre total d'utilisateurs
   * @returns Nombre total d'utilisateurs
   */
  async countUsers() {
    return supabaseAdmin
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });
  },

  /**
   * Statistiques globales des achats
   * @returns Métriques business complètes
   */
  async getPurchaseStats() {
    return supabaseAdmin
      .from('purchases')
      .select(`
        status,
        amount_paid,
        commission_amount,
        completed_at,
        created_at
      `)
      .eq('status', 'completed');
  },

  /**
   * Lister toutes les conversions parrainage en attente
   * @returns Conversions à approuver
   */
  async getPendingCommissions() {
    return supabaseAdmin
      .from('referral_conversions')
      .select(`
        *,
        referrer:referrer_id (full_name),
        referred_user:referred_user_id (full_name),
        purchase:purchase_id (amount_paid, stripe_session_id)
      `)
      .eq('commission_status', 'pending')
      .order('created_at', { ascending: false });
  },

  /**
   * Logs d'audit récents pour monitoring
   * @param limit - Nombre de logs
   * @returns Logs système récents
   */
  async getRecentAuditLogs(limit = 100) {
    return supabaseAdmin
      .from('audit_logs')
      .select(`
        *,
        user:user_id (full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
  }
};