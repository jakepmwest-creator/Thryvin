import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  accent: '#A22BF6',
  accentSecondary: '#FF4EC7',
  bg: '#0D0D0D',
  card: '#1A1A1A',
  cardBorder: '#2A2A2A',
  white: '#FFFFFF',
  text: '#F5F5F5',
  textSecondary: '#9E9E9E',
  textMuted: '#666666',
  success: '#34C759',
};

const PRO_PERKS = [
  { icon: 'infinite', label: 'Unlimited AI workout plans' },
  { icon: 'refresh', label: 'Rolling 3-week regeneration' },
  { icon: 'analytics', label: 'Deep exercise stats & trends' },
  { icon: 'create', label: 'Edit & customise any workout' },
  { icon: 'flash', label: 'Drop, super & giant sets' },
  { icon: 'headset', label: 'Priority support' },
];

const STANDARD_PERKS = [
  { icon: 'barbell-outline', label: 'Basic AI workout generation' },
  { icon: 'flame-outline', label: 'Workout logging + streaks' },
  { icon: 'trophy-outline', label: 'Awards & badges' },
];

export default function PlanSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ coachName: string; onboardingData: string }>();
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'standard' | null>(null);

  const handleContinue = () => {
    const onboardingData = params.onboardingData
      ? JSON.parse(params.onboardingData as string)
      : {};

    router.push({
      pathname: '/(auth)/quick-signup',
      params: {
        onboardingData: JSON.stringify({
          ...onboardingData,
          coachName: params.coachName,
          selectedPlan: selectedPlan || 'standard',
        }),
      },
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.bg, '#111']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Choose your plan</Text>
            <Text style={styles.headerSub}>
              Start with 3 weeks free on Pro. Cancel anytime.
            </Text>
          </View>

          {/* Pro Card */}
          <TouchableOpacity
            style={[
              styles.planCard,
              styles.proCard,
              selectedPlan === 'pro' && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan('pro')}
            activeOpacity={0.85}
            data-testid="plan-select-pro"
          >
            {/* Best Value tag */}
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentSecondary]}
              style={styles.bestValueTag}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.bestValueText}>RECOMMENDED</Text>
            </LinearGradient>

            <LinearGradient
              colors={[COLORS.accent, COLORS.accentSecondary]}
              style={styles.proHeaderGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.proHeaderRow}>
                <Ionicons name="star" size={22} color={COLORS.white} />
                <Text style={styles.proTitle}>Thryvin' Pro</Text>
              </View>
              <Text style={styles.proPrice}>
                £6.25<Text style={styles.proPeriod}>/mo</Text>
              </Text>
              <Text style={styles.proBilled}>Billed £74.99/year after free trial</Text>
              <View style={styles.trialBadge}>
                <Ionicons name="gift-outline" size={14} color={COLORS.white} />
                <Text style={styles.trialText}>3 WEEKS FREE</Text>
              </View>
            </LinearGradient>

            <View style={styles.perksList}>
              {PRO_PERKS.map((p) => (
                <View key={p.label} style={styles.perkRow}>
                  <Ionicons name={p.icon as any} size={16} color={COLORS.accentSecondary} />
                  <Text style={styles.perkText}>{p.label}</Text>
                </View>
              ))}
            </View>

            {selectedPlan === 'pro' && (
              <View style={styles.selectedIndicator}>
                <Ionicons name="checkmark-circle" size={22} color={COLORS.accent} />
              </View>
            )}
          </TouchableOpacity>

          {/* Standard Card */}
          <TouchableOpacity
            style={[
              styles.planCard,
              styles.standardCard,
              selectedPlan === 'standard' && styles.standardCardSelected,
            ]}
            onPress={() => setSelectedPlan('standard')}
            activeOpacity={0.85}
            data-testid="plan-select-standard"
          >
            <Text style={styles.standardTitle}>Standard</Text>
            <Text style={styles.standardPrice}>Free</Text>
            <View style={styles.standardDivider} />
            <View style={styles.perksList}>
              {STANDARD_PERKS.map((p) => (
                <View key={p.label} style={styles.perkRow}>
                  <Ionicons name={p.icon as any} size={16} color={COLORS.textMuted} />
                  <Text style={styles.standardPerkText}>{p.label}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.standardNote}>Limited features. Upgrade anytime.</Text>
            {selectedPlan === 'standard' && (
              <View style={styles.selectedIndicator}>
                <Ionicons name="checkmark-circle" size={22} color={COLORS.textSecondary} />
              </View>
            )}
          </TouchableOpacity>

          {/* Spacer */}
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Bottom CTA */}
        <View style={styles.bottomCta}>
          <TouchableOpacity
            style={[styles.ctaButton, !selectedPlan && styles.ctaDisabled]}
            onPress={handleContinue}
            disabled={!selectedPlan}
            activeOpacity={0.85}
            data-testid="plan-select-continue"
          >
            <LinearGradient
              colors={
                selectedPlan === 'pro'
                  ? [COLORS.accent, COLORS.accentSecondary]
                  : ['#444', '#333']
              }
              style={styles.ctaGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.ctaText}>
                {selectedPlan === 'pro'
                  ? 'Start Free Trial'
                  : selectedPlan === 'standard'
                  ? 'Continue with Standard'
                  : 'Select a plan to continue'}
              </Text>
              {selectedPlan && (
                <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
              )}
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.legalNote}>
            {selectedPlan === 'pro'
              ? 'Free for 3 weeks, then £74.99/year. Cancel anytime in Settings.'
              : 'You can upgrade to Pro later from Settings.'}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  safe: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 10 },

  header: { marginBottom: 24, marginTop: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5 },
  headerSub: { fontSize: 15, color: COLORS.textSecondary, marginTop: 6, lineHeight: 21 },

  // Plan cards
  planCard: { borderRadius: 22, marginBottom: 16, overflow: 'hidden', position: 'relative' },

  // Pro
  proCard: { backgroundColor: COLORS.card, borderWidth: 2, borderColor: COLORS.accent },
  proHeaderGradient: { padding: 20 },
  proHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  proTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  proPrice: { fontSize: 36, fontWeight: '800', color: COLORS.white },
  proPeriod: { fontSize: 16, fontWeight: '400', color: 'rgba(255,255,255,0.7)' },
  proBilled: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  trialText: { color: COLORS.white, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  bestValueTag: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderBottomLeftRadius: 12,
    zIndex: 2,
  },
  bestValueText: { fontSize: 10, fontWeight: '800', color: COLORS.white, letterSpacing: 0.5 },

  // Standard
  standardCard: { backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333' },
  standardCardSelected: { borderColor: COLORS.textSecondary },
  standardTitle: { fontSize: 18, fontWeight: '700', color: '#999', paddingHorizontal: 20, paddingTop: 18 },
  standardPrice: { fontSize: 28, fontWeight: '800', color: '#AAA', paddingHorizontal: 20, marginTop: 4 },
  standardDivider: { height: 1, backgroundColor: '#333', marginVertical: 12, marginHorizontal: 20 },
  standardPerkText: { fontSize: 14, color: '#888' },
  standardNote: { fontSize: 12, color: '#555', paddingHorizontal: 20, paddingBottom: 16, marginTop: 6 },

  planCardSelected: { borderColor: COLORS.accent, borderWidth: 3 },
  selectedIndicator: { position: 'absolute', top: 16, right: 16, zIndex: 3 },

  // Perks
  perksList: { padding: 16, gap: 10 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  perkText: { fontSize: 14, color: COLORS.text, fontWeight: '500' },

  // Bottom CTA
  bottomCta: { padding: 20, paddingTop: 10 },
  ctaButton: { borderRadius: 16, overflow: 'hidden' },
  ctaDisabled: { opacity: 0.5 },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  ctaText: { fontSize: 17, fontWeight: '700', color: COLORS.white },
  legalNote: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: 10, lineHeight: 16 },
});
