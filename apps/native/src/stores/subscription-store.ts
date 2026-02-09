import { create } from 'zustand';
import Purchases, { CustomerInfo, LOG_LEVEL, PurchasesOfferings } from 'react-native-purchases';
import RevenueCatUI, { CUSTOMER_CENTER_RESULT, PAYWALL_RESULT } from 'react-native-purchases-ui';
import { REVENUECAT_API_KEY, isThryvinProActive } from '../services/revenuecat';

interface SubscriptionState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOfferings | null;
  isPro: boolean;
  initialize: (appUserId?: string | null) => Promise<void>;
  setAppUser: (appUserId?: string | null) => Promise<void>;
  refreshCustomerInfo: () => Promise<void>;
  fetchOfferings: () => Promise<void>;
  presentPaywall: () => Promise<PAYWALL_RESULT | null>;
  presentCustomerCenter: () => Promise<CUSTOMER_CENTER_RESULT | null>;
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

    if (!REVENUECAT_API_KEY) {
      set({ error: 'RevenueCat API key missing. Please restart the app.' });
      return;
    }

    try {
      set({ isLoading: true, error: null });
      await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      await Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
      });

      Purchases.addCustomerInfoUpdateListener((info) => {
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
        error: error?.message || 'Failed to initialize subscriptions',
        isLoading: false,
      });
    }
  },

  setAppUser: async (appUserId?: string | null) => {
    try {
      if (!get().isInitialized) return;
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
    try {
      const info = await Purchases.getCustomerInfo();
      set({ customerInfo: info, isPro: isThryvinProActive(info) });
    } catch (error: any) {
      console.error('RevenueCat customer info error:', error);
      set({ error: error?.message || 'Failed to fetch subscription info' });
    }
  },

  fetchOfferings: async () => {
    try {
      const offerings = await Purchases.getOfferings();
      set({ offerings });
    } catch (error: any) {
      console.error('RevenueCat offerings error:', error);
      set({ error: error?.message || 'Failed to load offerings' });
    }
  },

  presentPaywall: async () => {
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

