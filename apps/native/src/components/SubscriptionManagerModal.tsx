import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

const VALUE_POINTS = [
  'You’re training with pro‑level guidance',
  'Plans adapt as your strength grows',
  'Priority support keeps you on track',
];

interface SubscriptionManagerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SubscriptionManagerModal = ({ visible, onClose }: SubscriptionManagerModalProps) => {
  const { presentCustomerCenter } = useSubscriptionStore();

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.header}>
            <Text style={styles.headerTitle}>Stay Thryvin' Pro</Text>
            <Text style={styles.headerSubtitle}>Before you go, here’s what you keep.</Text>
          </LinearGradient>

          <View style={styles.body}>
            {VALUE_POINTS.map((point) => (
              <View key={point} style={styles.pointRow}>
                <Ionicons name="sparkles" size={16} color={COLORS.gradientEnd} />
                <Text style={styles.pointText}>{point}</Text>
              </View>
            ))}

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.keepButton}
                onPress={onClose}
                data-testid="subscription-keep-pro-button"
              >
                <Text style={styles.keepButtonText}>Keep Pro</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.manageButton}
                onPress={async () => {
                  await presentCustomerCenter();
                  onClose();
                }}
                data-testid="subscription-manage-button"
              >
                <Text style={styles.manageButtonText}>Manage Subscription</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: COLORS.background,
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    padding: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    color: COLORS.text,
    opacity: 0.85,
    marginTop: 6,
  },
  body: {
    padding: 20,
    gap: 12,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pointText: {
    color: COLORS.text,
    fontSize: 14,
  },
  actions: {
    marginTop: 16,
    gap: 12,
  },
  keepButton: {
    backgroundColor: COLORS.gradientStart,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  keepButtonText: {
    color: COLORS.text,
    fontWeight: '700',
  },
  manageButton: {
    backgroundColor: COLORS.card,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  manageButtonText: {
    color: COLORS.text,
    fontWeight: '600',
  },
});

export default SubscriptionManagerModal;
