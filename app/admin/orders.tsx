import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
// import notificationService from '../services/notificationService';
import { OrderWithItems } from '../services/orderService';

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_name,
            product_price,
            product_image_url,
            quantity,
            unit_price,
            total_price
          )
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
      Alert.alert('Erreur', 'Impossible de charger les commandes');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'completed' | 'cancelled'
  ) => {
    try {
      const updateData: any = { status: newStatus };

      if (newStatus === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString();
      } else if (newStatus === 'preparing') {
        updateData.prepared_at = new Date().toISOString();
      } else if (newStatus === 'completed') {
        updateData.delivered_at = new Date().toISOString();
      } else if (newStatus === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;



      Alert.alert('Succès', 'Statut mis à jour');
      loadOrders();
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: '⏳ En attente',
      confirmed: '✅ Confirmée',
      preparing: '👨‍🍳 En préparation',
      ready: '🎉 Prête',
      delivering: '🚚 En livraison',
      completed: '✓ Livrée',
      cancelled: '✕ Annulée',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: '#FFA500',
      confirmed: '#4CAF50',
      preparing: '#2196F3',
      ready: '#9C27B0',
      delivering: '#FF9800',
      completed: '#4CAF50',
      cancelled: '#F44336',
    };
    return colors[status] || '#999';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredOrders = orders;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Commandes</Text>
          <View style={styles.headerSpacer} />
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Commandes ({filteredOrders.length})</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Filtres */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
      >
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => {
            setFilter('all');
            loadOrders();
          }}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Toutes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
          onPress={() => {
            setFilter('pending');
            loadOrders();
          }}
        >
          <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
            En attente
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'confirmed' && styles.filterButtonActive]}
          onPress={() => {
            setFilter('confirmed');
            loadOrders();
          }}
        >
          <Text style={[styles.filterText, filter === 'confirmed' && styles.filterTextActive]}>
            Confirmées
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'completed' && styles.filterButtonActive]}
          onPress={() => {
            setFilter('completed');
            loadOrders();
          }}
        >
          <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>
            Terminées
          </Text>
        </TouchableOpacity>
      </ScrollView>

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
        {filteredOrders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            {/* En-tête */}
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderNumber}>#{order.id.slice(0, 8)}</Text>
                <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(order.status) + '20' },
                ]}
              >
                <Text
                  style={[styles.statusText, { color: getStatusColor(order.status) }]}
                >
                  {getStatusLabel(order.status)}
                </Text>
              </View>
            </View>

            {/* Client */}
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>👤 {order.customer_name}</Text>
              <Text style={styles.customerPhone}>📞 {order.customer_phone}</Text>
              {order.customer_address && (
                <Text style={styles.customerAddress}>
                  📍 {order.customer_address}, {order.customer_city}
                </Text>
              )}
            </View>

            {/* Items */}
            <View style={styles.itemsList}>
              {order.order_items.slice(0, 3).map((item) => (
                <View key={item.id} style={styles.orderItem}>
                  {item.product_image_url && (
                    <Image
                      source={{ uri: item.product_image_url }}
                      style={styles.itemImage}
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
                  +{order.order_items.length - 3} autre(s)
                </Text>
              )}
            </View>

            {/* Total */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalValue}>{order.total.toFixed(0)} FCFA</Text>
            </View>

            {/* Actions */}
            {order.status === 'pending' && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.confirmButton]}
                  onPress={() => updateOrderStatus(order.id, 'confirmed')}
                >
                  <Text style={styles.actionButtonText}>✓ Confirmer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => updateOrderStatus(order.id, 'cancelled')}
                >
                  <Text style={styles.actionButtonText}>✕ Annuler</Text>
                </TouchableOpacity>
              </View>
            )}

            {order.status === 'confirmed' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.preparingButton]}
                onPress={() => updateOrderStatus(order.id, 'preparing')}
              >
                <Text style={styles.actionButtonText}>👨‍🍳 En préparation</Text>
              </TouchableOpacity>
            )}

            {order.status === 'preparing' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.readyButton]}
                onPress={() => updateOrderStatus(order.id, 'ready')}
              >
                <Text style={styles.actionButtonText}>✓ Prête</Text>
              </TouchableOpacity>
            )}

            {order.status === 'ready' && order.delivery_mode === 'delivery' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.deliveringButton]}
                onPress={() => updateOrderStatus(order.id, 'delivering')}
              >
                <Text style={styles.actionButtonText}>🚚 En livraison</Text>
              </TouchableOpacity>
            )}

            {(order.status === 'ready' || order.status === 'delivering') && (
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={() => updateOrderStatus(order.id, 'completed')}
              >
                <Text style={styles.actionButtonText}>✓ Terminer</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {filteredOrders.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyText}>Aucune commande</Text>
          </View>
        )}

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
  filterBar: {
    maxHeight: 60,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2d2d2d',
  },
  filterButton: {
    backgroundColor: '#444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: '#ff6b35',
  },
  filterText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  orderCard: {
    backgroundColor: '#2d2d2d',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 15,
    padding: 15,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  customerInfo: {
    marginBottom: 15,
  },
  customerName: {
    fontSize: 15,
    color: 'white',
    marginBottom: 5,
  },
  customerPhone: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 5,
  },
  customerAddress: {
    fontSize: 13,
    color: '#999',
  },
  itemsList: {
    marginBottom: 15,
  },
  orderItem: {
    flexDirection: 'row',
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
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#ff6b35',
    fontWeight: '600',
  },
  moreItems: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: '#ff6b35',
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  preparingButton: {
    backgroundColor: '#2196F3',
  },
  readyButton: {
    backgroundColor: '#9C27B0',
  },
  deliveringButton: {
    backgroundColor: '#FF9800',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
});