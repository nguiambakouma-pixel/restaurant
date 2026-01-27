import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function AdminDashboardScreen() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    todayRevenue: 0,
    totalProducts: 0,
    activeProducts: 0,
    totalCustomers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Charger les statistiques des commandes
      const { data: orders } = await supabase
        .from('orders')
        .select('total, status, created_at');

      const totalOrders = orders?.length || 0;
      const pendingOrders = orders?.filter((o) => o.status === 'pending').length || 0;

      // Calculer le revenu du jour
      const today = new Date().toISOString().split('T')[0];
      const todayRevenue =
        orders
          ?.filter((o) => o.created_at.startsWith(today))
          .reduce((sum, o) => sum + o.total, 0) || 0;

      // Charger les statistiques des produits
      const { data: products } = await supabase.from('products').select('is_available');

      const totalProducts = products?.length || 0;
      const activeProducts = products?.filter((p) => p.is_available).length || 0;

      // Charger le nombre de clients uniques
      const { data: customers } = await supabase
        .from('orders')
        .select('user_id')
        .not('user_id', 'is', null);

      const uniqueCustomers = new Set(customers?.map((c) => c.user_id)).size;

      setStats({
        totalOrders,
        pendingOrders,
        todayRevenue,
        totalProducts,
        activeProducts,
        totalCustomers: uniqueCustomers,
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
      Alert.alert('Erreur', 'Impossible de charger les statistiques');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard Admin</Text>
          <Text style={styles.headerSubtitle}>Bistro Moderne</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b35" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard Admin</Text>
        <Text style={styles.headerSubtitle}>Bistro Moderne</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#ff6b35" />
        }
      >
        {/* Statistiques principales */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistiques</Text>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.statCardOrange]}>
              <Text style={styles.statIcon}>📦</Text>
              <Text style={styles.statValue}>{stats.totalOrders}</Text>
              <Text style={styles.statLabel}>Commandes totales</Text>
            </View>

            <View style={[styles.statCard, styles.statCardRed]}>
              <Text style={styles.statIcon}>⏳</Text>
              <Text style={styles.statValue}>{stats.pendingOrders}</Text>
              <Text style={styles.statLabel}>En attente</Text>
            </View>

            <View style={[styles.statCard, styles.statCardGreen]}>
              <Text style={styles.statIcon}>💰</Text>
              <Text style={styles.statValue}>{stats.todayRevenue.toFixed(0)}</Text>
              <Text style={styles.statLabel}>FCFA aujourd'hui</Text>
            </View>

            <View style={[styles.statCard, styles.statCardBlue]}>
              <Text style={styles.statIcon}>🍽️</Text>
              <Text style={styles.statValue}>
                {stats.activeProducts}/{stats.totalProducts}
              </Text>
              <Text style={styles.statLabel}>Produits actifs</Text>
            </View>

            <View style={[styles.statCard, styles.statCardPurple]}>
              <Text style={styles.statIcon}>👥</Text>
              <Text style={styles.statValue}>{stats.totalCustomers}</Text>
              <Text style={styles.statLabel}>Clients</Text>
            </View>
          </View>
        </View>

        {/* Alertes */}
        {stats.pendingOrders > 0 && (
          <View style={styles.alertSection}>
            <View style={styles.alertCard}>
              <Text style={styles.alertIcon}>⚠️</Text>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>Commandes en attente</Text>
                <Text style={styles.alertText}>
                  {stats.pendingOrders} commande{stats.pendingOrders > 1 ? 's' : ''} en attente de
                  traitement
                </Text>
              </View>
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => router.push('/admin/orders')}
              >
                <Text style={styles.alertButtonText}>Voir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Actions rapides */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin/orders')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Gérer les commandes</Text>
              <Text style={styles.actionSubtitle}>
                {stats.pendingOrders} en attente
              </Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('./admin/products')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIcon}>🍽️</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Gérer le menu</Text>
              <Text style={styles.actionSubtitle}>
                {stats.totalProducts} produits
              </Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('./admin/categories')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIcon}>📂</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Gérer les catégories</Text>
              <Text style={styles.actionSubtitle}>Organiser le menu</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/admin/stats')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Statistiques avancées</Text>
              <Text style={styles.actionSubtitle}>Rapports et analyses</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('../admin/notifications')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIcon}>🔔</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Tester les notifications</Text>
              <Text style={styles.actionSubtitle}>Envoyer des tests</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
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
  content: {
    flex: 1,
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%',
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
  statCardOrange: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b35',
  },
  statCardRed: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  statCardGreen: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  statCardBlue: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  statCardPurple: {
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
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
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  alertSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  alertCard: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  alertIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 3,
  },
  alertText: {
    fontSize: 13,
    color: '#BF360C',
  },
  alertButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  alertButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionsSection: {
    paddingHorizontal: 20,
  },
  actionCard: {
    backgroundColor: '#2d2d2d',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  actionIcon: {
    fontSize: 28,
    marginRight: 15,
    width: 40,
    textAlign: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 3,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#999',
  },
  actionArrow: {
    fontSize: 28,
    color: '#666',
    fontWeight: '300',
  },
});