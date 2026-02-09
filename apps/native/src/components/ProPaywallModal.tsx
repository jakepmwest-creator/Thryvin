import React, { useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import RevenueCatUI from 'react-native-purchases-ui';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptionStore } from '../stores/subscription-store';

const COLORS = {
  gradientStart: '#8B5CF6',
  gradientEnd: '#EC4899',
  background: '#0F0F1A',
  card: '#1B1B2E',
  text: '#FFFFFF',
  muted: '#A0A0B0',
};

const PRO_FEATURES = [
  'Unlimited AI-generated plans',
  'Advanced progress analytics',
  'Coach-level insights & tips',
  'Priority support + pro workouts',
];

interface ProPaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ProPaywallModal = ({ visible, onClose }: ProPaywallModalProps) => {
  const { offerings, fetchOfferings, refreshCustomerInfo } = useSubscriptionStore();

  useEffect(() => {
    if (visible) {
      fetchOfferings();
    }
  }, [visible, fetchOfferings]);

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
                <View key={feature} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.gradientEnd} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <View style={styles.paywallWrapper}>
              {offerings?.current ? (
                <RevenueCatUI.Paywall
                  options={{ offering: offerings.current }}
                  onPurchaseCompleted={async ({ customerInfo }) => {
                    await refreshCustomerInfo();
                    onClose();
                  }}
                  onRestoreCompleted={async ({ customerInfo }) => {
                    await refreshCustomerInfo();
                    onClose();
                  }}
                  onDismiss={onClose}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>Offers loading…</Text>
                  <Text style={styles.emptySubtitle}>
                    If this persists, please check your RevenueCat offerings.
                  </Text>
                </View>
              )}
            </View>
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
  },
  featureCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    gap: 10,
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
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
});

export default ProPaywallModal;
