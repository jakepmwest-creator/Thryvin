import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSubscriptionStore } from '../src/stores/subscription-store';
import { LegalModal } from '../src/components/LegalModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  accent: '#A22BF6',
  accentSecondary: '#FF4EC7',
  white: '#FFFFFF',
  background: '#F8F9FA',
  text: '#222222',
  textSecondary: '#8E8E93',
  textMuted: '#C7C7CC',
  border: '#E5E5EA',
  success: '#34C759',
  cardBg: '#FFFFFF',
};

const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '7.99',
    period: '/month',
    savings: null,
    popular: false,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '74.99',
    period: '/year',
    savings: 'Save 22%',
    popular: true,
    monthlyEquiv: '6.25',
  },
];

const INCLUDED_FEATURES = [
  { icon: 'infinite', text: 'Unlimited AI-generated workout plans' },
  { icon: 'refresh', text: 'Rolling plan regeneration every 3 weeks' },
  { icon: 'analytics', text: 'Deep exercise stats & trends' },
  { icon: 'create', text: 'Edit & customise any workout' },
  { icon: 'flash', text: 'Drop, super & giant set support' },
  { icon: 'headset', text: 'Priority support' },
  { icon: 'sparkles', text: 'Nutrition & social features', subtitle: 'Coming soon' },
];

export default function BillingScreen() {
  const router = useRouter();
  const { isPro, nativeAvailable, setTestPro } = useSubscriptionStore();
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [processing, setProcessing] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleSubscribe = async () => {
    setProcessing(true);

    if (nativeAvailable) {
      // Real RevenueCat purchase flow would go here
      Alert.alert(
        'RevenueCat',
        'Native purchase flow will be available in the development build.',
        [{ text: 'OK' }],
      );
      setProcessing(false);
      return;
    }

    // Test mode: simulate subscription
    setTimeout(() => {
      setTestPro(true);
      setProcessing(false);
      Alert.alert(
        'Welcome to Pro!',
        "You're now a Thryvin' Pro member. Enjoy all the premium features!",
        [{ text: 'Let\'s go!', onPress: () => router.back() }],
      );
    }, 1200);
  };

  const handleManage = () => {
    if (nativeAvailable) {
      Alert.alert('Manage', 'This will open your App Store subscription settings.');
    } else {
      Alert.alert(
        'Downgrade to Standard?',
        'You\'ll lose access to Pro features at the end of your current period.',
        [
          { text: 'Keep Pro', style: 'cancel' },
          {
            text: 'Downgrade',
            style: 'destructive',
            onPress: () => {
              setTestPro(false);
              router.back();
            },
          },
        ],
      );
    }
  };

  const handleRestore = () => {
    if (nativeAvailable) {
      Alert.alert('Restore', 'Checking for previous purchases...');
    } else {
      Alert.alert('Restore', 'Restore is available in the native app build.');
    }
  };

  const selected = PLANS.find((p) => p.id === selectedPlan)!;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          data-testid="billing-back-button"
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isPro ? 'Your Subscription' : 'Upgrade to Pro'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Pro badge */}
        <View style={styles.badgeRow}>
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentSecondary]}
            style={styles.badge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="star" size={20} color={COLORS.white} />
          </LinearGradient>
          <View style={styles.badgeTextContainer}>
            <Text style={styles.badgeTitle}>Thryvin' Pro</Text>
            <Text style={styles.badgeSubtitle}>
              {isPro
                ? 'Your subscription is active'
                : 'Train smarter. Recover better. Progress faster.'}
            </Text>
          </View>
        </View>

        {/* Plan selector — only show if NOT already Pro */}
        {!isPro && (
          <>
            <Text style={styles.sectionTitle}>Choose your plan</Text>
            <View style={styles.planGrid}>
              {PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.planCard,
                      isSelected && styles.planCardSelected,
                    ]}
                    onPress={() => setSelectedPlan(plan.id)}
                    activeOpacity={0.8}
                    data-testid={`billing-plan-${plan.id}`}
                  >
                    {plan.popular && (
                      <View style={styles.popularTag}>
                        <Text style={styles.popularTagText}>Best Value</Text>
                      </View>
                    )}
                    {plan.savings && (
                      <View style={styles.savingsTag}>
                        <Text style={styles.savingsTagText}>{plan.savings}</Text>
                      </View>
                    )}
                    <Text
                      style={[
                        styles.planName,
                        isSelected && styles.planNameSelected,
                      ]}
                    >
                      {plan.name}
                    </Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.currency}>£</Text>
                      <Text
                        style={[
                          styles.planPrice,
                          isSelected && styles.planPriceSelected,
                        ]}
                      >
                        {plan.monthlyEquiv || plan.price}
                      </Text>
                    </View>
                    <Text style={styles.planPeriod}>/month</Text>
                    {plan.monthlyEquiv && (
                      <Text style={styles.monthlyEquiv}>
                        Billed £{plan.price}{plan.period}
                      </Text>
                    )}
                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color={COLORS.accent}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Active subscription info — show when Pro */}
        {isPro && (
          <View style={styles.activeCard}>
            <View style={styles.activeRow}>
              <View style={styles.activeDot} />
              <Text style={styles.activeLabel}>Active</Text>
            </View>
            <Text style={styles.activePlan}>Pro Plan</Text>
            <Text style={styles.activeInfo}>
              Your Pro benefits are fully unlocked. Manage or cancel anytime.
            </Text>
            <TouchableOpacity
              style={styles.manageButton}
              onPress={handleManage}
              data-testid="billing-manage-button"
            >
              <Text style={styles.manageButtonText}>Manage Subscription</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* What's included */}
        <Text style={styles.sectionTitle}>What's included</Text>
        <View style={styles.featuresList}>
          {INCLUDED_FEATURES.map((f) => (
            <View key={f.text} style={styles.featureRow}>
              <LinearGradient
                colors={[COLORS.accent, COLORS.accentSecondary]}
                style={styles.featureIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name={f.icon as any} size={16} color={COLORS.white} />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureText}>{f.text}</Text>
                {'subtitle' in f && f.subtitle ? (
                  <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 1 }}>{f.subtitle}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        {!isPro && (
          <TouchableOpacity
            style={[styles.ctaButton, processing && { opacity: 0.7 }]}
            onPress={handleSubscribe}
            disabled={processing}
            activeOpacity={0.85}
            data-testid="billing-subscribe-button"
          >
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentSecondary]}
              style={styles.ctaGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="star" size={18} color={COLORS.white} />
              <Text style={styles.ctaText}>
                {processing
                  ? 'Processing...'
                  : `Subscribe — £${selected.monthlyEquiv || selected.price}/mo`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Footer links */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleRestore} data-testid="billing-restore-button">
            <Text style={styles.footerLink}>Restore purchases</Text>
          </TouchableOpacity>
          <Text style={styles.footerDivider}>|</Text>
          <TouchableOpacity onPress={() => setShowTerms(true)} data-testid="billing-terms-button">
            <Text style={styles.footerLink}>Terms of Use</Text>
          </TouchableOpacity>
          <Text style={styles.footerDivider}>|</Text>
          <TouchableOpacity onPress={() => setShowPrivacy(true)} data-testid="billing-privacy-button">
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          Payment will be charged to your Apple ID or Google Play account. Subscription
          automatically renews unless cancelled at least 24 hours before the end of the
          current period. Manage or cancel in your device settings.
        </Text>
      </ScrollView>

      <LegalModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} type="privacy" />
      <LegalModal visible={showTerms} onClose={() => setShowTerms(false)} type="terms" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  /* Badge */
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    gap: 14,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTextContainer: {
    flex: 1,
  },
  badgeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  badgeSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  /* Section */
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
    marginTop: 8,
  },

  /* Plan cards — Thriven Style */
  planGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  planCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2A2A2A',
    position: 'relative',
    overflow: 'visible',
  },
  planCardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: '#1A1025',
  },
  popularTag: {
    position: 'absolute',
    top: -10,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 1,
  },
  popularTagText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  savingsTag: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
    marginTop: 8,
  },
  savingsTagText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '700',
  },
  planName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9E9E9E',
    marginBottom: 8,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  planNameSelected: {
    color: COLORS.white,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currency: {
    fontSize: 16,
    fontWeight: '700',
    color: '#CCCCCC',
    marginTop: 4,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
  },
  planPriceSelected: {
    color: COLORS.white,
  },
  planPeriod: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
  },
  monthlyEquiv: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '600',
    marginTop: 6,
  },
  checkCircle: {
    position: 'absolute',
    top: 10,
    right: 10,
  },

  /* Active subscription card */
  activeCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  activeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.success,
  },
  activePlan: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  activeInfo: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  manageButton: {
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
  },

  /* Features */
  featuresList: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
    fontWeight: '500',
  },

  /* CTA */
  ctaButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },

  /* Footer */
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  footerLink: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '500',
  },
  footerDivider: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  disclaimer: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
  },
});
