import React from 'react';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Palette } from '@/constants/Colors';
import { Typography } from '@/constants/Theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Palette.forestGreen,
        tabBarInactiveTintColor: Palette.mutedGrayGreen,
        tabBarStyle: {
          backgroundColor: Palette.paperWhite,
          borderTopColor: Palette.subtleBorder,
          borderTopWidth: 1.5,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontFamily: Typography.fontFamily.mono,
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.5,
        },
        headerStyle: {
          backgroundColor: Palette.paperWhite,
          borderBottomWidth: 1,
          borderBottomColor: Palette.subtleBorder,
        },
        headerTitleStyle: {
          fontFamily: Typography.fontFamily.serif,
          fontSize: Typography.fontSize.titleSm,
          fontWeight: '700',
          color: Palette.charcoal,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Feather name="home" color={color as string} size={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          headerTitle: 'Service Directory',
          tabBarIcon: ({ color }) => (
            <Feather name="search" color={color as string} size={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          headerTitle: 'Active Work Orders',
          tabBarIcon: ({ color }) => (
            <Feather name="file-text" color={color as string} size={20} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: 'Account & Settings',
          tabBarIcon: ({ color }) => (
            <Feather name="user" color={color as string} size={20} />
          ),
        }}
      />
      {/* Hide two.tsx from tab list if still present */}
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
