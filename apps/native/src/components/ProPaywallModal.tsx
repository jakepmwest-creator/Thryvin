import React, { useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSubscriptionStore } from '../stores/subscription-store';

let RevenueCatUI: any = null;
try {
  RevenueCatUI = require('react-native-purchases-ui').default;
} catch (e) {
  // Not available in Expo Go
}

const COLORS = {
  accent: '#A22BF6',
  accentSecondary: '#FF4EC7',
  background: '#FFFFFF',
  cardBg: '#F8F9FA',
  text: '#222222',
  textSecondary: '#8E8E93',
  textMuted: '#C7C7CC',
  border: '#E5E5EA',
  white: '#FFFFFF',
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
  const router = useRouter();

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
          {/* Gradient accent bar at top */}
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentSecondary]}
            style={styles.accentBar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />

          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} data-testid="pro-paywall-close">
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <View style={styles.headerIconContainer}>
              <LinearGradient
                colors={[COLORS.accent, COLORS.accentSecondary]}
                style={styles.headerIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="star" size={24} color={COLORS.white} />
              </LinearGradient>
            </View>
            <Text style={styles.headerTitle}>Thryvin' Pro</Text>
            <Text style={styles.headerSubtitle}>Unlock everything your training deserves</Text>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.featureCard}>
              {PRO_FEATURES.map((feature) => (
                <View key={feature.text} style={styles.featureRow}>
                  <Ionicons name={feature.icon} size={18} color={COLORS.accent} />
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
              /* Navigate to billing page */
              <View style={styles.mockPaywall}>
                <View style={[styles.pricingCard, styles.pricingCardFeatured]}>
                  <LinearGradient
                    colors={[COLORS.accent, COLORS.accentSecondary]}
                    style={styles.pricingBadgeGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.pricingBadgeText}>BEST VALUE</Text>
                  </LinearGradient>
                  <Text style={styles.pricingTitle}>From</Text>
                  <Text style={styles.pricingPrice}>
                    £5.75<Text style={styles.pricingPeriod}>/mo</Text>
                  </Text>
                  <Text style={styles.pricingSave}>Billed annually. Cancel anytime.</Text>
                </View>

                <TouchableOpacity
                  style={styles.mockPurchaseButton}
                  onPress={() => {
                    onClose();
                    router.push('/billing');
                  }}
                  data-testid="paywall-go-to-billing"
                >
                  <LinearGradient
                    colors={[COLORS.accent, COLORS.accentSecondary]}
                    style={styles.mockPurchaseGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="star" size={18} color={COLORS.white} />
                    <Text style={styles.mockPurchaseText}>View Plans & Subscribe</Text>
                  </LinearGradient>
                </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '92%',
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  accentBar: {
    height: 4,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    fontSize: 14,
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  featureCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    color: COLORS.text,
    fontSize: 14,
  },
  paywallWrapper: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 12,
  },
  // Mock paywall styles
  mockPaywall: {
    gap: 12,
  },
  pricingCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  pricingCardFeatured: {
    borderColor: COLORS.accent,
    borderWidth: 2,
  },
  pricingBadgeGradient: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 8,
  },
  pricingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 1.5,
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
    color: COLORS.textSecondary,
  },
  pricingPeriod: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textSecondary,
  },
  pricingSave: {
    fontSize: 12,
    color: COLORS.textSecondary,
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
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  mockNote: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default ProPaywallModal;
