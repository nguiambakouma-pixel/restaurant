import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import ordersService, { OrderWithItems } from '../services/orderService';

export default function OrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    try {
      setLoading(true);

      if (user) {
        // Utilisateur connecté
        const { orders: userOrders, error } = await ordersService.getUserOrders(user.id);
        if (error) throw error;
        setOrders(userOrders);
      } else {
        // Non connecté
        setOrders([]);
      }
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
      Alert.alert('Erreur', 'Impossible de charger vos commandes');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: { [key: string]: string } = {
      pending: '⏳ En attente',
      confirmed: '✅ Confirmée',
      preparing: '👨‍🍳 En préparation',
      ready: '🎉 Prête',
      delivering: '🚚 En livraison',
      completed: '✓ Livrée',
      cancelled: '✕ Annulée',
    };
    return statusLabels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      pending: '#FFA500',
      confirmed: '#4CAF50',
      preparing: '#2196F3',
      ready: '#9C27B0',
      delivering: '#FF9800',
      completed: '#4CAF50',
      cancelled: '#F44336',
    };
    return statusColors[status] || '#999';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCancelOrder = (orderId: string) => {
    Alert.alert(
      'Annuler la commande',
      'Voulez-vous vraiment annuler cette commande ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              const { success, error } = await ordersService.cancelOrder(orderId);
              if (error) throw error;
              
              Alert.alert('Succès', 'Commande annulée');
              loadOrders();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible d\'annuler la commande');
            }
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mes Commandes</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📦</Text>
          <Text style={styles.emptyTitle}>Connectez-vous</Text>
          <Text style={styles.emptyText}>
            Pour voir vos commandes, vous devez être connecté
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mes Commandes</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b35" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mes Commandes</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📦</Text>
          <Text style={styles.emptyTitle}>Aucune commande</Text>
          <Text style={styles.emptyText}>
            Vous n'avez pas encore passé de commande
          </Text>

          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/explore')}
            activeOpacity={0.8}
          >
            <Text style={styles.browseButtonText}>Parcourir le menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Commandes</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {orders.length} commande{orders.length > 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#ff6b35"
            colors={['#ff6b35']}
          />
        }
      >
        {orders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            {/* En-tête commande */}
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderNumber}>
                  Commande #{order.id.slice(0, 8)}
                </Text>
                <Text style={styles.orderDate}>
                  {formatDate(order.created_at)}
                </Text>
              </View>

              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(order.status) + '20' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(order.status) }
                ]}>
                  {getStatusLabel(order.status)}
                </Text>
              </View>
            </View>

            {/* Items */}
            <View style={styles.orderItems}>
              {order.order_items.slice(0, 3).map((item) => (
                <View key={item.id} style={styles.orderItem}>
                  {item.product_image_url && (
                    <Image
                      source={{ uri: item.product_image_url }}
                      style={styles.itemImage}
                      defaultSource={require('../../assets/images/hero.jpeg')}
                    />
                  )}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>
                      {item.quantity}x {item.product_name}
                    </Text>
                    <Text style={styles.itemPrice}>
                      {item.total_price.toFixed(0)} FCFA
                    </Text>
                  </View>
                </View>
              ))}

              {order.order_items.length > 3 && (
                <Text style={styles.moreItems}>
                  +{order.order_items.length - 3} autre(s) article(s)
                </Text>
              )}
            </View>

            {/* Infos livraison */}
            <View style={styles.orderDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  {order.delivery_mode === 'delivery' ? '📦' : '🏪'}{' '}
                  {order.delivery_mode === 'delivery' ? 'Livraison' : 'Retrait'}
                </Text>
                {order.delivery_mode === 'delivery' && order.customer_address && (
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {order.customer_address}
                  </Text>
                )}
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total</Text>
                <Text style={styles.totalValue}>{order.total.toFixed(0)} FCFA</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.orderActions}>
              {(order.status === 'pending' || order.status === 'confirmed') && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => handleCancelOrder(order.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
              )}

              {order.status === 'completed' && (
                <TouchableOpacity
                  style={styles.reorderButton}
                  onPress={() => {
                    Alert.alert('Bientôt', 'La fonction "Commander à nouveau" arrive bientôt !');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.reorderButtonText}>Commander à nouveau</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

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
  statsBar: {
    backgroundColor: '#2d2d2d',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  statsText: {
    color: '#ccc',
    fontSize: 14,
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
  browseButton: {
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
  browseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  orderCard: {
    backgroundColor: '#2d2d2d',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    padding: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  orderDate: {
    fontSize: 13,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderItems: {
    marginBottom: 15,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 3,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff6b35',
  },
  moreItems: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 5,
  },
  orderDetails: {
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#444',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#ccc',
  },
  detailValue: {
    fontSize: 14,
    color: 'white',
    flex: 1,
    textAlign: 'right',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  orderActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#444',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ff6b35',
    fontSize: 14,
    fontWeight: '600',
  },
  reorderButton: {
    flex: 1,
    backgroundColor: '#ff6b35',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  reorderButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});