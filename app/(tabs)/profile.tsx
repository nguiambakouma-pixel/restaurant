import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LoadingScreen from '../../components/ui/LoadingScreen';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { supabase } from '../lib/supabase';

import loyaltyService from '../services/loyaltyService';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user, signOut, loading } = useAuth();
  const { getFavoritesCount } = useFavorites();
  const { getTotalItems } = useCart();

  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loyaltyLevel, setLoyaltyLevel] = useState('bronze');
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
  });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      loadLoyaltyInfo();
      loadUserStats();
      checkAdminStatus();
    }
  }, [user]);

  const loadLoyaltyInfo = async () => {
    try {
      const { data } = await loyaltyService.getLoyaltyPoints(user!.id);
      if (data) {
        setLoyaltyPoints(data.points);
        setLoyaltyLevel(data.level);
      }
    } catch (error) {
      console.error('Erreur chargement fidélité:', error);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', user!.id)
        .single();

      if (data && !error) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (e) {
      setIsAdmin(false);
    }
  };

  const loadUserStats = async () => {
    try {
      // Charger les vraies stats depuis Supabase
      const { default: ordersService } = await import('../services/orderService');
      const { total_orders, total_spent } = await ordersService.getUserOrderStats(user!.id);
      setStats({
        totalOrders: total_orders,
        totalSpent: total_spent,
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
      setStats({
        totalOrders: 0,
        totalSpent: 0,
      });
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile.alerts.logoutTitle'),
      t('profile.alerts.logoutText'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: async () => {
            await signOut();
            Alert.alert(t('profile.alerts.logoutSuccessTitle'), t('profile.alerts.logoutSuccessText'));
          }
        }
      ]
    );
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  if (loading) {
    return <LoadingScreen />;
  }

  // Si l'utilisateur n'est pas connecté (MODE INVITÉ)
  if (!user) {
    return (
      <View style={styles.container}>
        {/* Header simple pour invité */}
        <View style={[styles.headerGuest, { paddingTop: insets.top + 10 }]}>
          <View style={styles.guestBadge}>
            <Text style={styles.guestBadgeIcon}>👤</Text>
          </View>
          <Text style={styles.headerTitle}>{t('profile.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('profile.guest.badge')}</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Stats invité */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🛒</Text>
              <Text style={styles.statValue}>{getTotalItems()}</Text>
              <Text style={styles.statLabel}>{t('profile.stats.cart')}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🍽️</Text>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>{t('profile.stats.orders')}</Text>
            </View>
          </View>

          {/* Message invité */}
          <View style={styles.guestContainer}>
            <Text style={styles.guestTitle}>{t('profile.guest.title')}</Text>
            <Text style={styles.guestText}>
              {t('profile.guest.text')}
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/login')}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>{t('profile.guest.login')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/register')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>{t('profile.guest.register')}</Text>
            </TouchableOpacity>
          </View>

          {/* Fonctionnalités disponibles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile.features.title')}</Text>
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>❤️</Text>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>{t('profile.features.favorites.title')}</Text>
                <Text style={styles.featureDesc}>{t('profile.features.favorites.desc')}</Text>
              </View>
            </View>
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>📦</Text>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>{t('profile.features.delivery.title')}</Text>
                <Text style={styles.featureDesc}>{t('profile.features.delivery.desc')}</Text>
              </View>
            </View>
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>📋</Text>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>{t('profile.features.history.title')}</Text>
                <Text style={styles.featureDesc}>{t('profile.features.history.desc')}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );

  }

  // Si l'utilisateur est connecté (DASHBOARD)
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur';
  const userInitials = getInitials(userName);

  return (
    <View style={styles.container}>
      {/* Header utilisateur connecté */}
      <View style={[styles.headerConnected, { paddingTop: insets.top + 10 }]}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats utilisateur */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>❤️</Text>
            <Text style={styles.statValue}>{getFavoritesCount()}</Text>
            <Text style={styles.statLabel}>{t('profile.stats.favorites')}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📦</Text>
            <Text style={styles.statValue}>{stats.totalOrders}</Text>
            <Text style={styles.statLabel}>{t('profile.stats.orders')}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🛒</Text>
            <Text style={styles.statValue}>{getTotalItems()}</Text>
            <Text style={styles.statLabel}>{t('profile.stats.inCart')}</Text>
          </View>
        </View>

        {/* Accès rapide */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.menu.quickAccess')}</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('./favorites')}
            activeOpacity={0.8}
          >
            <Text style={styles.menuIcon}>❤️</Text>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>{t('profile.menu.myFavorites')}</Text>
              <Text style={styles.menuDesc}>{getFavoritesCount()} {t('profile.menu.savedDishes')}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/orders')}
            activeOpacity={0.8}
          >
            <Text style={styles.menuIcon}>📦</Text>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>{t('profile.menu.myOrders')}</Text>
              <Text style={styles.menuDesc}>{stats.totalOrders} {t('orders.count')}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/cart')}
            activeOpacity={0.8}
          >
            <Text style={styles.menuIcon}>🛒</Text>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>{t('profile.menu.myCart')}</Text>
              <Text style={styles.menuDesc}>{getTotalItems()} {t('cart.items')}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Paramètres */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/settings')}
            activeOpacity={0.8}
          >
            <Text style={styles.menuIcon}>⚙️</Text>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>{t('profile.settings')}</Text>
              <Text style={styles.menuDesc}>{t('profile.language')}, etc.</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/edit-profile')}
            activeOpacity={0.8}
          >
            <Text style={styles.menuIcon}>👤</Text>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>{t('profile.menu.personalInfo')}</Text>
              <Text style={styles.menuDesc}>{t('profile.menu.personalInfoDesc')}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert(t('common.info'), t('profile.alerts.addressesComingSoon'))}
            activeOpacity={0.8}
          >
            <Text style={styles.menuIcon}>📍</Text>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>{t('profile.menu.myAddresses')}</Text>
              <Text style={styles.menuDesc}>{t('profile.menu.addressesDesc')}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Aide */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.menu.help')}</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert(t('profile.menu.support'), t('profile.alerts.supportContent'))}
            activeOpacity={0.8}
          >
            <Text style={styles.menuIcon}>💬</Text>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>{t('profile.menu.support')}</Text>
              <Text style={styles.menuDesc}>{t('profile.menu.supportDesc')}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert(t('profile.menu.about'), t('profile.alerts.aboutContent'))}
            activeOpacity={0.8}
          >
            <Text style={styles.menuIcon}>ℹ️</Text>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>{t('profile.menu.about')}</Text>
              <Text style={styles.menuDesc}>{t('profile.menu.aboutDesc')}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>
        {/* ============ AJOUTEZ CE CODE ICI ============ */}

        {/* Section Admin - Visible seulement pour les admins */}
        {/* Section Admin - Visible seulement pour les admins */}
        {
          user && isAdmin && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('profile.menu.admin')}</Text>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/admin')}
                activeOpacity={0.8}
              >
                <Text style={styles.menuIcon}>⚙️</Text>
                <View style={styles.menuInfo}>
                  <Text style={styles.menuTitle}>{t('profile.menu.adminDashboard')}</Text>
                  <Text style={styles.menuDesc}>{t('profile.menu.adminDesc')}</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            </View>
          )
        }

        {/* ============ FIN DU CODE À AJOUTER ============ */}

        {/* Bouton déconnexion */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutButtonText}>🚪 {t('profile.logout')}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView >
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    backgroundColor: '#2d2d2d',
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerGuest: {
    backgroundColor: '#2d2d2d',
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  guestBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  guestBadgeIcon: {
    fontSize: 40,
  },
  headerConnected: {
    backgroundColor: '#2d2d2d',
    paddingBottom: 20,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff6b35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#ccc',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 10,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2d2d2d',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  statIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b35',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  guestContainer: {
    padding: 30,
    alignItems: 'center',
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  guestText: {
    fontSize: 15,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#ff6b35',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ff6b35',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#ff6b35',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  menuItem: {
    backgroundColor: '#2d2d2d',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 15,
    width: 30,
    textAlign: 'center',
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 3,
  },
  menuDesc: {
    fontSize: 13,
    color: '#999',
  },
  menuArrow: {
    fontSize: 28,
    color: '#666',
    fontWeight: '300',
  },
  featureCard: {
    backgroundColor: '#2d2d2d',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  featureIcon: {
    fontSize: 30,
    marginRight: 15,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 3,
  },
  featureDesc: {
    fontSize: 13,
    color: '#999',
  },
  logoutButton: {
    backgroundColor: '#444',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  logoutButtonText: {
    color: '#ff6b35',
    fontSize: 16,
    fontWeight: 'bold',
  },
});