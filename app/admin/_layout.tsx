import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function AdminLayout() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      if (!user) {
        router.replace('/(tabs)');
        return;
      }

      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (error || !data) {
        router.replace('/(tabs)');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Erreur vérification admin:', error);
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b35" />
        <Text style={styles.loadingText}>Vérification des permissions...</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="products/index" />
      <Stack.Screen name="products/add" />
      <Stack.Screen name="products/edit/[id]" />
      <Stack.Screen name="categories/index" />
      <Stack.Screen name="categories/add" />
      <Stack.Screen name="categories/edit/[id]" />
      <Stack.Screen name="stats" />
      {/* <Stack.Screen name="notifications" /> */}
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    color: '#ccc',
    marginTop: 10,
    fontSize: 16,
  },
});