import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import { UserProvider } from '../context/UserContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <UserProvider>
        <CartProvider>
          <FavoritesProvider>
            <Tabs
              screenOptions={{
                tabBarActiveTintColor: '#ff6b35',
                tabBarInactiveTintColor: '#666',
                headerShown: false,
                tabBarStyle: {
                  backgroundColor: '#1a1a1a',
                  borderTopColor: '#333',
                  borderTopWidth: 1,
                  height: 65,
                  paddingBottom: 8,
                  paddingTop: 8,
                },
                tabBarLabelStyle: {
                  fontSize: 11,
                  fontWeight: '600',
                  marginTop: -2,
                },
              }}>
              <Tabs.Screen
                name="index"
                options={{
                  title: 'Accueil',
                  tabBarIcon: ({ color, focused }) => (
                    <IconSymbol size={24} name="house.fill" color={focused ? '#ff6b35' : '#999'} />
                  ),
                  tabBarButton: HapticTab,
                }}
              />
              
              <Tabs.Screen
                name="explore"
                options={{
                  title: 'Menu',
                  tabBarIcon: ({ color, focused }) => (
                    <IconSymbol size={24} name="fork.knife" color={focused ? '#ff6b35' : '#999'} />
                  ),
                  tabBarButton: HapticTab,
                }}
              />

              <Tabs.Screen
                name="favorites"
                options={{
                  title: 'Favoris',
                  tabBarIcon: ({ color, focused }) => (
                    <IconSymbol size={24} name="heart.fill" color={focused ? '#ff6b35' : '#999'} />
                  ),
                  tabBarButton: HapticTab,
                }}
              />

              <Tabs.Screen
                name="cart"
                options={{
                  title: 'Panier',
                  tabBarIcon: ({ color, focused }) => (
                    <IconSymbol size={24} name="cart.fill" color={focused ? '#ff6b35' : '#999'} />
                  ),
                  tabBarButton: HapticTab,
                }}
              />

              <Tabs.Screen
                name="profile"
                options={{
                  title: 'Profil',
                  tabBarIcon: ({ color, focused }) => (
                    <IconSymbol size={24} name="person.fill" color={focused ? '#ff6b35' : '#999'} />
                  ),
                  tabBarButton: HapticTab,
                }}
              />

              {/* Routes cachées */}
              <Tabs.Screen
                name="orders"
                options={{
                  href: null,
                }}
              />

              <Tabs.Screen
                name="edit-profile"
                options={{
                  href: null,
                }}
              />

              <Tabs.Screen
                name="checkout"
                options={{
                  href: null,
                }}
              />

              <Tabs.Screen
                name="login"
                options={{
                  href: null,
                }}
              />

              <Tabs.Screen
                name="register"
                options={{
                  href: null,
                }}
              />

              <Tabs.Screen
                name="product/[id]"
                options={{
                  href: null,
                }}
              />
            </Tabs>
          </FavoritesProvider>
        </CartProvider>
      </UserProvider>
    </AuthProvider>
  );
}