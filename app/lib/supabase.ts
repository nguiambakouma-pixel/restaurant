import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = 'https://taqrzlactwshqzwpduui.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhcXJ6bGFjdHdzaHF6d3BkdXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MjQyNjMsImV4cCI6MjA4MTUwMDI2M30.xXGGuN5M3xgLRczQKSDv7WXg28RTz9vrRO9c_AWu4ic';

// Utilise AsyncStorage seulement sur mobile, undefined sur web
const storage = Platform.OS === 'web' ? undefined : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Types TypeScript pour la BD
export interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  preparation_time: number | null;
  is_available: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_spicy: boolean;
  allergens: string[] | null;
  ingredients: string[] | null;
  calories: number | null;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  display_order: number;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  customer_city: string | null;
  delivery_mode: 'delivery' | 'pickup';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'completed' | 'cancelled';
  special_instructions: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: string | null;
  payment_status: 'pending' | 'paid' | 'failed';
  stripe_payment_id: string | null;
  created_at: string;
  confirmed_at: string | null;
  prepared_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_price: number;
  product_image_url: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_requests: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  order_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  default_address: string | null;
  default_city: string | null;
  default_delivery_mode: 'delivery' | 'pickup';
  created_at: string;
  updated_at: string;
}

export default supabase;
