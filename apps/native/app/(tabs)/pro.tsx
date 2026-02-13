import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSubscriptionStore } from '../../src/stores/subscription-store';
import { ProPaywallModal } from '../../src/components/ProPaywallModal';
import { SubscriptionManagerModal } from '../../src/components/SubscriptionManagerModal';

const COLORS = {
  accent: '#A22BF6',
  accentSecondary: '#FF4EC7',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  border: '#E5E5EA',
};

const STANDARD_FEATURES = [
  'Basic AI workout generation',
  'Workout logging + streaks',
  'Calories + minutes + rings',
  'Awards & badges',
  'Advanced questionnaire',
  'Weekly plan view (read‑only)',
];

const PRO_FEATURES = [
  '2‑week check‑ins + rolling regeneration',
  'Deep exercise stats & trends',
  'Coach personality + richer guidance',
  'Plan editing & workout swaps',
  'Drop/super/giant sets support',
  'Priority support',
  'Nutrition (coming soon)',
];

export default function ProComparisonScreen() {
  const router = useRouter();
  const { isPro } = useSubscriptionStore();
  const [showPaywall, setShowPaywall] = useState(false);
  const [showManage, setShowManage] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} data-testid="pro-back-button">
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Thryvin' Pro</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[COLORS.accent, COLORS.accentSecondary]}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.heroTitle}>Choose how you want to train</Text>
          <Text style={styles.heroSubtitle}>
            Standard keeps you moving. Pro adapts everything to you.
          </Text>
        </LinearGradient>

        <View style={styles.cardRow}>
          <View style={styles.planCard}>
            <Text style={styles.planTitle}>Standard</Text>
            <Text style={styles.planPrice}>Free</Text>
            <View style={styles.featureList}>
              {STANDARD_FEATURES.map(feature => (
                <View key={feature} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.accent} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.planCard, styles.proCard]}>
            <LinearGradient
              colors={[COLORS.accentSecondary, COLORS.accent]}
              style={styles.proHeader}
            >
              <Text style={styles.planTitlePro}>Pro</Text>
              <Text style={styles.planPricePro}>From £x/mo*</Text>
              <Text style={styles.planSubtext}>*Billed annually. Cancel anytime.</Text>
              <View style={styles.planChips}>
                {['Monthly', '3‑Month', 'Yearly'].map((label) => (
                  <View key={label} style={styles.planChip}>
                    <Text style={styles.planChipText}>{label}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
            <View style={styles.featureList}>
              {PRO_FEATURES.map(feature => (
                <View key={feature} style={styles.featureRow}>
                  <Ionicons name="sparkles" size={16} color={COLORS.accentSecondary} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>{isPro ? 'You’re already Pro' : 'Upgrade when you’re ready'}</Text>
          <Text style={styles.ctaSubtitle}>
            {isPro
              ? 'Manage your subscription or explore what’s coming next.'
              : 'Get the full Thryvin experience with smart check‑ins and pro‑level planning.'}
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.push('/billing')}
            data-testid={isPro ? 'pro-compare-manage-button' : 'pro-compare-upgrade-button'}
          >
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentSecondary]}
              style={styles.ctaGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.ctaButtonText}>{isPro ? 'Manage Subscription' : 'Unlock Thryvin\' Pro'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <ProPaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
      <SubscriptionManagerModal visible={showManage} onClose={() => setShowManage(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  hero: {
    padding: 20,
    borderRadius: 18,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 6,
  },
  cardRow: {
    marginTop: 20,
    gap: 16,
  },
  planCard: {
    backgroundColor: COLORS.lightGray,
    padding: 16,
    borderRadius: 16,
  },
  proCard: {
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    padding: 0,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  proHeader: {
    padding: 16,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  planPrice: {
    fontSize: 16,
    color: COLORS.mediumGray,
    marginTop: 4,
  },
  planTitlePro: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  planPricePro: {
    fontSize: 16,
    color: COLORS.white,
    marginTop: 4,
  },
  planSubtext: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.85,
    marginTop: 4,
  },
  planChips: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  planChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  planChipText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
  },
  featureList: {
    marginTop: 12,
    gap: 10,
    padding: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    color: COLORS.text,
    fontSize: 13,
  },
  ctaCard: {
    marginTop: 20,
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 16,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  ctaSubtitle: {
    color: COLORS.mediumGray,
    marginTop: 6,
  },
  ctaButton: {
    marginTop: 12,
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: COLORS.white,
    fontWeight: '700',
  },
});
