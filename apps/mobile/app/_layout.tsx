import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '@/constants/theme';
import { ToastProvider } from '@/components/Toast';

export default function RootLayout() {
  return (
    <ToastProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.deepOcean },
          headerTintColor: COLORS.white,
          headerTitleStyle: { fontWeight: '600' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="guide/[slug]" options={{ title: 'Species Guide', animation: 'slide_from_right' }} />
        <Stack.Screen name="education/[slug]" options={{ title: 'Article', animation: 'slide_from_right' }} />
        <Stack.Screen name="sound/record" options={{ title: 'Record Sound', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="sighting/capture" options={{ title: 'Capture Sighting', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="events/[slug]" options={{ title: 'Event Details', animation: 'slide_from_right' }} />
        <Stack.Screen name="map/index" options={{ title: 'Ocean Map', headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="search/index" options={{ title: 'Search', animation: 'fade_from_bottom' }} />
        <Stack.Screen name="emergency/index" options={{ title: 'Emergency', headerStyle: { backgroundColor: '#DC2626' }, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="recognition/score" options={{ title: 'My Score', animation: 'slide_from_right' }} />
        <Stack.Screen name="recognition/leaderboard" options={{ title: 'Leaderboard', animation: 'slide_from_right' }} />
        <Stack.Screen name="recognition/village" options={{ title: 'Village Rankings', animation: 'slide_from_right' }} />
        <Stack.Screen name="guide/index" options={{ title: 'Ocean Guides', animation: 'slide_from_right' }} />
        <Stack.Screen name="education/index" options={{ title: 'Education', animation: 'slide_from_right' }} />
        <Stack.Screen name="education/create" options={{ title: 'Create Article', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="sound/index" options={{ title: 'Ocean Sounds', animation: 'slide_from_right' }} />
        <Stack.Screen name="sighting/index" options={{ title: 'Marine Sightings', animation: 'slide_from_right' }} />
        <Stack.Screen name="events/index" options={{ title: 'Events', animation: 'slide_from_right' }} />
        <Stack.Screen name="events/create" options={{ title: 'Create Event', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="catches/index" options={{ title: 'Fish Catch', animation: 'slide_from_right' }} />
        <Stack.Screen name="observations/index" options={{ title: 'Observations', animation: 'slide_from_right' }} />
        <Stack.Screen name="cleanups/index" options={{ title: 'Beach Clean-ups', animation: 'slide_from_right' }} />
        <Stack.Screen name="contribute/index" options={{ title: 'Contribute', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="community/members" options={{ title: 'Community Members', animation: 'slide_from_right' }} />
        <Stack.Screen name="economy/index" options={{ title: 'Circular Economy', animation: 'slide_from_right' }} />
        <Stack.Screen name="ecotourism/index" options={{ title: 'Ecotourism', animation: 'slide_from_right' }} />
        <Stack.Screen name="ecotourism/[id]" options={{ title: 'Experience', animation: 'slide_from_right' }} />
        <Stack.Screen name="ecotourism/packages/[id]" options={{ title: 'Package', animation: 'slide_from_right' }} />
        <Stack.Screen name="ecotourism/checkout" options={{ title: 'Checkout', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="ecotourism/bookings" options={{ title: 'My Bookings', animation: 'slide_from_right' }} />
        <Stack.Screen name="marketplace/index" options={{ title: 'Marketplace', animation: 'slide_from_right' }} />
        <Stack.Screen name="marketplace/[slug]" options={{ title: 'Product', animation: 'slide_from_right' }} />
        <Stack.Screen name="marketplace/vendor/[slug]" options={{ title: 'Vendor', animation: 'slide_from_right' }} />
        <Stack.Screen name="marketplace/cart" options={{ title: 'Cart', animation: 'slide_from_right' }} />
        <Stack.Screen name="marketplace/checkout" options={{ title: 'Checkout', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="marketplace/orders" options={{ title: 'Orders', animation: 'slide_from_right' }} />
        <Stack.Screen name="guide/species/[slug]" options={{ title: 'Species', animation: 'slide_from_right' }} />
        <Stack.Screen name="sighting/[slug]" options={{ title: 'Sighting Details', animation: 'slide_from_right' }} />
        <Stack.Screen name="sound/library/index" options={{ title: 'Sound Library', animation: 'slide_from_right' }} />
        <Stack.Screen name="sound/library/[slug]" options={{ title: 'Sound Library', animation: 'slide_from_right' }} />
        <Stack.Screen name="sound/item/[slug]" options={{ title: 'Sound Details', animation: 'slide_from_right' }} />
        <Stack.Screen name="_sitemap" options={{ title: 'Sitemap', presentation: 'modal' }} />
      </Stack>
    </ToastProvider>
  );
}
