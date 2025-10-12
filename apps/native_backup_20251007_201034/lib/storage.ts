// apps/native/lib/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function saveJson(key: string, value: unknown) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
  console.log('[CACHE_SAVE]', key);
}

export async function loadJson<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  const val = raw ? (JSON.parse(raw) as T) : null;
  console.log('[CACHE_HIT?]', key, !!val);
  return val;
}

export async function remove(key: string) {
  await AsyncStorage.removeItem(key);
  console.log('[CACHE_REMOVE]', key);
}

export async function clearAllWorkoutCache() {
  const keys = await AsyncStorage.getAllKeys();
  const wk = keys.filter(k => k.startsWith('workout:'));
  await AsyncStorage.multiRemove(wk);
  console.log('[CACHE_CLEAR]', wk.length);
}
