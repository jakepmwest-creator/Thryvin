import { create } from 'zustand';
import { REVENUECAT_API_KEY, isThryvinProActive } from '../services/revenuecat';

// RevenueCat native modules may not be available in Expo Go
let Purchases: any = null;
let RevenueCatUI: any = null;
let LOG_LEVEL: any = {};

try {
  const purchasesModule = require('react-native-purchases');
  Purchases = purchasesModule.default;
  LOG_LEVEL = purchasesModule.LOG_LEVEL;
} catch (e) {
  // Native module not available (Expo Go)
}

try {
  const uiModule = require('react-native-purchases-ui');
  RevenueCatUI = uiModule.default;
} catch (e) {
  // Native UI module not available (Expo Go)
}

interface SubscriptionState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  customerInfo: any | null;
  offerings: any | null;
  isPro: boolean;
  isTestMode: boolean;
  nativeAvailable: boolean;
  initialize: (appUserId?: string | null) => Promise<void>;
  setAppUser: (appUserId?: string | null) => Promise<void>;
  refreshCustomerInfo: () => Promise<void>;
  fetchOfferings: () => Promise<void>;
  presentPaywall: () => Promise<any>;
  presentCustomerCenter: () => Promise<any>;
  setTestPro: (isPro: boolean) => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  isInitialized: false,
  isLoading: false,
  error: null,
  customerInfo: null,
  offerings: null,
  isPro: false,
  isTestMode: false,
  nativeAvailable: !!Purchases,

  initialize: async (appUserId?: string | null) => {
    // If in test mode, skip real initialization
    if (get().isTestMode) return;

    if (get().isInitialized) {
      await get().setAppUser(appUserId);
      return;
    }

    if (!Purchases) {
      console.log('[Subscriptions] Native SDK not available — Expo Go mode');
      set({ isInitialized: true, isLoading: false, isPro: false, nativeAvailable: false });
      return;
    }

    if (!REVENUECAT_API_KEY) {
      set({ isInitialized: true, isLoading: false, isPro: false, error: null });
      return;
    }

    try {
      set({ isLoading: true, error: null });
      if (LOG_LEVEL?.DEBUG) {
        await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY });

      Purchases.addCustomerInfoUpdateListener((info: any) => {
        if (!get().isTestMode) {
          set({ customerInfo: info, isPro: isThryvinProActive(info) });
        }
      });

      if (appUserId) {
        await Purchases.logIn(String(appUserId));
      }

      const info = await Purchases.getCustomerInfo();
      const offerings = await Purchases.getOfferings();
      set({
        isInitialized: true,
        customerInfo: info,
        offerings,
        isPro: isThryvinProActive(info),
        isLoading: false,
      });
    } catch (error: any) {
      console.warn('[Subscriptions] Init error (expected in Expo Go):', error?.message);
      set({
        isInitialized: true,
        error: null, // Don't surface this error to the user
        isLoading: false,
        isPro: false,
      });
    }
  },

  setAppUser: async (appUserId?: string | null) => {
    if (!Purchases || !get().isInitialized || get().isTestMode) return;
    try {
      if (appUserId) {
        await Purchases.logIn(String(appUserId));
      } else {
        await Purchases.logOut();
      }
      await get().refreshCustomerInfo();
    } catch (error: any) {
      console.warn('[Subscriptions] setAppUser error:', error?.message);
    }
  },

  refreshCustomerInfo: async () => {
    if (!Purchases || get().isTestMode) return;
    try {
      const info = await Purchases.getCustomerInfo();
      set({ customerInfo: info, isPro: isThryvinProActive(info) });
    } catch (error: any) {
      console.warn('[Subscriptions] Customer info error:', error?.message);
    }
  },

  fetchOfferings: async () => {
    if (!Purchases || get().isTestMode) return;
    try {
      const offerings = await Purchases.getOfferings();
      set({ offerings });
    } catch (error: any) {
      console.warn('[Subscriptions] Offerings error:', error?.message);
    }
  },

  presentPaywall: async () => {
    if (!RevenueCatUI) {
      console.log('[Subscriptions] Paywall not available in Expo Go');
      return null;
    }
    try {
      const result = await RevenueCatUI.presentPaywall();
      await get().refreshCustomerInfo();
      return result;
    } catch (error: any) {
      console.warn('[Subscriptions] Paywall error:', error?.message);
      return null;
    }
  },

  presentCustomerCenter: async () => {
    if (!RevenueCatUI) {
      console.log('[Subscriptions] Customer center not available in Expo Go');
      return null;
    }
    try {
      const result = await RevenueCatUI.presentCustomerCenter();
      await get().refreshCustomerInfo();
      return result;
    } catch (error: any) {
      console.warn('[Subscriptions] Customer center error:', error?.message);
      return null;
    }
  },

  // Test mode: manually toggle Pro/Standard without RevenueCat
  setTestPro: (isPro: boolean) => {
    set({
      isTestMode: true,
      isInitialized: true,
      isLoading: false,
      isPro,
      error: null,
    });
  },
}));
