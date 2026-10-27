import { Tabs } from 'expo-router';
import { Icon } from '@/components/Icon';
import { COLORS } from '@/components/theme';

export default function GameTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.bgElev,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 58,
          paddingBottom: 4,
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textMute,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Республика',
          tabBarIcon: ({ color, size }) => <Icon name="Flag" size={size} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="economy"
        options={{
          title: 'Экономика',
          tabBarIcon: ({ color, size }) => <Icon name="Coins" size={size} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="army"
        options={{
          title: 'Армия',
          tabBarIcon: ({ color, size }) => <Icon name="Sword" size={size} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="diplomacy"
        options={{
          title: 'Дипломатия',
          tabBarIcon: ({ color, size }) => <Icon name="Globe" size={size} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="manage"
        options={{
          title: 'Управление',
          tabBarIcon: ({ color, size }) => <Icon name="PieChart" size={size} color={String(color)} />,
        }}
      />
    </Tabs>
  );
}
