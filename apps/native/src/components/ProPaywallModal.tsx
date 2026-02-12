import React, { useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptionStore } from '../stores/subscription-store';

let RevenueCatUI: any = null;
try {
  RevenueCatUI = require('react-native-purchases-ui').default;
} catch (e) {
  // Not available in Expo Go
}

const COLORS = {
  gradientStart: '#8B5CF6',
  gradientEnd: '#EC4899',
  background: '#0F0F1A',
  card: '#1B1B2E',
  text: '#FFFFFF',
  muted: '#A0A0B0',
};

const PRO_FEATURES = [
  { icon: 'infinite' as const, text: 'Unlimited AI-generated plans' },
  { icon: 'analytics' as const, text: 'Advanced progress analytics' },
  { icon: 'bulb' as const, text: 'Coach-level insights & tips' },
  { icon: 'flash' as const, text: 'Priority support + pro workouts' },
  { icon: 'refresh' as const, text: 'Rolling plan regeneration' },
  { icon: 'create' as const, text: 'Edit & customise any workout' },
];

interface ProPaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ProPaywallModal = ({ visible, onClose }: ProPaywallModalProps) => {
  const { offerings, fetchOfferings, refreshCustomerInfo, nativeAvailable, setTestPro } = useSubscriptionStore();

  useEffect(() => {
    if (visible && nativeAvailable) {
      fetchOfferings();
    }
  }, [visible, fetchOfferings, nativeAvailable]);

  const showNativePaywall = nativeAvailable && offerings?.current && RevenueCatUI?.Paywall;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            style={styles.header}
          >
            <TouchableOpacity onPress={onClose} style={styles.closeButton} data-testid="pro-paywall-close">
              <Ionicons name="close" size={20} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Thryvin' Pro</Text>
            <Text style={styles.headerSubtitle}>Unlock everything your training deserves</Text>
          </LinearGradient>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.featureCard}>
              {PRO_FEATURES.map((feature) => (
                <View key={feature.text} style={styles.featureRow}>
                  <Ionicons name={feature.icon} size={18} color={COLORS.gradientEnd} />
                  <Text style={styles.featureText}>{feature.text}</Text>
                </View>
              ))}
            </View>

            {showNativePaywall ? (
              <View style={styles.paywallWrapper}>
                <RevenueCatUI.Paywall
                  options={{ offering: offerings.current }}
                  onPurchaseCompleted={async () => {
                    await refreshCustomerInfo();
                    onClose();
                  }}
                  onRestoreCompleted={async () => {
                    await refreshCustomerInfo();
                    onClose();
                  }}
                  onDismiss={onClose}
                />
              </View>
            ) : (
              /* Mock paywall for Expo Go / test mode */
              <View style={styles.mockPaywall}>
                <View style={styles.pricingCard}>
                  <Text style={styles.pricingBadge}>MOST POPULAR</Text>
                  <Text style={styles.pricingTitle}>Annual</Text>
                  <Text style={styles.pricingPrice}>
                    <Text style={styles.pricingCurrency}>From </Text>
                    £4.99<Text style={styles.pricingPeriod}>/mo</Text>
                  </Text>
                  <Text style={styles.pricingSave}>Save 40% vs monthly</Text>
                </View>

                <View style={[styles.pricingCard, styles.pricingCardAlt]}>
                  <Text style={styles.pricingTitle}>Monthly</Text>
                  <Text style={styles.pricingPrice}>
                    £7.99<Text style={styles.pricingPeriod}>/mo</Text>
                  </Text>
                  <Text style={styles.pricingSave}>Cancel anytime</Text>
                </View>

                <TouchableOpacity
                  style={styles.mockPurchaseButton}
                  onPress={() => {
                    setTestPro(true);
                    onClose();
                  }}
                  data-testid="mock-purchase-pro"
                >
                  <LinearGradient
                    colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                    style={styles.mockPurchaseGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="star" size={18} color="#fff" />
                    <Text style={styles.mockPurchaseText}>Upgrade to Pro (Test)</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.mockNote}>
                  In-app purchases will be available in the production build.
                  Tap above to simulate upgrading.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '92%',
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    padding: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 4,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  headerSubtitle: {
    color: COLORS.text,
    opacity: 0.85,
    marginTop: 6,
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  featureCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    color: COLORS.text,
    fontSize: 14,
  },
  paywallWrapper: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 12,
  },
  // Mock paywall styles
  mockPaywall: {
    gap: 12,
  },
  pricingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: COLORS.gradientEnd,
    alignItems: 'center',
  },
  pricingCardAlt: {
    borderColor: `${COLORS.muted}40`,
  },
  pricingBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.gradientEnd,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  pricingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  pricingPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  pricingCurrency: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.muted,
  },
  pricingPeriod: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.muted,
  },
  pricingSave: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
  },
  mockPurchaseButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
  },
  mockPurchaseGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  mockPurchaseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  mockNote: {
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default ProPaywallModal;
