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
  Share,
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
  ISLANDS,
  Badge,
  UserBadge,
  BadgeCategory,
  Island,
} from '../../src/stores/awards-store';
import { useWorkoutStore } from '../../src/stores/workout-store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Category info
const CATEGORY_INFO: Record<BadgeCategory, { label: string; icon: string }> = {
  consistency: { label: 'Consistency', icon: 'flame' },
  volume: { label: 'Volume', icon: 'barbell' },
  focus: { label: 'Focus', icon: 'body' },
  program: { label: 'Program', icon: 'trophy' },
  challenge: { label: 'Challenge', icon: 'flash' },
};

// Island Card for the selector
const IslandCard = ({ 
  island, 
  isCurrentIsland, 
  isUnlocked, 
  onPress 
}: { 
  island: Island; 
  isCurrentIsland: boolean; 
  isUnlocked: boolean;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity 
      style={[styles.islandCard, isCurrentIsland && styles.islandCardCurrent]}
      onPress={onPress}
      disabled={!isUnlocked}
      activeOpacity={0.8}
    >
      {isUnlocked ? (
        <LinearGradient
          colors={island.gradient as any}
          style={styles.islandCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.islandEmoji}>{island.emoji}</Text>
          <Text style={styles.islandCardName}>{island.name}</Text>
          <Text style={styles.islandCardSubtitle}>{island.subtitle}</Text>
          {isCurrentIsland && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>YOU ARE HERE</Text>
            </View>
          )}
        </LinearGradient>
      ) : (
        <View style={styles.islandCardLocked}>
          <Ionicons name="lock-closed" size={32} color={COLORS.mediumGray} />
          <Text style={styles.islandLockedName}>{island.name}</Text>
          <Text style={styles.islandLockedReq}>{island.requiredBadges} badges to unlock</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Badge Card Component
const BadgeCard = ({ 
  badge, 
  userBadge, 
  onPress,
  isAvailable,
}: { 
  badge: Badge; 
  userBadge?: UserBadge;
  onPress: () => void;
  isAvailable: boolean;
}) => {
  const isUnlocked = userBadge?.completed;
  const progress = userBadge?.progress || 0;
  const progressPercent = Math.min((progress / badge.targetValue) * 100, 100);
  const rarityColor = RARITY_COLORS[badge.rarity];
  
  return (
    <TouchableOpacity 
      style={styles.badgeCard} 
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!isAvailable}
    >
      <View style={[
        styles.badgeCardInner,
        !isUnlocked && styles.badgeCardLocked,
        !isAvailable && styles.badgeCardUnavailable,
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
              <Ionicons name={badge.icon as any} size={28} color={COLORS.white} />
            </LinearGradient>
          ) : (
            <View style={[styles.badgeIconLocked, !isAvailable && { opacity: 0.4 }]}>
              <Ionicons name={badge.icon as any} size={28} color={COLORS.mediumGray} />
            </View>
          )}
        </View>
        
        {/* Badge Name */}
        <Text style={[styles.badgeName, !isUnlocked && styles.badgeNameLocked]} numberOfLines={1}>
          {badge.name}
        </Text>
        
        {/* Progress or Unlocked */}
        {isUnlocked ? (
          <View style={styles.unlockedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
            <Text style={styles.unlockedText}>Unlocked</Text>
          </View>
        ) : isAvailable ? (
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={badge.gradient as any}
                style={[styles.progressFill, { width: `${progressPercent}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <Text style={styles.progressText}>{progress}/{badge.targetValue}</Text>
          </View>
        ) : (
          <View style={styles.lockedSection}>
            <Ionicons name="lock-closed" size={12} color={COLORS.mediumGray} />
            <Text style={styles.lockedText}>Island {badge.islandRequired}</Text>
          </View>
        )}
        
        {/* XP Value */}
        <View style={styles.xpBadge}>
          <Ionicons name="star" size={11} color={COLORS.warning} />
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
  userBadge,
  onShare,
}: { 
  visible: boolean; 
  onClose: () => void; 
  badge: Badge | null;
  userBadge?: UserBadge;
  onShare: () => void;
}) => {
  if (!badge) return null;
  
  const isUnlocked = userBadge?.completed;
  const progress = userBadge?.progress || 0;
  const progressPercent = Math.min((progress / badge.targetValue) * 100, 100);
  const rarityColor = RARITY_COLORS[badge.rarity];
  
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
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
                <Ionicons name={badge.icon as any} size={56} color={COLORS.white} />
              </LinearGradient>
            ) : (
              <View style={styles.modalIconLocked}>
                <Ionicons name={badge.icon as any} size={56} color={COLORS.mediumGray} />
              </View>
            )}
          </View>
          
          <View style={[styles.modalRarityTag, { backgroundColor: rarityColor.bg }]}>
            <Text style={[styles.modalRarityText, { color: rarityColor.text }]}>
              {RARITY_LABELS[badge.rarity]}
            </Text>
          </View>
          
          <Text style={styles.modalBadgeName}>{badge.name}</Text>
          <Text style={styles.modalBadgeDescription}>{badge.description}</Text>
          
          {isUnlocked ? (
            <>
              <View style={styles.modalUnlocked}>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                <Text style={styles.modalUnlockedText}>
                  Unlocked {userBadge?.unlockedAt ? new Date(userBadge.unlockedAt).toLocaleDateString() : ''}
                </Text>
              </View>
              
              {/* Share Button */}
              <TouchableOpacity style={styles.shareButton} onPress={onShare}>
                <LinearGradient
                  colors={badge.gradient as any}
                  style={styles.shareButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="share-social" size={20} color={COLORS.white} />
                  <Text style={styles.shareButtonText}>Share Achievement</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
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
          
          <View style={styles.modalXP}>
            <Ionicons name="star" size={20} color={COLORS.warning} />
            <Text style={styles.modalXPText}>{badge.xp} XP Reward</Text>
          </View>
          
          <View style={styles.modalCategory}>
            <Ionicons name={CATEGORY_INFO[badge.category].icon as any} size={16} color={COLORS.mediumGray} />
            <Text style={styles.modalCategoryText}>
              {CATEGORY_INFO[badge.category].label}{badge.tier ? ` • Tier ${badge.tier}` : ''}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Island Selector Modal
const IslandSelectorModal = ({ 
  visible, 
  onClose, 
  currentIsland,
  completedCount,
}: { 
  visible: boolean; 
  onClose: () => void; 
  currentIsland: number;
  completedCount: number;
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.islandModalOverlay}>
        <View style={styles.islandModalContent}>
          <View style={styles.islandModalHeader}>
            <Text style={styles.islandModalTitle}>Your Journey</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.mediumGray} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.islandModalSubtitle}>
            {completedCount} badges collected • Island {currentIsland} of 10
          </Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.islandScroll}
            snapToInterval={SCREEN_WIDTH * 0.7 + 16}
            decelerationRate="fast"
          >
            {ISLANDS.map((island) => {
              const isUnlocked = completedCount >= island.requiredBadges;
              const isCurrent = island.id === currentIsland;
              
              return (
                <IslandCard
                  key={island.id}
                  island={island}
                  isCurrentIsland={isCurrent}
                  isUnlocked={isUnlocked}
                  onPress={onClose}
                />
              );
            })}
          </ScrollView>
          
          <View style={styles.islandLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
              <Text style={styles.legendText}>Unlocked</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.mediumGray }]} />
              <Text style={styles.legendText}>Locked</Text>
            </View>
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
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.celebrationOverlay}>
        <Animated.View style={[styles.celebrationContent, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.celebrationEmoji}>🏆</Text>
          <Text style={styles.celebrationTitle}>Badge{badges.length > 1 ? 's' : ''} Unlocked!</Text>
          
          {badges.map((badge) => (
            <View key={badge.id} style={styles.celebrationBadge}>
              <LinearGradient
                colors={badge.gradient as any}
                style={styles.celebrationIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name={badge.icon as any} size={36} color={COLORS.white} />
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
    currentIsland,
    loadUserBadges, 
    checkBadges, 
    clearNewlyUnlocked,
    getNextUnlocks,
    getCompletedCount,
    getCurrentIsland,
    getIslandProgress,
  } = useAwardsStore();
  
  const { completedWorkouts, weekWorkouts, stats } = useWorkoutStore();
  
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showIslandSelector, setShowIslandSelector] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'incomplete'>('all');
  const [categoryFilter, setCategoryFilter] = useState<BadgeCategory | 'all'>('all');
  
  useEffect(() => {
    loadUserBadges();
  }, []);
  
  useEffect(() => {
    const checkForBadges = async () => {
      const allCompleted = [
        ...completedWorkouts,
        ...weekWorkouts.filter(w => w.completed && !w.isRestDay)
      ].filter((w, i, self) => i === self.findIndex(x => x.id === w.id));
      
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
  
  useEffect(() => {
    if (newlyUnlocked.length > 0) {
      setShowCelebration(true);
    }
  }, [newlyUnlocked]);
  
  const handleCelebrationClose = () => {
    setShowCelebration(false);
    clearNewlyUnlocked();
  };
  
  const handleShare = async () => {
    if (!selectedBadge) return;
    
    try {
      await Share.share({
        message: `🏆 I just unlocked the "${selectedBadge.name}" badge on Thryvin! ${selectedBadge.description} #Thryvin #FitnessGoals`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };
  
  const island = getCurrentIsland();
  const islandProgress = getIslandProgress();
  const completedCount = getCompletedCount();
  const nextUnlocks = getNextUnlocks();
  const newlyUnlockedBadges = BADGE_DEFINITIONS.filter(b => newlyUnlocked.includes(b.id));
  
  // Filter badges
  let filteredBadges = BADGE_DEFINITIONS;
  
  if (categoryFilter !== 'all') {
    filteredBadges = filteredBadges.filter(b => b.category === categoryFilter);
  }
  
  if (filter === 'completed') {
    filteredBadges = filteredBadges.filter(b => 
      userBadges.find(ub => ub.badgeId === b.id)?.completed
    );
  } else if (filter === 'incomplete') {
    filteredBadges = filteredBadges.filter(b => 
      !userBadges.find(ub => ub.badgeId === b.id)?.completed
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <AppHeader mode="fitness" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Island Banner - Tappable */}
        <TouchableOpacity onPress={() => setShowIslandSelector(true)} activeOpacity={0.9}>
          <LinearGradient
            colors={island.gradient as any}
            style={styles.islandBanner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.islandBannerContent}>
              <Text style={styles.islandBannerEmoji}>{island.emoji}</Text>
              <View style={styles.islandBannerInfo}>
                <Text style={styles.islandBannerName}>{island.name}</Text>
                <Text style={styles.islandBannerSubtitle}>{island.subtitle}</Text>
              </View>
              <View style={styles.islandBannerStats}>
                <Text style={styles.islandBannerXP}>{totalXP}</Text>
                <Text style={styles.islandBannerXPLabel}>XP</Text>
              </View>
            </View>
            
            {/* Progress to next island */}
            <View style={styles.islandProgressSection}>
              <View style={styles.islandProgressBar}>
                <View style={[styles.islandProgressFill, { width: `${islandProgress.percentage}%` }]} />
              </View>
              <Text style={styles.islandProgressText}>
                {currentIsland < 10 
                  ? `${islandProgress.current}/${islandProgress.required} badges to next island`
                  : 'Max level reached! 🌟'}
              </Text>
            </View>
            
            <View style={styles.tapHint}>
              <Text style={styles.tapHintText}>Tap to view all islands</Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.8)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
        
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{completedCount}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{currentIsland}/10</Text>
            <Text style={styles.statLabel}>Island</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{island.xpMultiplier}x</Text>
            <Text style={styles.statLabel}>XP Bonus</Text>
          </View>
        </View>
        
        {/* Next Unlocks */}
        {nextUnlocks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔥 Almost There</Text>
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
                  isAvailable={true}
                />
              )}
              keyExtractor={item => item.badge.id}
            />
          </View>
        )}
        
        {/* Filters */}
        <View style={styles.filterSection}>
          {/* Status Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {(['all', 'completed', 'incomplete'] as const).map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, filter === f && styles.filterChipActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                  {f === 'all' ? 'All' : f === 'completed' ? '✅ Completed' : '🔒 In Progress'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Category Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.categoryChip, categoryFilter === 'all' && styles.categoryChipActive]}
              onPress={() => setCategoryFilter('all')}
            >
              <Ionicons name="grid" size={14} color={categoryFilter === 'all' ? COLORS.white : COLORS.text} />
              <Text style={[styles.categoryChipText, categoryFilter === 'all' && styles.categoryChipTextActive]}>All</Text>
            </TouchableOpacity>
            
            {(Object.keys(CATEGORY_INFO) as BadgeCategory[]).map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, categoryFilter === cat && styles.categoryChipActive]}
                onPress={() => setCategoryFilter(cat)}
              >
                <Ionicons 
                  name={CATEGORY_INFO[cat].icon as any} 
                  size={14} 
                  color={categoryFilter === cat ? COLORS.white : COLORS.text} 
                />
                <Text style={[styles.categoryChipText, categoryFilter === cat && styles.categoryChipTextActive]}>
                  {CATEGORY_INFO[cat].label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Badge Grid */}
        <View style={styles.badgeGrid}>
          {filteredBadges.map(badge => {
            const isAvailable = !badge.islandRequired || badge.islandRequired <= currentIsland;
            return (
              <BadgeCard
                key={badge.id}
                badge={badge}
                userBadge={userBadges.find(ub => ub.badgeId === badge.id)}
                onPress={() => setSelectedBadge(badge)}
                isAvailable={isAvailable}
              />
            );
          })}
        </View>
        
        {filteredBadges.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={64} color={COLORS.mediumGray} />
            <Text style={styles.emptyStateText}>No badges match your filters</Text>
          </View>
        )}
        
        <View style={{ height: 32 }} />
      </ScrollView>
      
      {/* Modals */}
      <IslandSelectorModal
        visible={showIslandSelector}
        onClose={() => setShowIslandSelector(false)}
        currentIsland={currentIsland}
        completedCount={completedCount}
      />
      
      <BadgeDetailModal
        visible={!!selectedBadge}
        onClose={() => setSelectedBadge(null)}
        badge={selectedBadge}
        userBadge={userBadges.find(ub => ub.badgeId === selectedBadge?.id)}
        onShare={handleShare}
      />
      
      <UnlockCelebrationModal
        visible={showCelebration}
        onClose={handleCelebrationClose}
        badges={newlyUnlockedBadges}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  scrollView: { flex: 1 },
  
  // Island Banner
  islandBanner: {
    margin: 16,
    borderRadius: 20,
    padding: 20,
    ...CARD_SHADOW,
  },
  islandBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  islandBannerEmoji: {
    fontSize: 48,
  },
  islandBannerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  islandBannerName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
  },
  islandBannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  islandBannerStats: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  islandBannerXP: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
  },
  islandBannerXPLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  islandProgressSection: {
    marginTop: 16,
  },
  islandProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  islandProgressFill: {
    height: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 3,
  },
  islandProgressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
    textAlign: 'center',
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  tapHintText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    ...CARD_SHADOW,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 8,
  },
  
  // Section
  section: {
    marginTop: 24,
    marginBottom: 8,
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
  
  // Filters
  filterSection: {
    marginTop: 16,
  },
  filterRow: {
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.gradientStart,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: COLORS.gradientStart,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text,
    marginLeft: 5,
  },
  categoryChipTextActive: {
    color: COLORS.white,
  },
  
  // Badge Grid
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginTop: 8,
  },
  badgeCard: {
    width: (SCREEN_WIDTH - 40) / 2,
    marginBottom: 12,
    marginHorizontal: 4,
  },
  badgeCardInner: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    minHeight: 160,
    ...CARD_SHADOW,
  },
  badgeCardLocked: {
    backgroundColor: '#FAFAFA',
  },
  badgeCardUnavailable: {
    opacity: 0.5,
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
    fontSize: 9,
    fontWeight: '600',
  },
  badgeIconContainer: {
    marginTop: 8,
    marginBottom: 10,
  },
  badgeIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeIconLocked: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  badgeNameLocked: {
    color: COLORS.mediumGray,
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unlockedText: {
    fontSize: 11,
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
    height: 5,
    backgroundColor: '#E8E8E8',
    borderRadius: 2.5,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  progressText: {
    fontSize: 10,
    color: COLORS.mediumGray,
  },
  lockedSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockedText: {
    fontSize: 10,
    color: COLORS.mediumGray,
    marginLeft: 4,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  xpText: {
    fontSize: 10,
    color: COLORS.warning,
    fontWeight: '600',
    marginLeft: 3,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.mediumGray,
  },
  
  // Island Selector Modal
  islandModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  islandModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  islandModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  islandModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  islandModalSubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  islandScroll: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  islandCard: {
    width: SCREEN_WIDTH * 0.7,
    marginRight: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  islandCardCurrent: {
    borderWidth: 3,
    borderColor: COLORS.gradientStart,
  },
  islandCardGradient: {
    padding: 24,
    alignItems: 'center',
    minHeight: 180,
    justifyContent: 'center',
  },
  islandEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  islandCardName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
  },
  islandCardSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: 4,
  },
  currentBadge: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
  islandCardLocked: {
    padding: 24,
    alignItems: 'center',
    minHeight: 180,
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
  },
  islandLockedName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.mediumGray,
    marginTop: 12,
  },
  islandLockedReq: {
    fontSize: 13,
    color: COLORS.mediumGray,
    marginTop: 4,
  },
  islandLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 16,
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  
  // Badge Detail Modal
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
    minHeight: 380,
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  modalIconContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  modalIconGradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalIconLocked: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalRarityTag: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 10,
  },
  modalRarityText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalBadgeName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  modalBadgeDescription: {
    fontSize: 15,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  modalUnlocked: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalUnlockedText: {
    fontSize: 15,
    color: COLORS.success,
    fontWeight: '500',
    marginLeft: 8,
  },
  shareButton: {
    width: '100%',
    marginTop: 8,
    marginBottom: 12,
  },
  shareButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 8,
  },
  modalProgress: {
    width: '100%',
    marginBottom: 12,
  },
  modalProgressLabel: {
    fontSize: 13,
    color: COLORS.mediumGray,
    marginBottom: 8,
  },
  modalProgressBar: {
    height: 8,
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  modalProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  modalProgressText: {
    fontSize: 13,
    color: COLORS.text,
    textAlign: 'center',
  },
  modalXP: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalXPText: {
    fontSize: 15,
    color: COLORS.warning,
    fontWeight: '600',
    marginLeft: 6,
  },
  modalCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalCategoryText: {
    fontSize: 13,
    color: COLORS.mediumGray,
    marginLeft: 5,
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
    padding: 28,
    alignItems: 'center',
    margin: 32,
    width: SCREEN_WIDTH - 64,
  },
  celebrationEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  celebrationTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
  },
  celebrationBadge: {
    alignItems: 'center',
    marginBottom: 16,
  },
  celebrationIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  celebrationBadgeName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  celebrationXP: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  celebrationXPText: {
    fontSize: 15,
    color: COLORS.warning,
    fontWeight: '600',
    marginLeft: 5,
  },
  celebrationButton: {
    marginTop: 12,
    width: '100%',
  },
  celebrationButtonGradient: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  celebrationButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.white,
  },
});
