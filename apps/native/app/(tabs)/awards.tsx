import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Animated,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../../src/components/AppHeader';
import { COLORS, CARD_SHADOW } from '../../src/constants/colors';
import { 
  useAwardsStore, 
  BADGE_DEFINITIONS, 
  RARITY_COLORS, 
  RARITY_LABELS,
  Badge,
  UserBadge,
  BadgeCategory,
} from '../../src/stores/awards-store';
import { useWorkoutStore } from '../../src/stores/workout-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Category labels and icons
const CATEGORY_INFO: Record<BadgeCategory, { label: string; icon: string; gradient: string[] }> = {
  consistency: { label: 'Consistency', icon: 'flame', gradient: ['#FF6B35', '#FFD60A'] },
  volume: { label: 'Volume', icon: 'barbell', gradient: ['#5B8DEF', '#34C4E5'] },
  focus: { label: 'Focus', icon: 'body', gradient: ['#34C759', '#00C7BE'] },
  program: { label: 'Program', icon: 'trophy', gradient: ['#FFD700', '#FFA500'] },
  challenge: { label: 'Challenge', icon: 'flash', gradient: ['#A22BF6', '#FF4EC7'] },
};

// Badge Card Component
const BadgeCard = ({ 
  badge, 
  userBadge, 
  onPress,
  size = 'normal'
}: { 
  badge: Badge; 
  userBadge?: UserBadge;
  onPress: () => void;
  size?: 'normal' | 'small';
}) => {
  const isUnlocked = userBadge?.completed;
  const progress = userBadge?.progress || 0;
  const progressPercent = Math.min((progress / badge.targetValue) * 100, 100);
  const rarityColor = RARITY_COLORS[badge.rarity];
  
  const cardWidth = size === 'small' ? 140 : 160;
  
  return (
    <TouchableOpacity 
      style={[styles.badgeCard, { width: cardWidth }]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[
        styles.badgeCardInner,
        !isUnlocked && styles.badgeCardLocked,
        isUnlocked && { borderColor: rarityColor.border, borderWidth: 2 },
      ]}>
        {/* Rarity Tag */}
        <View style={[styles.rarityTag, { backgroundColor: rarityColor.bg }]}>
          <Text style={[styles.rarityText, { color: rarityColor.text }]}>
            {RARITY_LABELS[badge.rarity]}
          </Text>
        </View>
        
        {/* Badge Icon */}
        <View style={styles.badgeIconContainer}>
          {isUnlocked ? (
            <LinearGradient
              colors={badge.gradient as any}
              style={styles.badgeIconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={badge.icon as any} size={32} color={COLORS.white} />
            </LinearGradient>
          ) : (
            <View style={styles.badgeIconLocked}>
              <Ionicons name={badge.icon as any} size={32} color={COLORS.mediumGray} />
            </View>
          )}
        </View>
        
        {/* Badge Name */}
        <Text style={[styles.badgeName, !isUnlocked && styles.badgeNameLocked]} numberOfLines={1}>
          {badge.name}
        </Text>
        
        {/* Progress or Unlocked Date */}
        {isUnlocked ? (
          <View style={styles.unlockedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
            <Text style={styles.unlockedText}>Unlocked</Text>
          </View>
        ) : (
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={badge.gradient as any}
                style={[styles.progressFill, { width: `${progressPercent}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <Text style={styles.progressText}>
              {progress}/{badge.targetValue}
            </Text>
          </View>
        )}
        
        {/* XP Value */}
        <View style={styles.xpBadge}>
          <Ionicons name="star" size={12} color={COLORS.warning} />
          <Text style={styles.xpText}>{badge.xp} XP</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Badge Detail Modal
const BadgeDetailModal = ({ 
  visible, 
  onClose, 
  badge, 
  userBadge 
}: { 
  visible: boolean; 
  onClose: () => void; 
  badge: Badge | null;
  userBadge?: UserBadge;
}) => {
  if (!badge) return null;
  
  const isUnlocked = userBadge?.completed;
  const progress = userBadge?.progress || 0;
  const progressPercent = Math.min((progress / badge.targetValue) * 100, 100);
  const rarityColor = RARITY_COLORS[badge.rarity];
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Close Button */}
          <TouchableOpacity style={styles.modalClose} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.mediumGray} />
          </TouchableOpacity>
          
          {/* Badge Icon Large */}
          <View style={styles.modalIconContainer}>
            {isUnlocked ? (
              <LinearGradient
                colors={badge.gradient as any}
                style={styles.modalIconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name={badge.icon as any} size={64} color={COLORS.white} />
              </LinearGradient>
            ) : (
              <View style={styles.modalIconLocked}>
                <Ionicons name={badge.icon as any} size={64} color={COLORS.mediumGray} />
              </View>
            )}
          </View>
          
          {/* Rarity */}
          <View style={[styles.modalRarityTag, { backgroundColor: rarityColor.bg }]}>
            <Text style={[styles.modalRarityText, { color: rarityColor.text }]}>
              {RARITY_LABELS[badge.rarity]}
            </Text>
          </View>
          
          {/* Badge Name & Description */}
          <Text style={styles.modalBadgeName}>{badge.name}</Text>
          <Text style={styles.modalBadgeDescription}>{badge.description}</Text>
          
          {/* Progress or Unlocked */}
          {isUnlocked ? (
            <View style={styles.modalUnlocked}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              <Text style={styles.modalUnlockedText}>
                Unlocked {userBadge?.unlockedAt ? new Date(userBadge.unlockedAt).toLocaleDateString() : ''}
              </Text>
            </View>
          ) : (
            <View style={styles.modalProgress}>
              <Text style={styles.modalProgressLabel}>Progress</Text>
              <View style={styles.modalProgressBar}>
                <LinearGradient
                  colors={badge.gradient as any}
                  style={[styles.modalProgressFill, { width: `${progressPercent}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <Text style={styles.modalProgressText}>
                {progress} / {badge.targetValue} ({Math.round(progressPercent)}%)
              </Text>
            </View>
          )}
          
          {/* XP Reward */}
          <View style={styles.modalXP}>
            <Ionicons name="star" size={20} color={COLORS.warning} />
            <Text style={styles.modalXPText}>{badge.xp} XP Reward</Text>
          </View>
          
          {/* Category */}
          <View style={styles.modalCategory}>
            <Ionicons 
              name={CATEGORY_INFO[badge.category].icon as any} 
              size={16} 
              color={COLORS.mediumGray} 
            />
            <Text style={styles.modalCategoryText}>
              {CATEGORY_INFO[badge.category].label} Badge
              {badge.tier && ` • Tier ${badge.tier}`}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Unlock Celebration Modal
const UnlockCelebrationModal = ({ 
  visible, 
  onClose, 
  badges 
}: { 
  visible: boolean; 
  onClose: () => void; 
  badges: Badge[];
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);
  
  if (badges.length === 0) return null;
  
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.celebrationOverlay}>
        <Animated.View style={[styles.celebrationContent, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.celebrationEmoji}>🏆</Text>
          <Text style={styles.celebrationTitle}>Badge Unlocked!</Text>
          
          {badges.map((badge, index) => (
            <View key={badge.id} style={styles.celebrationBadge}>
              <LinearGradient
                colors={badge.gradient as any}
                style={styles.celebrationIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name={badge.icon as any} size={40} color={COLORS.white} />
              </LinearGradient>
              <Text style={styles.celebrationBadgeName}>{badge.name}</Text>
              <View style={styles.celebrationXP}>
                <Ionicons name="star" size={16} color={COLORS.warning} />
                <Text style={styles.celebrationXPText}>+{badge.xp} XP</Text>
              </View>
            </View>
          ))}
          
          <TouchableOpacity style={styles.celebrationButton} onPress={onClose}>
            <LinearGradient
              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
              style={styles.celebrationButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.celebrationButtonText}>Awesome!</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function AwardsScreen() {
  const { 
    userBadges, 
    newlyUnlocked, 
    totalXP, 
    level,
    loadUserBadges, 
    checkBadges, 
    clearNewlyUnlocked,
    getNextUnlocks,
  } = useAwardsStore();
  
  const { completedWorkouts, weekWorkouts, stats } = useWorkoutStore();
  
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [activeCategory, setActiveCategory] = useState<BadgeCategory | 'all'>('all');
  
  // Load badges on mount
  useEffect(() => {
    loadUserBadges();
  }, []);
  
  // Check for new badges when data changes
  useEffect(() => {
    const checkForBadges = async () => {
      // Combine completed workouts
      const allCompleted = [
        ...completedWorkouts,
        ...weekWorkouts.filter(w => w.completed && !w.isRestDay)
      ].filter((w, i, self) => i === self.findIndex(x => x.id === w.id));
      
      // Calculate category counts
      const categoryCounts: Record<string, number> = {
        upper: 0, lower: 0, full: 0, cardio: 0, core: 0,
      };
      
      allCompleted.forEach(w => {
        const type = (w.type || '').toLowerCase();
        if (type.includes('upper') || type.includes('push') || type.includes('pull')) {
          categoryCounts.upper++;
        } else if (type.includes('lower') || type.includes('leg')) {
          categoryCounts.lower++;
        } else if (type.includes('cardio') || type.includes('hiit')) {
          categoryCounts.cardio++;
        } else if (type.includes('core')) {
          categoryCounts.core++;
        } else {
          categoryCounts.full++;
        }
      });
      
      // Estimate total sets/reps (rough calculation)
      const avgSetsPerWorkout = 15;
      const avgRepsPerSet = 10;
      const totalSets = allCompleted.length * avgSetsPerWorkout;
      const totalReps = totalSets * avgRepsPerSet;
      
      await checkBadges({
        totalWorkouts: allCompleted.length,
        currentStreak: stats?.currentStreak || 0,
        totalSets,
        totalReps,
        totalMinutes: stats?.totalMinutes || allCompleted.length * 45,
        weeklyWorkouts: stats?.weeklyWorkouts || 0,
        categoryCounts,
      });
    };
    
    if (completedWorkouts.length > 0 || weekWorkouts.some(w => w.completed)) {
      checkForBadges();
    }
  }, [completedWorkouts, weekWorkouts, stats]);
  
  // Show celebration for newly unlocked badges
  useEffect(() => {
    if (newlyUnlocked.length > 0) {
      setShowCelebration(true);
    }
  }, [newlyUnlocked]);
  
  const handleCelebrationClose = () => {
    setShowCelebration(false);
    clearNewlyUnlocked();
  };
  
  // Get badges by category
  const getBadgesByCategory = (category: BadgeCategory | 'all') => {
    if (category === 'all') return BADGE_DEFINITIONS;
    return BADGE_DEFINITIONS.filter(b => b.category === category);
  };
  
  const filteredBadges = getBadgesByCategory(activeCategory);
  const unlockedCount = userBadges.filter(b => b.completed).length;
  const totalBadges = BADGE_DEFINITIONS.length;
  const nextUnlocks = getNextUnlocks();
  const newlyUnlockedBadges = BADGE_DEFINITIONS.filter(b => newlyUnlocked.includes(b.id));
  
  return (
    <SafeAreaView style={styles.container}>
      <AppHeader mode="fitness" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Level Header */}
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          style={styles.levelHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.levelContent}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelNumber}>{level}</Text>
            </View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>Level {level}</Text>
              <Text style={styles.levelXP}>{totalXP} XP Total</Text>
            </View>
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountNumber}>{unlockedCount}</Text>
              <Text style={styles.badgeCountLabel}>of {totalBadges}</Text>
            </View>
          </View>
          
          {/* XP Progress to next level */}
          <View style={styles.xpProgressContainer}>
            <View style={styles.xpProgressBar}>
              <View style={[styles.xpProgressFill, { width: `${(totalXP % 500) / 5}%` }]} />
            </View>
            <Text style={styles.xpProgressText}>
              {500 - (totalXP % 500)} XP to Level {level + 1}
            </Text>
          </View>
        </LinearGradient>
        
        {/* Next Unlocks Section */}
        {nextUnlocks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Almost There!</Text>
            <FlatList
              data={nextUnlocks}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <BadgeCard
                  badge={item.badge}
                  userBadge={item.progress}
                  onPress={() => setSelectedBadge(item.badge)}
                  size="small"
                />
              )}
              keyExtractor={item => item.badge.id}
            />
          </View>
        )}
        
        {/* Category Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryFilter}
        >
          <TouchableOpacity
            style={[styles.categoryChip, activeCategory === 'all' && styles.categoryChipActive]}
            onPress={() => setActiveCategory('all')}
          >
            <Ionicons name="grid" size={16} color={activeCategory === 'all' ? COLORS.white : COLORS.text} />
            <Text style={[styles.categoryChipText, activeCategory === 'all' && styles.categoryChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          
          {(Object.keys(CATEGORY_INFO) as BadgeCategory[]).map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Ionicons 
                name={CATEGORY_INFO[cat].icon as any} 
                size={16} 
                color={activeCategory === cat ? COLORS.white : COLORS.text} 
              />
              <Text style={[styles.categoryChipText, activeCategory === cat && styles.categoryChipTextActive]}>
                {CATEGORY_INFO[cat].label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Badge Grid */}
        <View style={styles.badgeGrid}>
          {filteredBadges.map(badge => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              userBadge={userBadges.find(ub => ub.badgeId === badge.id)}
              onPress={() => setSelectedBadge(badge)}
            />
          ))}
        </View>
        
        <View style={{ height: 32 }} />
      </ScrollView>
      
      {/* Badge Detail Modal */}
      <BadgeDetailModal
        visible={!!selectedBadge}
        onClose={() => setSelectedBadge(null)}
        badge={selectedBadge}
        userBadge={userBadges.find(ub => ub.badgeId === selectedBadge?.id)}
      />
      
      {/* Unlock Celebration Modal */}
      <UnlockCelebrationModal
        visible={showCelebration}
        onClose={handleCelebrationClose}
        badges={newlyUnlockedBadges}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  
  // Level Header
  levelHeader: {
    margin: 16,
    borderRadius: 20,
    padding: 20,
  },
  levelContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
  },
  levelInfo: {
    flex: 1,
    marginLeft: 16,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  levelXP: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  badgeCount: {
    alignItems: 'center',
  },
  badgeCountNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
  },
  badgeCountLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  xpProgressContainer: {
    marginTop: 16,
  },
  xpProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpProgressFill: {
    height: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 3,
  },
  xpProgressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  horizontalList: {
    paddingHorizontal: 12,
  },
  
  // Category Filter
  categoryFilter: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: COLORS.gradientStart,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginLeft: 6,
  },
  categoryChipTextActive: {
    color: COLORS.white,
  },
  
  // Badge Grid
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  
  // Badge Card
  badgeCard: {
    marginBottom: 16,
    marginHorizontal: 4,
  },
  badgeCardInner: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    ...CARD_SHADOW,
  },
  badgeCardLocked: {
    backgroundColor: '#F8F8F8',
    opacity: 0.85,
  },
  rarityTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  badgeIconContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  badgeIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeIconLocked: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  badgeNameLocked: {
    color: COLORS.mediumGray,
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unlockedText: {
    fontSize: 12,
    color: COLORS.success,
    marginLeft: 4,
    fontWeight: '500',
  },
  progressSection: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E8E8E8',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: COLORS.mediumGray,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  xpText: {
    fontSize: 11,
    color: COLORS.warning,
    fontWeight: '600',
    marginLeft: 4,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: 'center',
    minHeight: 400,
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  modalIconContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  modalIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalIconLocked: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalRarityTag: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  modalRarityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalBadgeName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  modalBadgeDescription: {
    fontSize: 16,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  modalUnlocked: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalUnlockedText: {
    fontSize: 16,
    color: COLORS.success,
    fontWeight: '500',
    marginLeft: 8,
  },
  modalProgress: {
    width: '100%',
    marginBottom: 16,
  },
  modalProgressLabel: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginBottom: 8,
  },
  modalProgressBar: {
    height: 10,
    backgroundColor: '#E8E8E8',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  modalProgressFill: {
    height: '100%',
    borderRadius: 5,
  },
  modalProgressText: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
  },
  modalXP: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalXPText: {
    fontSize: 16,
    color: COLORS.warning,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalCategoryText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginLeft: 6,
  },
  
  // Celebration Modal
  celebrationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationContent: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    margin: 32,
    width: SCREEN_WIDTH - 64,
  },
  celebrationEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  celebrationTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 24,
  },
  celebrationBadge: {
    alignItems: 'center',
    marginBottom: 20,
  },
  celebrationIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  celebrationBadgeName: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  celebrationXP: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  celebrationXPText: {
    fontSize: 16,
    color: COLORS.warning,
    fontWeight: '600',
    marginLeft: 6,
  },
  celebrationButton: {
    marginTop: 16,
    width: '100%',
  },
  celebrationButtonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  celebrationButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
});
