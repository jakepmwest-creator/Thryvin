/**
 * Storage Module - Handles data persistence properly
 * 
 * SecureStore: For small secrets only (tokens, user IDs, session IDs)
 * AsyncStorage: For large data (workouts, badges, settings)
 * 
 * This solves the "SecureStore value larger than 2048 bytes" warning
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys that MUST use SecureStore (small secrets only)
const SECURE_KEYS = [
  'user_email',
  'user_password', 
  'user_pin',
  'biometric_enabled',
  'biometric_email',
  'biometric_token',
];

// Helper to determine if a key should use SecureStore
function shouldUseSecureStore(key: string): boolean {
  return SECURE_KEYS.includes(key);
}

/**
 * Get storage item - automatically chooses correct storage
 */
export async function getStorageItem(key: string): Promise<string | null> {
  try {
    if (shouldUseSecureStore(key)) {
      return await SecureStore.getItemAsync(key);
    } else {
      return await AsyncStorage.getItem(key);
    }
  } catch (error) {
    console.warn(`[Storage] Error getting ${key}:`, error);
    // Fallback: try the other storage method
    try {
      if (shouldUseSecureStore(key)) {
        return await AsyncStorage.getItem(key);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch {
      return null;
    }
  }
}

/**
 * Set storage item - automatically chooses correct storage
 * Large data goes to AsyncStorage, small secrets to SecureStore
 */
export async function setStorageItem(key: string, value: string): Promise<void> {
  try {
    // Check value size - SecureStore has 2048 byte limit
    const byteSize = new Blob([value]).size;
    
    if (shouldUseSecureStore(key) && byteSize <= 2000) {
      // Small secret - use SecureStore
      await SecureStore.setItemAsync(key, value);
    } else {
      // Large data OR not a secret - use AsyncStorage
      if (byteSize > 2000 && shouldUseSecureStore(key)) {
        console.warn(`[Storage] Key "${key}" is too large (${byteSize} bytes) for SecureStore, using AsyncStorage`);
      }
      await AsyncStorage.setItem(key, value);
    }
  } catch (error) {
    console.error(`[Storage] Error setting ${key}:`, error);
    // Fallback to AsyncStorage
    try {
      await AsyncStorage.setItem(key, value);
    } catch (fallbackError) {
      console.error(`[Storage] Fallback also failed for ${key}:`, fallbackError);
    }
  }
}

/**
 * Delete storage item - clears from both storages
 */
export async function deleteStorageItem(key: string): Promise<void> {
  try {
    // Delete from both to ensure cleanup
    await SecureStore.deleteItemAsync(key).catch(() => {});
    await AsyncStorage.removeItem(key).catch(() => {});
  } catch (error) {
    console.warn(`[Storage] Error deleting ${key}:`, error);
  }
}

/**
 * Migrate data from SecureStore to AsyncStorage
 * Call this on app startup to fix existing large data in SecureStore
 */
export async function migrateStorage(): Promise<void> {
  const keysToMigrate = [
    'auth_user',
    'week_workouts',
    'week_workouts_date',
    'week_workouts_version',
    'today_workout',
    'today_workout_date',
    'completed_workouts',
    'future_weeks',
    'workout_stats',
    'personal_bests',
    'user_badges',
    'user_badges_v3',
    'advancedQuestionnaire',
    'advancedQuestionnaireSkipped',
    'coach_name',
    'coach_personality',
  ];
  
  console.log('[Storage] Checking for data migration...');
  
  for (const key of keysToMigrate) {
    try {
      // Check if data exists in SecureStore
      const secureData = await SecureStore.getItemAsync(key).catch(() => null);
      
      if (secureData) {
        // Check if it's too large for SecureStore
        const byteSize = new Blob([secureData]).size;
        
        if (byteSize > 2000) {
          console.log(`[Storage] Migrating ${key} (${byteSize} bytes) from SecureStore to AsyncStorage`);
          
          // Move to AsyncStorage
          await AsyncStorage.setItem(key, secureData);
          
          // Remove from SecureStore
          await SecureStore.deleteItemAsync(key).catch(() => {});
        }
      }
    } catch (error) {
      // Ignore migration errors for individual keys
    }
  }
  
  console.log('[Storage] Migration check complete');
}

/**
 * Clear all app data (for logout)
 */
export async function clearAllStorage(): Promise<void> {
  console.log('[Storage] Clearing all app data...');
  
  const allKeys = [
    'auth_user', 'user_email', 'user_password', 'user_pin',
    'week_workouts', 'week_workouts_date', 'week_workouts_version',
    'today_workout', 'today_workout_date', 'completed_workouts',
    'future_weeks', 'workout_stats', 'personal_bests',
    'biometric_enabled', 'biometrics_enabled', 'biometric_email', 'biometric_token',
    'user_badges', 'user_badges_v3',
    'advancedQuestionnaire', 'advancedQuestionnaireSkipped',
    'tourCompleted', 'tourSkipped',
    'notifications_enabled', 'workout_reminders_enabled',
    'pin_enabled',
    'weeklyScheduleCheckSnoozed', 'lastWeeklyScheduleCheck', 'currentWeekDays',
    'user_profile_image', 'user_bio', 'user_name',
    'coach_name', 'coach_personality',
  ];
  
  for (const key of allKeys) {
    await deleteStorageItem(key);
  }
  
  console.log('[Storage] All data cleared');
}
