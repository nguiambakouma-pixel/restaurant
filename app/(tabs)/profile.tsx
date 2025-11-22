import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { user, signOut, loading } = useAuth();

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

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mon Profil</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  // Si l'utilisateur n'est pas connecté
  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mon Profil</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.guestContainer}>
            <Text style={styles.guestEmoji}>👤</Text>
            <Text style={styles.guestTitle}>Vous n'êtes pas connecté</Text>
            <Text style={styles.guestText}>
              Créez un compte pour sauvegarder vos informations et suivre vos commandes
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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fonctionnalités disponibles</Text>
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>📦</Text>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>Historique des commandes</Text>
                <Text style={styles.featureDesc}>Suivez toutes vos commandes</Text>
              </View>
            </View>
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>❤️</Text>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>Plats favoris</Text>
                <Text style={styles.featureDesc}>Enregistrez vos plats préférés</Text>
              </View>
            </View>
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>⭐</Text>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>Avis et notes</Text>
                <Text style={styles.featureDesc}>Partagez votre expérience</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Si l'utilisateur est connecté
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon Profil</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Carte utilisateur */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.email?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>
            {user.user_metadata?.full_name || 'Utilisateur'}
          </Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>

        {/* Menu options */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Bientôt disponible', 'Cette fonctionnalité arrive bientôt !')}
            activeOpacity={0.8}
          >
            <Text style={styles.menuIcon}>📦</Text>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Mes commandes</Text>
              <Text style={styles.menuDesc}>Historique et suivi</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Bientôt disponible', 'Cette fonctionnalité arrive bientôt !')}
            activeOpacity={0.8}
          >
            <Text style={styles.menuIcon}>❤️</Text>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Mes favoris</Text>
              <Text style={styles.menuDesc}>Plats sauvegardés</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Bientôt disponible', 'Cette fonctionnalité arrive bientôt !')}
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
            onPress={() => Alert.alert('Bientôt disponible', 'Cette fonctionnalité arrive bientôt !')}
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
            onPress={() => Alert.alert('Support', 'Contactez-nous : support@bistromoderne.com')}
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
            onPress={() => Alert.alert('À propos', 'Bistro Moderne v1.0\nDéveloppé avec ❤️')}
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ccc',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  guestContainer: {
    padding: 40,
    alignItems: 'center',
  },
  guestEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  guestText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#ff6b35',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
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
  userCard: {
    backgroundColor: '#2d2d2d',
    margin: 20,
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ff6b35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#ccc',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  menuItem: {
    backgroundColor: '#2d2d2d',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  menuDesc: {
    fontSize: 13,
    color: '#999',
  },
  menuArrow: {
    fontSize: 24,
    color: '#666',
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
    marginBottom: 2,
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
  },
  logoutButtonText: {
    color: '#ff6b35',
    fontSize: 16,
    fontWeight: 'bold',
  },
});