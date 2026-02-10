import { getRevenueCatKey } from './env';

export const REVENUECAT_API_KEY = getRevenueCatKey();
export const THRYVIN_PRO_ENTITLEMENT = "Thryvin' Pro";

export const isThryvinProActive = (customerInfo?: any) => {
  return Boolean(customerInfo?.entitlements?.active?.[THRYVIN_PRO_ENTITLEMENT]);
};

export const getThryvinProEntitlement = (customerInfo?: any) => {
  return customerInfo?.entitlements?.all?.[THRYVIN_PRO_ENTITLEMENT] || null;
};
