import { supabase } from '../lib/supabase';

// Niveaux de fidélité
export const LOYALTY_LEVELS = {
    bronze: {
        name: 'Bronze',
        minPoints: 0,
        emoji: '🥉',
        color: '#CD7F32',
        benefits: ['1 point par 1000 FCFA dépensés'],
    },
    silver: {
        name: 'Argent',
        minPoints: 500,
        emoji: '🥈',
        color: '#C0C0C0',
        benefits: ['1.5 points par 1000 FCFA', 'Livraison gratuite 1x/mois'],
    },
    gold: {
        name: 'Or',
        minPoints: 1500,
        emoji: '🥇',
        color: '#FFD700',
        benefits: ['2 points par 1000 FCFA', 'Livraison gratuite illimitée', 'Accès prioritaire'],
    },
    platinum: {
        name: 'Platine',
        minPoints: 5000,
        emoji: '💎',
        color: '#E5E4E2',
        benefits: ['3 points par 1000 FCFA', 'Avantages Or +', 'Cadeaux exclusifs', 'Support VIP'],
    },
};

export type LoyaltyLevel = keyof typeof LOYALTY_LEVELS;

interface LoyaltyPoints {
    id: string;
    user_id: string;
    points: number;
    total_earned: number;
    level: LoyaltyLevel;
    created_at: string;
    updated_at: string;
}

interface LoyaltyTransaction {
    id: string;
    user_id: string;
    order_id: string | null;
    points: number;
    type: 'earned' | 'redeemed';
    description: string;
    created_at: string;
}

interface LoyaltyReward {
    id: string;
    name: string;
    description: string;
    points_required: number;
    reward_type: 'discount' | 'free_item' | 'free_delivery';
    reward_value: number;
    icon: string;
    is_active: boolean;
}

class LoyaltyService {
    /**
     * Calculer le nombre de points gagnés selon le montant et le niveau
     */
    calculatePoints(amount: number, level: LoyaltyLevel): number {
        const basePoints = Math.floor(amount / 1000); // 1 point par 1000 FCFA

        const multipliers: Record<LoyaltyLevel, number> = {
            bronze: 1,
            silver: 1.5,
            gold: 2,
            platinum: 3,
        };

        return Math.floor(basePoints * multipliers[level]);
    }

    /**
     * Déterminer le niveau selon le total de points gagnés
     */
    determineLevel(totalEarned: number): LoyaltyLevel {
        if (totalEarned >= LOYALTY_LEVELS.platinum.minPoints) return 'platinum';
        if (totalEarned >= LOYALTY_LEVELS.gold.minPoints) return 'gold';
        if (totalEarned >= LOYALTY_LEVELS.silver.minPoints) return 'silver';
        return 'bronze';
    }

    /**
     * Initialiser le compte de fidélité pour un nouvel utilisateur
     */
    async initializeLoyaltyAccount(userId: string): Promise<{ success: boolean; error: any }> {
        try {
            const { error } = await supabase
                .from('loyalty_points')
                .insert({
                    user_id: userId,
                    points: 0,
                    total_earned: 0,
                    level: 'bronze',
                });

            if (error) throw error;
            return { success: true, error: null };
        } catch (error) {
            console.error('Erreur initialisation fidélité:', error);
            return { success: false, error };
        }
    }

    /**
     * Récupérer les informations de fidélité d'un utilisateur
     */
    async getLoyaltyPoints(userId: string): Promise<{
        data: LoyaltyPoints | null;
        error: any
    }> {
        try {
            const { data, error } = await supabase
                .from('loyalty_points')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error && error.code === 'PGRST116') {
                // Pas de compte de fidélité, on le crée
                await this.initializeLoyaltyAccount(userId);
                return this.getLoyaltyPoints(userId);
            }

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Erreur récupération points:', error);
            return { data: null, error };
        }
    }

    /**
     * Ajouter des points après une commande
     */
    async addPointsFromOrder(
        userId: string,
        orderId: string,
        orderAmount: number
    ): Promise<{ success: boolean; pointsEarned: number; newLevel?: LoyaltyLevel; error: any }> {
        try {
            // Récupérer les infos de fidélité actuelles
            const { data: loyaltyData, error: fetchError } = await this.getLoyaltyPoints(userId);
            if (fetchError || !loyaltyData) throw fetchError;

            // Calculer les points gagnés
            const pointsEarned = this.calculatePoints(orderAmount, loyaltyData.level);
            const newTotalEarned = loyaltyData.total_earned + pointsEarned;
            const newPoints = loyaltyData.points + pointsEarned;
            const newLevel = this.determineLevel(newTotalEarned);

            // Mettre à jour les points
            const { error: updateError } = await supabase
                .from('loyalty_points')
                .update({
                    points: newPoints,
                    total_earned: newTotalEarned,
                    level: newLevel,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', userId);

            if (updateError) throw updateError;

            // Enregistrer la transaction
            await supabase
                .from('loyalty_transactions')
                .insert({
                    user_id: userId,
                    order_id: orderId,
                    points: pointsEarned,
                    type: 'earned',
                    description: `Points gagnés sur la commande #${orderId.slice(0, 8)}`,
                });

            const leveledUp = newLevel !== loyaltyData.level;

            return {
                success: true,
                pointsEarned,
                newLevel: leveledUp ? newLevel : undefined,
                error: null,
            };
        } catch (error) {
            console.error('Erreur ajout points:', error);
            return { success: false, pointsEarned: 0, error };
        }
    }

    /**
     * Utiliser des points pour une récompense
     */
    async redeemPoints(
        userId: string,
        rewardId: string,
        pointsCost: number
    ): Promise<{ success: boolean; error: any }> {
        try {
            // Vérifier les points disponibles
            const { data: loyaltyData, error: fetchError } = await this.getLoyaltyPoints(userId);
            if (fetchError || !loyaltyData) throw fetchError;

            if (loyaltyData.points < pointsCost) {
                throw new Error('Points insuffisants');
            }

            // Déduire les points
            const { error: updateError } = await supabase
                .from('loyalty_points')
                .update({
                    points: loyaltyData.points - pointsCost,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', userId);

            if (updateError) throw updateError;

            // Enregistrer la transaction
            await supabase
                .from('loyalty_transactions')
                .insert({
                    user_id: userId,
                    points: -pointsCost,
                    type: 'redeemed',
                    description: `Récompense échangée`,
                });

            // Enregistrer la récompense utilisée
            await supabase
                .from('redeemed_rewards')
                .insert({
                    user_id: userId,
                    reward_id: rewardId,
                });

            return { success: true, error: null };
        } catch (error) {
            console.error('Erreur utilisation points:', error);
            return { success: false, error };
        }
    }

    /**
     * Récupérer l'historique des transactions
     */
    async getTransactionHistory(userId: string): Promise<{
        data: LoyaltyTransaction[];
        error: any;
    }> {
        try {
            const { data, error } = await supabase
                .from('loyalty_transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            return { data: data || [], error: null };
        } catch (error) {
            console.error('Erreur historique transactions:', error);
            return { data: [], error };
        }
    }

    /**
     * Récupérer toutes les récompenses disponibles
     */
    async getAvailableRewards(): Promise<{
        data: LoyaltyReward[];
        error: any;
    }> {
        try {
            const { data, error } = await supabase
                .from('loyalty_rewards')
                .select('*')
                .eq('is_active', true)
                .order('points_required');

            if (error) throw error;
            return { data: data || [], error: null };
        } catch (error) {
            console.error('Erreur récupération récompenses:', error);
            return { data: [], error };
        }
    }

    /**
     * Calculer les points jusqu'au prochain niveau
     */
    getPointsToNextLevel(totalEarned: number): {
        nextLevel: LoyaltyLevel | null;
        pointsNeeded: number;
    } {
        const levels = Object.entries(LOYALTY_LEVELS)
            .sort((a, b) => a[1].minPoints - b[1].minPoints);

        for (const [level, data] of levels) {
            if (totalEarned < data.minPoints) {
                return {
                    nextLevel: level as LoyaltyLevel,
                    pointsNeeded: data.minPoints - totalEarned,
                };
            }
        }

        return { nextLevel: null, pointsNeeded: 0 };
    }
}

export const loyaltyService = new LoyaltyService();
export default loyaltyService;