import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import loyaltyService, { LOYALTY_LEVELS, LoyaltyLevel } from '../services/loyaltyService';

interface LoyaltyData {
    points: number;
    total_earned: number;
    level: LoyaltyLevel;
}

interface Reward {
    id: string;
    name: string;
    description: string;
    points_required: number;
    reward_type: string;
    icon: string;
}

export default function LoyaltyScreen() {
    const { user } = useAuth();
    const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadLoyaltyData();
            loadRewards();
        } else {
            setLoading(false);
        }
    }, [user]);

    const loadLoyaltyData = async () => {
        try {
            const { data, error } = await loyaltyService.getLoyaltyPoints(user!.id);
            if (error) throw error;
            setLoyaltyData(data);
        } catch (error) {
            console.error('Erreur chargement fidélité:', error);
            Alert.alert('Erreur', 'Impossible de charger vos informations de fidélité');
        } finally {
            setLoading(false);
        }
    };

    const loadRewards = async () => {
        try {
            const { data, error } = await loyaltyService.getAvailableRewards();
            if (error) throw error;
            setRewards(data);
        } catch (error) {
            console.error('Erreur chargement récompenses:', error);
        }
    };

    const handleRedeemReward = async (reward: Reward) => {
        if (!loyaltyData || loyaltyData.points < reward.points_required) {
            Alert.alert('Points insuffisants', 'Vous n\'avez pas assez de points pour cette récompense');
            return;
        }

        Alert.alert(
            'Échanger des points',
            `Voulez-vous échanger ${reward.points_required} points contre ${reward.name} ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Échanger',
                    onPress: async () => {
                        const { success, error } = await loyaltyService.redeemPoints(
                            user!.id,
                            reward.id,
                            reward.points_required
                        );

                        if (success) {
                            Alert.alert('Succès !', 'Récompense échangée avec succès');
                            loadLoyaltyData();
                        } else {
                            Alert.alert('Erreur', 'Impossible d\'échanger cette récompense');
                        }
                    },
                },
            ]
        );
    };

    // Vue non connecté
    if (!user) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Programme Fidélité</Text>
                </View>

                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyEmoji}>🌟</Text>
                    <Text style={styles.emptyTitle}>Rejoignez notre programme</Text>
                    <Text style={styles.emptyText}>
                        Gagnez des points à chaque commande et débloquez des récompenses exclusives !
                    </Text>

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={() => router.push('/login')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.loginButtonText}>Se connecter</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Programme Fidélité</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ff6b35" />
                    <Text style={styles.loadingText}>Chargement...</Text>
                </View>
            </View>
        );
    }

    if (!loyaltyData) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Programme Fidélité</Text>
                </View>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Erreur de chargement</Text>
                </View>
            </View>
        );
    }

    const currentLevel = LOYALTY_LEVELS[loyaltyData.level];
    const { nextLevel, pointsNeeded } = loyaltyService.getPointsToNextLevel(
        loyaltyData.total_earned
    );
    const nextLevelData = nextLevel ? LOYALTY_LEVELS[nextLevel] : null;

    // Calcul du pourcentage de progression
    const progressPercentage = nextLevelData
        ? ((loyaltyData.total_earned - currentLevel.minPoints) /
            (nextLevelData.minPoints - currentLevel.minPoints)) *
        100
        : 100;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Programme Fidélité</Text>
                <Text style={styles.headerSubtitle}>Vos avantages exclusifs</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Carte de niveau */}
                <View style={[styles.levelCard, { borderColor: currentLevel.color }]}>
                    <View style={styles.levelHeader}>
                        <Text style={styles.levelEmoji}>{currentLevel.emoji}</Text>
                        <View style={styles.levelInfo}>
                            <Text style={[styles.levelName, { color: currentLevel.color }]}>
                                Niveau {currentLevel.name}
                            </Text>
                            <Text style={styles.pointsLabel}>{loyaltyData.points} points disponibles</Text>
                        </View>
                    </View>

                    {/* Barre de progression */}
                    {nextLevelData && (
                        <View style={styles.progressSection}>
                            <View style={styles.progressBar}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        {
                                            width: `${Math.min(progressPercentage, 100)}%`,
                                            backgroundColor: currentLevel.color,
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={styles.progressText}>
                                Plus que {pointsNeeded} points pour {nextLevelData.emoji} {nextLevelData.name}
                            </Text>
                        </View>
                    )}

                    {/* Avantages du niveau */}
                    <View style={styles.benefitsSection}>
                        <Text style={styles.benefitsTitle}>Vos avantages :</Text>
                        {currentLevel.benefits.map((benefit, index) => (
                            <View key={index} style={styles.benefitItem}>
                                <Text style={styles.benefitBullet}>✓</Text>
                                <Text style={styles.benefitText}>{benefit}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Statistiques */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statIcon}>💰</Text>
                        <Text style={styles.statValue}>{loyaltyData.total_earned}</Text>
                        <Text style={styles.statLabel}>Points gagnés</Text>
                    </View>

                    <View style={styles.statCard}>
                        <Text style={styles.statIcon}>🎁</Text>
                        <Text style={styles.statValue}>{loyaltyData.points}</Text>
                        <Text style={styles.statLabel}>Points dispo</Text>
                    </View>
                </View>

                {/* Récompenses disponibles */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🎁 Récompenses disponibles</Text>
                    {rewards.map((reward) => {
                        const canAfford = loyaltyData.points >= reward.points_required;
                        return (
                            <View key={reward.id} style={styles.rewardCard}>
                                <View style={styles.rewardIcon}>
                                    <Text style={styles.rewardEmoji}>{reward.icon}</Text>
                                </View>
                                <View style={styles.rewardInfo}>
                                    <Text style={styles.rewardName}>{reward.name}</Text>
                                    <Text style={styles.rewardDesc}>{reward.description}</Text>
                                    <Text style={styles.rewardPoints}>
                                        {reward.points_required} points
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={[
                                        styles.redeemButton,
                                        !canAfford && styles.redeemButtonDisabled,
                                    ]}
                                    onPress={() => handleRedeemReward(reward)}
                                    disabled={!canAfford}
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        style={[
                                            styles.redeemButtonText,
                                            !canAfford && styles.redeemButtonTextDisabled,
                                        ]}
                                    >
                                        {canAfford ? 'Échanger' : 'Bloqué'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>

                {/* Comment gagner des points */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>💡 Comment gagner des points ?</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoEmoji}>🛒</Text>
                            <Text style={styles.infoText}>
                                Commandez et gagnez {currentLevel.name === 'Bronze' ? '1' : currentLevel.name === 'Argent' ? '1.5' : currentLevel.name === 'Or' ? '2' : '3'} point(s) par 1000 FCFA dépensés
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoEmoji}>📈</Text>
                            <Text style={styles.infoText}>
                                Montez de niveau pour gagner plus de points
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoEmoji}>🎁</Text>
                            <Text style={styles.infoText}>
                                Échangez vos points contre des récompenses
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    header: {
        backgroundColor: '#2d2d2d',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ff6b35',
        marginBottom: 5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#ccc',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#ccc',
        marginTop: 10,
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyEmoji: {
        fontSize: 80,
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 10,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#ccc',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
    },
    loginButton: {
        backgroundColor: '#ff6b35',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
        elevation: 3,
        shadowColor: '#ff6b35',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    loginButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    levelCard: {
        backgroundColor: '#2d2d2d',
        margin: 20,
        borderRadius: 20,
        padding: 20,
        borderWidth: 3,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    levelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    levelEmoji: {
        fontSize: 50,
        marginRight: 15,
    },
    levelInfo: {
        flex: 1,
    },
    levelName: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    pointsLabel: {
        fontSize: 16,
        color: '#ccc',
    },
    progressSection: {
        marginBottom: 20,
    },
    progressBar: {
        height: 12,
        backgroundColor: '#444',
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        borderRadius: 6,
    },
    progressText: {
        fontSize: 13,
        color: '#ccc',
        textAlign: 'center',
    },
    benefitsSection: {
        borderTopWidth: 1,
        borderTopColor: '#444',
        paddingTop: 15,
    },
    benefitsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 10,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    benefitBullet: {
        color: '#ff6b35',
        fontSize: 16,
        marginRight: 10,
        fontWeight: 'bold',
    },
    benefitText: {
        color: '#ccc',
        fontSize: 14,
        flex: 1,
        lineHeight: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
        gap: 15,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#2d2d2d',
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    statIcon: {
        fontSize: 30,
        marginBottom: 10,
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ff6b35',
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 13,
        color: '#999',
        textAlign: 'center',
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 15,
    },
    rewardCard: {
        backgroundColor: '#2d2d2d',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    rewardIcon: {
        width: 50,
        height: 50,
        backgroundColor: '#444',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    rewardEmoji: {
        fontSize: 24,
    },
    rewardInfo: {
        flex: 1,
    },
    rewardName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 3,
    },
    rewardDesc: {
        fontSize: 13,
        color: '#999',
        marginBottom: 5,
    },
    rewardPoints: {
        fontSize: 14,
        color: '#ff6b35',
        fontWeight: '600',
    },
    redeemButton: {
        backgroundColor: '#ff6b35',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    redeemButtonDisabled: {
        backgroundColor: '#444',
        opacity: 0.6,
    },
    redeemButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    redeemButtonTextDisabled: {
        color: '#999',
    },
    infoCard: {
        backgroundColor: '#2d2d2d',
        padding: 15,
        borderRadius: 12,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 15,
    },
    infoEmoji: {
        fontSize: 24,
        marginRight: 12,
        marginTop: 2,
    },
    infoText: {
        flex: 1,
        color: '#ccc',
        fontSize: 14,
        lineHeight: 20,
    },
});