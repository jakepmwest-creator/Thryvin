/**
 * Run this script in your Expo app to reset badges to Starting Line
 * 
 * Instructions:
 * 1. Open app
 * 2. Go to any screen
 * 3. Shake device to open Dev Menu
 * 4. Tap "Debug Remote JS"
 * 5. In Chrome console, paste this script:
 */

// Reset badges script
(async () => {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  
  try {
    // Clear badge data
    await AsyncStorage.removeItem('user_badges_v3');
    await AsyncStorage.removeItem('user_badges');
    
    console.log('✅ Badge data cleared! Please restart the app.');
    alert('Badge data cleared! Please restart the app.');
  } catch (error) {
    console.error('Error clearing badges:', error);
  }
})();
