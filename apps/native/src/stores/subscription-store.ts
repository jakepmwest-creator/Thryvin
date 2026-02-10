import { create } from 'zustand';
import { REVENUECAT_API_KEY, isThryvinProActive } from '../services/revenuecat';

// RevenueCat native modules may not be available in Expo Go
let Purchases: any = null;
let RevenueCatUI: any = null;
let PAYWALL_RESULT: any = {};
let CUSTOMER_CENTER_RESULT: any = {};
let LOG_LEVEL: any = {};

try {
  const purchasesModule = require('react-native-purchases');
  Purchases = purchasesModule.default;
  LOG_LEVEL = purchasesModule.LOG_LEVEL;
} catch (e) {
  console.warn('[Subscriptions] react-native-purchases not available (Expo Go?)');
}

try {
  const uiModule = require('react-native-purchases-ui');
  RevenueCatUI = uiModule.default;
  PAYWALL_RESULT = uiModule.PAYWALL_RESULT;
  CUSTOMER_CENTER_RESULT = uiModule.CUSTOMER_CENTER_RESULT;
} catch (e) {
  console.warn('[Subscriptions] react-native-purchases-ui not available (Expo Go?)');
}

interface SubscriptionState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  customerInfo: any | null;
  offerings: any | null;
  isPro: boolean;
  initialize: (appUserId?: string | null) => Promise<void>;
  setAppUser: (appUserId?: string | null) => Promise<void>;
  refreshCustomerInfo: () => Promise<void>;
  fetchOfferings: () => Promise<void>;
  presentPaywall: () => Promise<any>;
  presentCustomerCenter: () => Promise<any>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  isInitialized: false,
  isLoading: false,
  error: null,
  customerInfo: null,
  offerings: null,
  isPro: false,

  initialize: async (appUserId?: string | null) => {
    if (get().isInitialized) {
      await get().setAppUser(appUserId);
      return;
    }

    if (!Purchases) {
      console.warn('[Subscriptions] RevenueCat SDK not available — running in Standard mode');
      set({ isInitialized: true, isLoading: false, isPro: false });
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
        set({
          customerInfo: info,
          isPro: isThryvinProActive(info),
        });
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
      console.error('RevenueCat init error:', error);
      set({
        isInitialized: true,
        error: error?.message || 'Failed to initialize subscriptions',
        isLoading: false,
        isPro: false,
      });
    }
  },

  setAppUser: async (appUserId?: string | null) => {
    if (!Purchases || !get().isInitialized) return;
    try {
      if (appUserId) {
        await Purchases.logIn(String(appUserId));
      } else {
        await Purchases.logOut();
      }
      await get().refreshCustomerInfo();
    } catch (error: any) {
      console.error('RevenueCat setAppUser error:', error);
      set({ error: error?.message || 'Failed to sync subscription user' });
    }
  },

  refreshCustomerInfo: async () => {
    if (!Purchases) return;
    try {
      const info = await Purchases.getCustomerInfo();
      set({ customerInfo: info, isPro: isThryvinProActive(info) });
    } catch (error: any) {
      console.error('RevenueCat customer info error:', error);
      set({ error: error?.message || 'Failed to fetch subscription info' });
    }
  },

  fetchOfferings: async () => {
    if (!Purchases) return;
    try {
      const offerings = await Purchases.getOfferings();
      set({ offerings });
    } catch (error: any) {
      console.error('RevenueCat offerings error:', error);
      set({ error: error?.message || 'Failed to load offerings' });
    }
  },

  presentPaywall: async () => {
    if (!RevenueCatUI) {
      console.warn('[Subscriptions] Paywall not available in Expo Go');
      return null;
    }
    try {
      const result = await RevenueCatUI.presentPaywall();
      await get().refreshCustomerInfo();
      return result;
    } catch (error: any) {
      console.error('RevenueCat paywall error:', error);
      set({ error: error?.message || 'Failed to present paywall' });
      return null;
    }
  },

  presentCustomerCenter: async () => {
    if (!RevenueCatUI) {
      console.warn('[Subscriptions] Customer center not available in Expo Go');
      return null;
    }
    try {
      const result = await RevenueCatUI.presentCustomerCenter();
      await get().refreshCustomerInfo();
      return result;
    } catch (error: any) {
      console.error('RevenueCat customer center error:', error);
      set({ error: error?.message || 'Failed to open customer center' });
      return null;
    }
  },
}));
