import { Stack } from 'expo-router';
import React from 'react';
// import { NotificationHandler } from '../components/NotificationHandler';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { UserProvider } from './context/UserContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <UserProvider>
        <CartProvider>
          <FavoritesProvider>
            {/* <NotificationHandler /> */}
            <Stack screenOptions={{ headerShown: false }}>
              {/* Route vers l'app principale (tabs) */}
              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: false,
                  title: 'Bistro Moderne'
                }}
              />

              {/* Route vers le dashboard admin */}
              <Stack.Screen
                name="admin"
                options={{
                  headerShown: false,
                  title: 'Dashboard Admin'
                }}
              />
            </Stack>
          </FavoritesProvider>
        </CartProvider>
      </UserProvider>
    </AuthProvider>
  );
}