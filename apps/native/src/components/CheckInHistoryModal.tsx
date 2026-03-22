/**
 * CheckInHistoryModal — View all past check-ins with AI feedback
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { getApiBaseUrl } from '../services/env';

const COLORS = {
  accent: '#A22BF6',
  accentSecondary: '#FF4EC7',
  white: '#FFFFFF',
  background: '#FFFFFF',
  cardBg: '#F8F9FA',
  text: '#222222',
  textSecondary: '#8E8E93',
  textMuted: '#C7C7CC',
  border: '#E5E5EA',
};

const API_BASE = getApiBaseUrl();

interface CheckIn {
  id: number;
  created_at: string;
  tier: string;
  energy_level: number;
  sleep_quality: number;
  mood: number;
  soreness: number;
  motivation: number;
  weight_kg: number | null;
  notes: string | null;
  ai_feedback: string | null;
}

interface CheckInHistoryModalProps {
  visible: boolean;
  onClose: () => void;
}

function ScoreBadge({ icon, value }: { icon: string; value: number }) {
  return (
    <View style={hist.badge}>
      <Text style={hist.badgeIcon}>{icon}</Text>
      <Text style={hist.badgeVal}>{value}</Text>
    </View>
  );
}

const hist = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(162,43,246,0.08)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 3,
  },
  badgeIcon: { fontSize: 11 },
  badgeVal: { fontSize: 11, fontWeight: '700', color: '#A22BF6' },
});

export function CheckInHistoryModal({ visible, onClose }: CheckInHistoryModalProps) {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (visible) loadCheckIns();
  }, [visible]);

  const loadCheckIns = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('thryvin_access_token');
      const res = await fetch(`${API_BASE}/api/checkins`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.ok) setCheckIns(data.checkIns || []);
    } catch (e) {
      console.error('[CHECK-IN HISTORY]', e);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const renderItem = ({ item }: { item: CheckIn }) => {
    const isExpanded = expanded === item.id;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setExpanded(isExpanded ? null : item.id)}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
            <View style={styles.tierBadge}>
              <Text style={styles.tierText}>{item.tier === 'pro' ? '⚡ Pro' : '📋 Monthly'}</Text>
            </View>
          </View>
          <View style={styles.scores}>
            {item.energy_level != null && <ScoreBadge icon="⚡" value={item.energy_level} />}
            {item.mood != null && <ScoreBadge icon="😊" value={item.mood} />}
            {item.motivation != null && <ScoreBadge icon="🔥" value={item.motivation} />}
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={COLORS.textSecondary}
          />
        </View>

        {isExpanded && (
          <View style={styles.cardBody}>
            {/* All scores */}
            <View style={styles.allScores}>
              {[
                { icon: '⚡', label: 'Energy', val: item.energy_level },
                { icon: '😴', label: 'Sleep', val: item.sleep_quality },
                { icon: '😊', label: 'Mood', val: item.mood },
                { icon: '💪', label: 'Soreness', val: item.soreness },
                { icon: '🔥', label: 'Motivation', val: item.motivation },
              ].filter(s => s.val != null).map(s => (
                <View key={s.label} style={styles.scoreRow}>
                  <Text style={styles.scoreRowLabel}>{s.icon} {s.label}</Text>
                  <View style={styles.scoreBar}>
                    <View style={[styles.scoreBarFill, { width: `${(s.val! / 10) * 100}%` }]} />
                  </View>
                  <Text style={styles.scoreRowVal}>{s.val}/10</Text>
                </View>
              ))}
            </View>

            {item.weight_kg && (
              <Text style={styles.bodyText}>⚖️ Weight: {item.weight_kg}kg</Text>
            )}
            {item.notes && (
              <View style={styles.notesBox}>
                <Text style={styles.notesLabel}>📝 Notes</Text>
                <Text style={styles.notesText}>{item.notes}</Text>
              </View>
            )}
            {item.ai_feedback && (
              <View style={styles.aiFeedbackBox}>
                <View style={styles.aiHeader}>
                  <Ionicons name="sparkles" size={14} color={COLORS.accent} />
                  <Text style={styles.aiHeaderText}>Coach Feedback</Text>
                </View>
                <Text style={styles.aiText}>{item.ai_feedback}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentSecondary]}
            style={styles.accentBar}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.title}>📅 Check-In History</Text>
            <Text style={styles.subtitle}>Your progress over time</Text>
          </View>

          {loading ? (
            <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />
          ) : checkIns.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="clipboard-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No check-ins yet</Text>
              <Text style={styles.emptySubtext}>Your check-in history will appear here</Text>
            </View>
          ) : (
            <FlatList
              data={checkIns}
              keyExtractor={item => String(item.id)}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '90%',
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  accentBar: { height: 4 },
  header: { padding: 20, paddingBottom: 12 },
  closeBtn: {
    alignSelf: 'flex-end',
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  list: { padding: 16, gap: 10, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardDate: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  tierBadge: { marginTop: 2 },
  tierText: { fontSize: 11, color: COLORS.textSecondary },
  scores: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  cardBody: { marginTop: 14, gap: 10 },
  allScores: { gap: 8 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreRowLabel: { fontSize: 13, color: COLORS.text, width: 90 },
  scoreBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 3,
  },
  scoreRowVal: { fontSize: 12, fontWeight: '700', color: COLORS.accent, width: 36, textAlign: 'right' },
  bodyText: { fontSize: 13, color: COLORS.text },
  notesBox: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notesLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 4 },
  notesText: { fontSize: 13, color: COLORS.text, lineHeight: 18 },
  aiFeedbackBox: {
    backgroundColor: 'rgba(162,43,246,0.06)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(162,43,246,0.15)',
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  aiHeaderText: { fontSize: 13, fontWeight: '700', color: COLORS.accent },
  aiText: { fontSize: 13, color: COLORS.text, lineHeight: 20 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.textSecondary },
  emptySubtext: { fontSize: 13, color: COLORS.textMuted },
});
