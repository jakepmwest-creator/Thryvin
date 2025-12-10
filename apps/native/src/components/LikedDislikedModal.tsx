import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { usePreferencesStore } from '../stores/preferences-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  accent: '#A22BF6',
  accentSecondary: '#FF4EC7',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  success: '#34C759',
  error: '#FF3B30',
};

interface LikedDislikedModalProps {
  visible: boolean;
  onClose: () => void;
}

export function LikedDislikedModal({ visible, onClose }: LikedDislikedModalProps) {
  const [activeTab, setActiveTab] = useState<'liked' | 'disliked'>('liked');
  const { preferences, loadPreferences, removePreference } = usePreferencesStore();
  
  useEffect(() => {
    if (visible) {
      loadPreferences();
    }
  }, [visible]);
  
  const likedExercises = preferences.filter(p => p.preference === 'liked');
  const dislikedExercises = preferences.filter(p => p.preference === 'disliked');
  
  const currentList = activeTab === 'liked' ? likedExercises : dislikedExercises;
  
  // Group by category
  const groupedByCategory = currentList.reduce((acc, pref) => {
    // Simple categorization based on exercise name
    let category = 'Other';
    const name = pref.exerciseName.toLowerCase();
    
    if (name.includes('squat') || name.includes('deadlift') || name.includes('press') || name.includes('row') || name.includes('pull')) {
      category = 'Strength';
    } else if (name.includes('burpee') || name.includes('jump') || name.includes('sprint') || name.includes('mountain climber')) {
      category = 'HIIT';
    } else if (name.includes('run') || name.includes('jog') || name.includes('cycle') || name.includes('cardio')) {
      category = 'Cardio';
    } else if (name.includes('yoga') || name.includes('stretch') || name.includes('flexibility')) {
      category = 'Flexibility';
    }
    
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(pref);
    return acc;
  }, {} as Record<string, typeof currentList>);
  
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentSecondary]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>My Preferences</Text>
              <Text style={styles.headerSubtitle}>
                {likedExercises.length} liked • {dislikedExercises.length} disliked
              </Text>
            </View>
          </LinearGradient>
          
          {/* Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, activeTab === 'liked' && styles.toggleButtonActive]}
              onPress={() => setActiveTab('liked')}
            >
              <Ionicons 
                name={activeTab === 'liked' ? 'heart' : 'heart-outline'} 
                size={20} 
                color={activeTab === 'liked' ? COLORS.white : COLORS.accent} 
              />
              <Text style={[styles.toggleText, activeTab === 'liked' && styles.toggleTextActive]}>
                Liked ({likedExercises.length})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.toggleButton, activeTab === 'disliked' && styles.toggleButtonActive]}
              onPress={() => setActiveTab('disliked')}
            >
              <Ionicons 
                name={activeTab === 'disliked' ? 'thumbs-down' : 'thumbs-down-outline'} 
                size={20} 
                color={activeTab === 'disliked' ? COLORS.white : COLORS.error} 
              />
              <Text style={[styles.toggleText, activeTab === 'disliked' && styles.toggleTextActive]}>
                Disliked ({dislikedExercises.length})
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {currentList.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons 
                  name={activeTab === 'liked' ? 'heart-outline' : 'thumbs-down-outline'} 
                  size={64} 
                  color={COLORS.lightGray} 
                />
                <Text style={styles.emptyText}>
                  No {activeTab} exercises yet
                </Text>
                <Text style={styles.emptySubtext}>
                  {activeTab === 'liked' 
                    ? 'Tap the heart on exercises you enjoy!' 
                    : 'Tap thumbs down on exercises you want to avoid'}
                </Text>
              </View>
            ) : (
              Object.entries(groupedByCategory).map(([category, exercises]) => (
                <View key={category} style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>{category}</Text>
                  {exercises.map((pref) => (
                    <View key={pref.exerciseId} style={styles.exerciseCard}>
                      <View style={styles.exerciseInfo}>
                        <Ionicons 
                          name={activeTab === 'liked' ? 'heart' : 'thumbs-down'} 
                          size={20} 
                          color={activeTab === 'liked' ? COLORS.success : COLORS.error} 
                        />
                        <Text style={styles.exerciseName}>{pref.exerciseName}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => removePreference(pref.exerciseId)}
                        style={styles.removeButton}
                      >
                        <Ionicons name="close-circle" size={24} color={COLORS.mediumGray} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ))
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { backgroundColor: COLORS.white, height: '85%', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  header: { padding: 20, paddingTop: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  closeButton: { alignSelf: 'flex-end', padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  headerContent: { marginTop: 16 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: COLORS.white },
  headerSubtitle: { fontSize: 14, color: COLORS.white, opacity: 0.9, marginTop: 4 },
  toggleContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  toggleButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.lightGray, gap: 8 },
  toggleButtonActive: { backgroundColor: COLORS.accent },
  toggleText: { fontSize: 14, fontWeight: '600', color: COLORS.accent },
  toggleTextActive: { color: COLORS.white },
  content: { flex: 1, paddingHorizontal: 16 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { fontSize: 20, fontWeight: '600', color: COLORS.text, marginTop: 16 },
  emptySubtext: { fontSize: 14, color: COLORS.mediumGray, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
  categorySection: { marginBottom: 24 },
  categoryTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  exerciseCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.lightGray, padding: 16, borderRadius: 12, marginBottom: 8 },
  exerciseInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: '500', color: COLORS.text, flex: 1 },
  removeButton: { padding: 4 },
});
