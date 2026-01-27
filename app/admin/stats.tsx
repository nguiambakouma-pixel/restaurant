import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Array<{ name: string; count: number; revenue: number }>;
  revenueByDay: Array<{ date: string; revenue: number }>;
  ordersByStatus: Array<{ status: string; count: number }>;
  newCustomersThisMonth: number;
}

export default function StatsScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadStats();
  }, [period]);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Calculer les dates selon la période
      const now = new Date();
      const startDate = new Date();

      if (period === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else {
        startDate.setFullYear(now.getFullYear() - 1);
      }

      // 1. Charger toutes les commandes de la période
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (ordersError) throw ordersError;

      // 2. Calculer les statistiques globales
      const totalRevenue = orders?.reduce((sum, o) => sum + o.total, 0) || 0;
      const totalOrders = orders?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // 3. Top produits (par nombre de commandes)
      const productStats: { [key: string]: { count: number; revenue: number; name: string } } = {};

      orders?.forEach((order) => {
        order.order_items?.forEach((item: any) => {
          const productName = item.product_name;
          if (!productStats[productName]) {
            productStats[productName] = { count: 0, revenue: 0, name: productName };
          }
          productStats[productName].count += item.quantity;
          productStats[productName].revenue += item.total_price;
        });
      });

      const topProducts = Object.values(productStats)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // 4. Revenus par jour (derniers 7 jours)
      const revenueByDay: { [key: string]: number } = {};
      const last7Days = new Date();
      last7Days.setDate(now.getDate() - 6);

      // Initialiser tous les jours à 0
      for (let i = 0; i < 7; i++) {
        const date = new Date(last7Days);
        date.setDate(last7Days.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        revenueByDay[dateKey] = 0;
      }

      // Remplir avec les vraies données
      orders?.forEach((order) => {
        const orderDate = order.created_at.split('T')[0];
        if (revenueByDay.hasOwnProperty(orderDate)) {
          revenueByDay[orderDate] += order.total;
        }
      });

      const revenueByDayArray = Object.entries(revenueByDay).map(([date, revenue]) => ({
        date,
        revenue,
      }));

      // 5. Commandes par statut
      const ordersByStatus: { [key: string]: number } = {};
      orders?.forEach((order) => {
        ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
      });

      const ordersByStatusArray = Object.entries(ordersByStatus).map(([status, count]) => ({
        status,
        count,
      }));

      // 6. Nouveaux clients ce mois
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const { data: newCustomers } = await supabase
        .from('orders')
        .select('user_id')
        .not('user_id', 'is', null)
        .gte('created_at', startOfMonth.toISOString());

      const uniqueNewCustomers = new Set(newCustomers?.map((c) => c.user_id)).size;

      setStats({
        totalRevenue,
        totalOrders,
        averageOrderValue,
        topProducts,
        revenueByDay: revenueByDayArray,
        ordersByStatus: ordersByStatusArray,
        newCustomersThisMonth: uniqueNewCustomers,
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Statistiques</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b35" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Statistiques</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucune donnée disponible</Text>
        </View>
      </View>
    );
  }

  // Configuration du thème des graphiques
  const chartConfig = {
    backgroundColor: '#2d2d2d',
    backgroundGradientFrom: '#2d2d2d',
    backgroundGradientTo: '#2d2d2d',
    color: (opacity = 1) => `rgba(255, 107, 53, ${opacity})`, // Couleur principale
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // Couleur des labels
  };
  // Préparer les données pour le graphique de revenus
  const revenueChartData = {
    labels: stats.revenueByDay.map((d) => {
      const date = new Date(d.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }),
    datasets: [
      {
        data: stats.revenueByDay.map((d) => d.revenue),
        color: (opacity = 1) => `rgba(255, 107, 53, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  // Préparer les données pour le graphique circulaire (statuts)
  const statusColors = ['#4CAF50', '#FF9800', '#2196F3', '#F44336', '#9C27B0'];
  const pieChartData = stats.ordersByStatus.map((s, index) => ({
    name: getStatusLabel(s.status),
    population: s.count,
    color: statusColors[index % statusColors.length],
    legendFontColor: '#ccc',
    legendFontSize: 12,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Statistiques</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Sélecteur de période */}
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[styles.periodButton, period === 'week' && styles.periodButtonActive]}
          onPress={() => setPeriod('week')}
        >
          <Text
            style={[styles.periodButtonText, period === 'week' && styles.periodButtonTextActive]}
          >
            Semaine
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, period === 'month' && styles.periodButtonActive]}
          onPress={() => setPeriod('month')}
        >
          <Text
            style={[styles.periodButtonText, period === 'month' && styles.periodButtonTextActive]}
          >
            Mois
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, period === 'year' && styles.periodButtonActive]}
          onPress={() => setPeriod('year')}
        >
          <Text
            style={[styles.periodButtonText, period === 'year' && styles.periodButtonTextActive]}
          >
            Année
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* KPIs principaux */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiIcon}>💰</Text>
              <Text style={styles.kpiValue}>{stats.totalRevenue.toFixed(0)}</Text>
              <Text style={styles.kpiLabel}>FCFA de revenus</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiIcon}>📦</Text>
              <Text style={styles.kpiValue}>{stats.totalOrders}</Text>
              <Text style={styles.kpiLabel}>Commandes</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiIcon}>💵</Text>
              <Text style={styles.kpiValue}>{stats.averageOrderValue.toFixed(0)}</Text>
              <Text style={styles.kpiLabel}>FCFA moyen/commande</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiIcon}>👥</Text>
              <Text style={styles.kpiValue}>{stats.newCustomersThisMonth}</Text>
              <Text style={styles.kpiLabel}>Nouveaux clients</Text>
            </View>
          </View>
        </View>

        {/* Graphique de revenus */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenus des 7 derniers jours</Text>
          <View style={styles.chartContainer}>
            <LineChart
              data={revenueChartData}
              width={width - 40}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withInnerLines={false}
              withOuterLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              fromZero={true}
            />
          </View>
        </View>

        {/* Top produits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top 5 produits</Text>
          {stats.topProducts.map((product, index) => (
            <View key={index} style={styles.productRankCard}>
              <View style={styles.productRank}>
                <Text style={styles.rankNumber}>#{index + 1}</Text>
              </View>
              <View style={styles.productRankInfo}>
                <Text style={styles.productRankName}>{product.name}</Text>
                <Text style={styles.productRankDetails}>
                  {product.count} vendus • {product.revenue.toFixed(0)} FCFA
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Graphique circulaire des statuts */}
        {pieChartData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Répartition des commandes</Text>
            <View style={styles.chartContainer}>
              <PieChart
                data={pieChartData}
                width={width - 40}
                height={220}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
                style={styles.chart}
              />
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function getStatusLabel(status: string): string {
  const labels: { [key: string]: string } = {
    pending: 'En attente',
    confirmed: 'Confirmée',
    preparing: 'En préparation',
    ready: 'Prête',
    delivering: 'En livraison',
    completed: 'Livrée',
    cancelled: 'Annulée',
  };
  return labels[status] || status;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    backgroundColor: '#2d2d2d',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#444',
  },
  backButtonText: {
    fontSize: 24,
    color: '#ff6b35',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b35',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ccc',
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#2d2d2d',
    padding: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  periodButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  periodButtonActive: {
    backgroundColor: '#ff6b35',
    borderColor: '#ff6b35',
  },
  periodButtonText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
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
  kpiIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b35',
    marginBottom: 5,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: '#2d2d2d',
    borderRadius: 16,
    padding: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  chart: {
    borderRadius: 16,
  },
  productRankCard: {
    backgroundColor: '#2d2d2d',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  productRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff6b35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  productRankInfo: {
    flex: 1,
  },
  productRankName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  productRankDetails: {
    fontSize: 13,
    color: '#999',
  },
});