import { Tabs } from 'expo-router';
import { Text, Image, View } from 'react-native';
import { COLORS, FONT_SIZE } from '@/constants/theme';
import { t } from '@/i18n';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.oceanBlue,
        tabBarInactiveTintColor: COLORS.gray[400],
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.gray[200],
          height: 88,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: FONT_SIZE.xs,
          fontWeight: '500',
        },
        headerStyle: { backgroundColor: COLORS.deepOcean },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('home'),
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Image
                source={require('@/assets/logo.png')}
                style={{ width: 40, height: 28, borderRadius: 4 }}
                resizeMode="contain"
              />
              <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: '700', letterSpacing: 0.5 }}>One Ocean One Life</Text>
            </View>
          ),
          tabBarIcon: ({ color }: { color: string }) => <Text style={{ fontSize: 20, color }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t('explore'),
          tabBarIcon: ({ color }: { color: string }) => <Text style={{ fontSize: 20, color }}>🧭</Text>,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: t('contribute'),
          tabBarIcon: ({ color }: { color: string }) => <Text style={{ fontSize: 24, color }}>➕</Text>,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: t('community'),
          tabBarIcon: ({ color }: { color: string }) => <Text style={{ fontSize: 20, color }}>👥</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ color }: { color: string }) => <Text style={{ fontSize: 20, color }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
