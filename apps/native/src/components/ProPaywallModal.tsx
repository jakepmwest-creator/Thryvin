import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptionStore } from '../stores/subscription-store';

let RevenueCatUI: any = null;
try {
  RevenueCatUI = require('react-native-purchases-ui').default;
} catch (e) {}

const { width } = Dimensions.get('window');

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

// ── Standard tier features (grayed out, basic) ──────────────────────────────
const STANDARD_FEATURES: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string; future?: boolean }[] = [
  { icon: 'barbell-outline',          text: 'Basic AI workout plans' },
  { icon: 'chatbubble-outline',       text: 'Limited coach chat' },
  { icon: 'library-outline',          text: 'Full exercise library' },
  { icon: 'heart-outline',            text: 'Favourite up to 3 exercises' },
  { icon: 'stats-chart-outline',      text: 'Basic stats' },
  { icon: 'trophy-outline',           text: 'Awards & achievements' },
  { icon: 'checkmark-circle-outline', text: 'Monthly check-ins' },
  { icon: 'people-outline',           text: 'Basic social access', future: true },
];

// ── Pro tier features (vibrant, split for visual density) ───────────────────
const PRO_FEATURES: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string; subtitle?: string; future?: boolean }[] = [
  { icon: 'infinite',             text: 'Unlimited AI plan generation' },
  { icon: 'barbell',              text: 'Full set types included', subtitle: 'Drop sets, super sets & giant sets' },
  { icon: 'create',               text: 'Edit & customise any workout' },
  { icon: 'sparkles',             text: 'AI learns your preferences' },
  { icon: 'checkmark-circle',     text: 'Weekly check-ins with AI PT feedback' },
  { icon: 'document-text',        text: 'Full plan overview & explanation' },
  { icon: 'chatbubble-ellipses',  text: 'Unlimited coach chat' },
  { icon: 'stats-chart',          text: 'Full stats & analytics' },
  { icon: 'podium',               text: 'All personal bests & graphs' },
  { icon: 'cloud-download',       text: 'Offline access' },
  { icon: 'download',             text: 'Data export' },
  { icon: 'restaurant',           text: 'Nutrition tracking', future: true },
  { icon: 'people',               text: 'Full community & social',       future: true },
];

interface ProPaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ProPaywallModal = ({ visible, onClose }: ProPaywallModalProps) => {
  const { offerings, fetchOfferings, refreshCustomerInfo, nativeAvailable } = useSubscriptionStore();

  useEffect(() => {
    if (visible && nativeAvailable) fetchOfferings();
  }, [visible, fetchOfferings, nativeAvailable]);

  const showNativePaywall = nativeAvailable && offerings?.current && RevenueCatUI?.Paywall;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Top gradient bar */}
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentSecondary]}
            style={styles.accentBar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} data-testid="pro-paywall-close">
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentSecondary]}
              style={styles.headerIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="star" size={24} color={COLORS.white} />
            </LinearGradient>
            <Text style={styles.headerTitle}>Upgrade to Pro</Text>
            <Text style={styles.headerSubtitle}>Unlock everything your training deserves</Text>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

            {/* ── Tier comparison cards ───────────────────────────── */}
            <View style={styles.tierRow}>

              {/* Standard card */}
              <View style={styles.standardCard}>
                <View style={styles.tierHeader}>
                  <Text style={styles.standardTierLabel}>STANDARD</Text>
                  <Text style={styles.standardPrice}>Free</Text>
                  <Text style={styles.standardPriceSub}>Always free</Text>
                </View>
                <View style={styles.divider} />
                {STANDARD_FEATURES.map((f) => (
                  <View key={f.text} style={styles.featureRow}>
                    <Ionicons name={f.icon} size={15} color={COLORS.textMuted} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.standardFeatureText}>{f.text}</Text>
                      {f.future && (
                        <Text style={styles.futureLabel}>Coming soon</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              {/* Pro card */}
              <LinearGradient
                colors={['#7B1FD4', COLORS.accent, COLORS.accentSecondary]}
                style={styles.proCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>BEST VALUE</Text>
                </View>
                <View style={styles.tierHeader}>
                  <Text style={styles.proTierLabel}>PRO</Text>
                  <Text style={styles.proPrice}>
                    £6.25<Text style={styles.proPricePeriod}>/mo</Text>
                  </Text>
                  <Text style={styles.proPriceSub}>Billed annually · or £7.99/mo</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: 'rgba(255,255,255,0.25)' }]} />
                {PRO_FEATURES.map((f) => (
                  <View key={f.text} style={styles.featureRow}>
                    <Ionicons name={f.icon} size={15} color={COLORS.white} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.proFeatureText}>{f.text}</Text>
                      {f.subtitle && !f.future && (
                        <Text style={styles.proFeatureSub}>{f.subtitle}</Text>
                      )}
                      {f.future && (
                        <Text style={styles.proFutureLabel}>Coming soon</Text>
                      )}
                    </View>
                  </View>
                ))}
              </LinearGradient>

            </View>

            {/* ── Trial callout ───────────────────────────────────── */}
            <View style={styles.trialBanner}>
              <Ionicons name="gift-outline" size={18} color={COLORS.accent} />
              <Text style={styles.trialBannerText}>
                <Text style={{ fontWeight: '700' }}>1 month free</Text> when you start Pro — no charge until your trial ends.
              </Text>
            </View>

            {/* ── CTA ─────────────────────────────────────────────── */}
            {showNativePaywall ? (
              <View style={styles.paywallWrapper}>
                <RevenueCatUI.Paywall
                  options={{ offering: offerings.current }}
                  onPurchaseCompleted={async () => { await refreshCustomerInfo(); onClose(); }}
                  onRestoreCompleted={async () => { await refreshCustomerInfo(); onClose(); }}
                  onDismiss={onClose}
                />
              </View>
            ) : (
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={onClose}
                data-testid="paywall-start-trial"
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[COLORS.accent, COLORS.accentSecondary]}
                  style={styles.ctaGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="star" size={18} color={COLORS.white} />
                  <Text style={styles.ctaText}>Start My Free Month</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <Text style={styles.finePrint}>
              Cancel anytime. Billed annually at £75/yr or monthly at £7.99/mo.{'\n'}
              Free trial available once at sign-up only.
            </Text>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '95%',
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  accentBar: { height: 4 },

  // Header
  header: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 12,
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
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 6,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    marginTop: 4,
    fontSize: 13,
    textAlign: 'center',
  },

  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },

  // Tier cards row
  tierRow: {
    flexDirection: 'row',
    gap: 10,
  },

  // Standard card
  standardCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
    opacity: 0.75,
  },
  standardTierLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  standardPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  standardPriceSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 4,
  },
  standardFeatureText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  futureLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: 1,
  },

  // Pro card
  proCard: {
    flex: 1.15,
    borderRadius: 18,
    padding: 14,
    gap: 8,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    right: 12,
    backgroundColor: '#FFD60A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 10,
  },
  bestValueText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#333',
    letterSpacing: 1,
  },
  proTierLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  proPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
  },
  proPricePeriod: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
  },
  proPriceSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
    marginBottom: 4,
  },
  proFeatureText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '500',
  },
  proFeatureSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 1,
  },
  proFutureLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    fontStyle: 'italic',
    marginTop: 1,
  },

  // Shared
  tierHeader: {
    gap: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  // Trial banner
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(162, 43, 246, 0.08)',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(162, 43, 246, 0.2)',
  },
  trialBannerText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },

  // CTA
  ctaButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  ctaText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },

  // Fine print
  finePrint: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },

  paywallWrapper: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 12,
  },
});

export default ProPaywallModal;
