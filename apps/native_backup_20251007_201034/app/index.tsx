import { Text, View } from 'react-native';
import { useEffect } from 'react';

export default function Index() {
  useEffect(() => {
    console.log('[NATIVE_BOOT] If you see this, bundle loaded');
  }, []);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 18 }}>✅ If you see this screen, the bundle loaded.</Text>
    </View>
  );
}
