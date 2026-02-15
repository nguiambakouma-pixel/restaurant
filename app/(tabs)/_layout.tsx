import { Tabs } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next'; // Import useTranslation

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ff6b35',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#333',
          borderTopWidth: 1,
          height: 90,
          paddingBottom: 30,
          paddingTop: 10,
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
          title: t('tabs.home'),
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={24} name="house.fill" color={focused ? '#ff6b35' : '#999'} />
          ),
          tabBarButton: HapticTab,
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: t('tabs.menu'),
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={24} name="fork.knife" color={focused ? '#ff6b35' : '#999'} />
          ),
          tabBarButton: HapticTab,
        }}
      />

      <Tabs.Screen
        name="favorites"
        options={{
          title: t('tabs.favorites'),
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={24} name="heart.fill" color={focused ? '#ff6b35' : '#999'} />
          ),
          tabBarButton: HapticTab,
        }}
      />

      <Tabs.Screen
        name="loyalty"
        options={{
          title: 'Fidélité',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={24} name="star.fill" color={focused ? '#ff6b35' : '#999'} />
          ),
          tabBarButton: HapticTab,
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: t('tabs.cart'),
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={24} name="cart.fill" color={focused ? '#ff6b35' : '#999'} />
          ),
          tabBarButton: HapticTab,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
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

      <Tabs.Screen
        name="edit-profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}