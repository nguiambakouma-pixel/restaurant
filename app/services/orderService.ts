import { supabase } from '../lib/supabase';

export interface OrderItemData {
  product_id: string;
  product_name: string;
  product_price: number;
  product_image_url?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface OrderData {
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  customer_city?: string;
  delivery_mode: 'delivery' | 'pickup';
  special_instructions?: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  items: OrderItemData[];
  user_id?: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  customer_city: string | null;
  delivery_mode: 'delivery' | 'pickup';
  status: string;
  special_instructions: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: string | null;
  payment_status: string;
  created_at: string;
  confirmed_at: string | null;
  prepared_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
}

export interface OrderWithItems extends Order {
  order_items: Array<{
    id: string;
    product_name: string;
    product_price: number;
    product_image_url: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

class OrdersService {
  /**
   * Créer une nouvelle commande dans Supabase
   */
  async createOrder(orderData: OrderData): Promise<{ order: Order | null; error: any }> {
    try {
      // 1. Créer la commande principale
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: orderData.user_id || null,
          customer_name: orderData.customer_name,
          customer_phone: orderData.customer_phone,
          customer_address: orderData.customer_address || null,
          customer_city: orderData.customer_city || null,
          delivery_mode: orderData.delivery_mode,
          status: 'pending',
          special_instructions: orderData.special_instructions || null,
          subtotal: orderData.subtotal,
          delivery_fee: orderData.delivery_fee,
          total: orderData.total,
          payment_method: 'cash',
          payment_status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Créer les items de la commande
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_price: item.product_price,
        product_image_url: item.product_image_url || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return { order, error: null };
    } catch (error) {
      console.error('Erreur création commande:', error);
      return { order: null, error };
    }
  }

  /**
   * Récupérer les commandes d'un utilisateur
   */
  async getUserOrders(userId: string): Promise<{ orders: OrderWithItems[]; error: any }> {
    try {
      const { data, error } = await supabase
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
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { orders: data || [], error: null };
    } catch (error) {
      console.error('Erreur récupération commandes:', error);
      return { orders: [], error };
    }
  }

  /**
   * Récupérer les commandes non authentifiées par téléphone
   */
  async getOrdersByPhone(phone: string): Promise<{ orders: OrderWithItems[]; error: any }> {
    try {
      const { data, error } = await supabase
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
        .eq('customer_phone', phone)
        .is('user_id', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return { orders: data || [], error: null };
    } catch (error) {
      console.error('Erreur récupération commandes par téléphone:', error);
      return { orders: [], error };
    }
  }

  /**
   * Récupérer une commande spécifique avec ses items
   */
  async getOrder(orderId: string): Promise<{ order: OrderWithItems | null; error: any }> {
    try {
      const { data, error } = await supabase
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
        .eq('id', orderId)
        .single();

      if (error) throw error;

      return { order: data, error: null };
    } catch (error) {
      console.error('Erreur récupération commande:', error);
      return { order: null, error };
    }
  }

  /**
   * Mettre à jour le statut d'une commande
   */
  async updateOrderStatus(
    orderId: string,
    status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'completed' | 'cancelled'
  ): Promise<{ success: boolean; error: any }> {
    try {
      const updateData: any = { status };

      // Mettre à jour les timestamps selon le statut
      if (status === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString();
      } else if (status === 'preparing') {
        updateData.prepared_at = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.delivered_at = new Date().toISOString();
      } else if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      return { success: true, error: null };
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      return { success: false, error };
    }
  }

  /**
   * Annuler une commande
   */
  async cancelOrder(orderId: string): Promise<{ success: boolean; error: any }> {
    return this.updateOrderStatus(orderId, 'cancelled');
  }

  /**
   * Obtenir les statistiques de commandes d'un utilisateur
   */
  async getUserOrderStats(userId: string): Promise<{
    total_orders: number;
    total_spent: number;
    error: any;
  }> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('total, status')
        .eq('user_id', userId);

      if (error) throw error;

      const total_orders = data?.length || 0;
      const total_spent = data?.reduce((sum, order) => sum + order.total, 0) || 0;

      return { total_orders, total_spent, error: null };
    } catch (error) {
      console.error('Erreur stats commandes:', error);
      return { total_orders: 0, total_spent: 0, error };
    }
  }
}

export const ordersService = new OrdersService();
export default ordersService;