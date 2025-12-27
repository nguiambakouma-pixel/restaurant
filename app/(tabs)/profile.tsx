import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';

export default function ProfileScreen() {
  const { user, signOut, loading } = useAuth();
  const { getFavoritesCount } = useFavorites();
  const { getTotalItems } = useCart();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    if (user) {
      loadUserStats();
    }
  }, [user]);

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
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            Alert.alert('À bientôt !', 'Vous avez été déconnecté avec succès');
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
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mon Profil</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b35" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  // Si l'utilisateur n'est pas connecté (MODE INVITÉ)
  if (!user) {
    return (
      <View style={styles.container}>
        {/* Header simple pour invité */}
        <View style={styles.headerGuest}>
          <View style={styles.guestBadge}>
            <Text style={styles.guestBadgeIcon}>👤</Text>
          </View>
          <Text style={styles.headerTitle}>Mode Invité</Text>
          <Text style={styles.headerSubtitle}>Connectez-vous pour plus de fonctionnalités</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Stats invité */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🛒</Text>
              <Text style={styles.statValue}>{getTotalItems()}</Text>
              <Text style={styles.statLabel}>Articles au panier</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🍽️</Text>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Commandes</Text>
            </View>
          </View>

          {/* Message invité */}
          <View style={styles.guestContainer}>
            <Text style={styles.guestTitle}>Créez votre compte</Text>
            <Text style={styles.guestText}>
              Profitez de tous les avantages : favoris, historique, livraison et plus encore !
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/login')}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Se connecter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/register')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Créer un compte</Text>
            </TouchableOpacity>
          </View>

          {/* Fonctionnalités disponibles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Avec un compte</Text>
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>❤️</Text>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>Plats favoris</Text>
                <Text style={styles.featureDesc}>Sauvegardez vos plats préférés</Text>
              </View>
            </View>
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>📦</Text>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>Livraison à domicile</Text>
                <Text style={styles.featureDesc}>Commandez et faites-vous livrer</Text>
              </View>
            </View>
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>📋</Text>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>Historique des commandes</Text>
                <Text style={styles.featureDesc}>Suivez toutes vos commandes</Text>
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
      <View style={styles.headerConnected}>
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
            <Text style={styles.statLabel}>Favoris</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📦</Text>
            <Text style={styles.statValue}>{stats.totalOrders}</Text>
            <Text style={styles.statLabel}>Commandes</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🛒</Text>
            <Text style={styles.statValue}>{getTotalItems()}</Text>
            <Text style={styles.statLabel}>Au panier</Text>
          </View>
        </View>

        {/* Accès rapide */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accès rapide</Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('./favorites')}
            activeOpacity={0.8}
          >
            <Text style={styles.menuIcon}>❤️</Text>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Mes favoris</Text>
              <Text style={styles.menuDesc}>{getFavoritesCount()} plat(s) sauvegardé(s)</Text>
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
              <Text style={styles.menuTitle}>Mes commandes</Text>
              <Text style={styles.menuDesc}>{stats.totalOrders} commande(s)</Text>
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
              <Text style={styles.menuTitle}>Mon panier</Text>
              <Text style={styles.menuDesc}>{getTotalItems()} article(s)</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Paramètres */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte</Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/edit-profile')}
            activeOpacity={0.8}
          >
            <Text style={styles.menuIcon}>👤</Text>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Informations personnelles</Text>
              <Text style={styles.menuDesc}>Nom, email, téléphone</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Bientôt disponible', 'La gestion des adresses arrive bientôt !')}
            activeOpacity={0.8}
          >
            <Text style={styles.menuIcon}>📍</Text>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Mes adresses</Text>
              <Text style={styles.menuDesc}>Gérer les adresses de livraison</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Bientôt disponible', 'Les paramètres arrivent bientôt !')}
            activeOpacity={0.8}
          >
            <Text style={styles.menuIcon}>⚙️</Text>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Paramètres</Text>
              <Text style={styles.menuDesc}>Préférences et notifications</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Aide */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aide</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Support', 'Contactez-nous :\nsupport@bistromoderne.com\n+237 6 XX XX XX XX')}
            activeOpacity={0.8}
          >
            <Text style={styles.menuIcon}>💬</Text>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Support</Text>
              <Text style={styles.menuDesc}>Besoin d'aide ?</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('À propos', 'Bistro Moderne v1.0\nDéveloppé avec ❤️ au Cameroun')}
            activeOpacity={0.8}
          >
            <Text style={styles.menuIcon}>ℹ️</Text>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>À propos</Text>
              <Text style={styles.menuDesc}>Version et informations</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Bouton déconnexion */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutButtonText}>🚪 Déconnexion</Text>
          </TouchableOpacity>
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
  headerGuest: {
    backgroundColor: '#2d2d2d',
    paddingTop: 50,
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
    paddingTop: 50,
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