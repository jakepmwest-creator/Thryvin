import { CustomerInfo } from 'react-native-purchases';

export const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
export const THRYVIN_PRO_ENTITLEMENT = "Thryvin' Pro";

export const isThryvinProActive = (customerInfo?: CustomerInfo | null) => {
  return Boolean(customerInfo?.entitlements?.active?.[THRYVIN_PRO_ENTITLEMENT]);
};

export const getThryvinProEntitlement = (customerInfo?: CustomerInfo | null) => {
  return customerInfo?.entitlements?.all?.[THRYVIN_PRO_ENTITLEMENT] || null;
};
