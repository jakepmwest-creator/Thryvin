import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptionStore } from '../stores/subscription-store';

const COLORS = {
  accent: '#A22BF6',
  accentSecondary: '#FF4EC7',
  background: '#FFFFFF',
  cardBg: '#F8F9FA',
  text: '#222222',
  textSecondary: '#8E8E93',
  border: '#E5E5EA',
  white: '#FFFFFF',
};

const VALUE_POINTS = [
  { icon: 'sparkles' as const, text: "You're training with pro-level guidance" },
  { icon: 'trending-up' as const, text: 'Plans adapt as your strength grows' },
  { icon: 'headset' as const, text: 'Priority support keeps you on track' },
  { icon: 'analytics' as const, text: 'Deep exercise stats & trend insights' },
];

interface SubscriptionManagerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SubscriptionManagerModal = ({ visible, onClose }: SubscriptionManagerModalProps) => {
  const { presentCustomerCenter, nativeAvailable, setTestPro } = useSubscriptionStore();

  const handleManageSubscription = async () => {
    if (nativeAvailable) {
      await presentCustomerCenter();
      onClose();
    } else {
      // In test mode / Expo Go — simulate downgrade
      setTestPro(false);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header with gradient accent bar */}
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentSecondary]}
            style={styles.accentBar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />

          <View style={styles.body}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[COLORS.accent, COLORS.accentSecondary]}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="star" size={24} color={COLORS.white} />
              </LinearGradient>
            </View>

            <Text style={styles.headerTitle}>Stay Thryvin' Pro</Text>
            <Text style={styles.headerSubtitle}>Before you go, here's what you keep.</Text>

            <View style={styles.valueList}>
              {VALUE_POINTS.map((point) => (
                <View key={point.text} style={styles.pointRow}>
                  <Ionicons name={point.icon} size={18} color={COLORS.accent} />
                  <Text style={styles.pointText}>{point.text}</Text>
                </View>
              ))}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.keepButton}
                onPress={onClose}
                data-testid="subscription-keep-pro-button"
              >
                <LinearGradient
                  colors={[COLORS.accent, COLORS.accentSecondary]}
                  style={styles.keepGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="star" size={16} color={COLORS.white} />
                  <Text style={styles.keepButtonText}>Keep Pro</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.manageButton}
                onPress={handleManageSubscription}
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: COLORS.background,
    borderRadius: 20,
    overflow: 'hidden',
  },
  accentBar: {
    height: 4,
  },
  body: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    fontSize: 14,
  },
  valueList: {
    alignSelf: 'stretch',
    marginTop: 20,
    gap: 14,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pointText: {
    color: COLORS.text,
    fontSize: 14,
    flex: 1,
  },
  actions: {
    alignSelf: 'stretch',
    marginTop: 24,
    gap: 10,
  },
  keepButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  keepGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  keepButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
  manageButton: {
    backgroundColor: COLORS.cardBg,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  manageButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default SubscriptionManagerModal;
