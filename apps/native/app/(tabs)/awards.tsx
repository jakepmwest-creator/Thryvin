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

const CATEGORY_INFO: Record<BadgeCategory, { label: string; icon: string }> = {
  consistency: { label: 'Consistency', icon: 'flame' },
  volume: { label: 'Volume', icon: 'barbell' },
  focus: { label: 'Focus', icon: 'body' },
  program: { label: 'Program', icon: 'trophy' },
  challenge: { label: 'Challenge', icon: 'flash' },
};

// Island Visual Component - Actual island graphic
const IslandVisual = ({ island, isUnlocked, isCurrent }: { island: Island; isUnlocked: boolean; isCurrent: boolean }) => {
  const colors = island.landscapeColors;
  
  return (
    <View style={[islandStyles.islandContainer, !isUnlocked && islandStyles.islandLocked]}>
      {/* Sky */}
      <View style={[islandStyles.sky, { backgroundColor: isUnlocked ? colors.sky : '#D0D0D0' }]} />
      
      {/* Island Shape */}
      <View style={islandStyles.islandShape}>
        {/* Mountain/Hill */}
        <View style={[
          islandStyles.mountain,
          { 
            backgroundColor: isUnlocked ? colors.ground : '#A0A0A0',
            borderBottomColor: isUnlocked ? colors.ground : '#A0A0A0',
          }
        ]} />
        
        {/* Ground */}
        <View style={[
          islandStyles.ground,
          { backgroundColor: isUnlocked ? colors.ground : '#B0B0B0' }
        ]} />
        
        {/* Accent (flag/star on top) */}
        {isUnlocked && (
          <View style={islandStyles.flagContainer}>
            <Text style={islandStyles.islandEmoji}>{island.emoji}</Text>
          </View>
        )}
        
        {!isUnlocked && (
          <View style={islandStyles.lockOverlay}>
            <Ionicons name="lock-closed" size={40} color="#666" />
          </View>
        )}
      </View>
      
      {/* Island Info */}
      <View style={islandStyles.islandInfo}>
        <Text style={[islandStyles.islandName, !isUnlocked && islandStyles.islandNameLocked]}>
          {island.name}
        </Text>
        <Text style={[islandStyles.islandSubtitle, !isUnlocked && islandStyles.islandSubtitleLocked]}>
          {isUnlocked ? island.subtitle : `${island.requiredBadges} badges to unlock`}
        </Text>
        {isCurrent && (
          <View style={islandStyles.currentTag}>
            <Text style={islandStyles.currentTagText}>YOU ARE HERE</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const islandStyles = StyleSheet.create({
  islandContainer: {
    width: SCREEN_WIDTH - 48,
    height: 200,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  islandLocked: {
    opacity: 0.6,
  },
  sky: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  islandShape: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    height: 100,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  mountain: {
    width: 0,
    height: 0,
    borderLeftWidth: 80,
    borderRightWidth: 80,
    borderBottomWidth: 70,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    position: 'absolute',
    top: 0,
  },
  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
  flagContainer: {
    position: 'absolute',
    top: -20,
  },
  islandEmoji: {
    fontSize: 36,
  },
  lockOverlay: {
    position: 'absolute',
    top: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  islandInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 12,
    alignItems: 'center',
  },
  islandName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  islandNameLocked: {
    color: COLORS.mediumGray,
  },
  islandSubtitle: {
    fontSize: 13,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  islandSubtitleLocked: {
    color: '#999',
  },
  currentTag: {
    marginTop: 8,
    backgroundColor: COLORS.gradientStart,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
});

// Badge Card
const BadgeCard = ({ badge, userBadge, onPress, isAvailable }: { badge: Badge; userBadge?: UserBadge; onPress: () => void; isAvailable: boolean }) => {
  const isUnlocked = userBadge?.completed;
  const progress = userBadge?.progress || 0;
  const progressPercent = Math.min((progress / badge.targetValue) * 100, 100);
  const rarityColor = RARITY_COLORS[badge.rarity];
  
  return (
    <TouchableOpacity style={styles.badgeCard} onPress={onPress} activeOpacity={0.8} disabled={!isAvailable}>
      <View style={[styles.badgeCardInner, !isUnlocked && styles.badgeCardLocked, !isAvailable && styles.badgeCardUnavailable, isUnlocked && { borderColor: rarityColor.border, borderWidth: 2 }]}>
        <View style={[styles.rarityTag, { backgroundColor: rarityColor.bg }]}>
          <Text style={[styles.rarityText, { color: rarityColor.text }]}>{RARITY_LABELS[badge.rarity]}</Text>
        </View>
        
        <View style={styles.badgeIconContainer}>
          {isUnlocked ? (
            <LinearGradient colors={badge.gradient as any} style={styles.badgeIconGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name={badge.icon as any} size={26} color={COLORS.white} />
            </LinearGradient>
          ) : (
            <View style={[styles.badgeIconLocked, !isAvailable && { opacity: 0.4 }]}>
              <Ionicons name={badge.icon as any} size={26} color={COLORS.mediumGray} />
            </View>
          )}
        </View>
        
        <Text style={[styles.badgeName, !isUnlocked && styles.badgeNameLocked]} numberOfLines={1}>{badge.name}</Text>
        
        {isUnlocked ? (
          <View style={styles.unlockedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
            <Text style={styles.unlockedText}>Done</Text>
          </View>
        ) : isAvailable ? (
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <LinearGradient colors={badge.gradient as any} style={[styles.progressFill, { width: `${progressPercent}%` }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            </View>
            <Text style={styles.progressText}>{progress}/{badge.targetValue}</Text>
          </View>
        ) : (
          <View style={styles.lockedSection}>
            <Ionicons name="lock-closed" size={11} color={COLORS.mediumGray} />
            <Text style={styles.lockedText}>Island {badge.island}</Text>
          </View>
        )}
        
        <View style={styles.xpBadge}>
          <Ionicons name="star" size={10} color={COLORS.warning} />
          <Text style={styles.xpText}>{badge.xp}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Island Selector Modal (Vertical Scroll)
const IslandSelectorModal = ({ visible, onClose, currentIsland, completedCount }: { visible: boolean; onClose: () => void; currentIsland: number; completedCount: number }) => {
  const scrollRef = useRef<ScrollView>(null);
  
  useEffect(() => {
    if (visible && scrollRef.current) {
      // Scroll to current island
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: (currentIsland - 1) * 220, animated: true });
      }, 300);
    }
  }, [visible, currentIsland]);
  
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.islandModalOverlay}>
        <View style={styles.islandModalContent}>
          <View style={styles.islandModalHeader}>
            <Text style={styles.islandModalTitle}>Your Journey</Text>
            <TouchableOpacity onPress={onClose} style={styles.islandModalClose}>
              <Ionicons name="close" size={24} color={COLORS.mediumGray} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.islandModalSubtitle}>
            {completedCount} badges • Island {currentIsland} of 10
          </Text>
          
          <ScrollView 
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.islandScrollContent}
          >
            {ISLANDS.map((island) => {
              const isUnlocked = completedCount >= island.requiredBadges;
              const isCurrent = island.id === currentIsland;
              return (
                <IslandVisual
                  key={island.id}
                  island={island}
                  isUnlocked={isUnlocked}
                  isCurrent={isCurrent}
                />
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Badge Detail Modal
const BadgeDetailModal = ({ visible, onClose, badge, userBadge, onShare }: { visible: boolean; onClose: () => void; badge: Badge | null; userBadge?: UserBadge; onShare: () => void }) => {
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
          
          <View style={styles.modalIconContainer}>
            {isUnlocked ? (
              <LinearGradient colors={badge.gradient as any} style={styles.modalIconGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name={badge.icon as any} size={52} color={COLORS.white} />
              </LinearGradient>
            ) : (
              <View style={styles.modalIconLocked}>
                <Ionicons name={badge.icon as any} size={52} color={COLORS.mediumGray} />
              </View>
            )}
          </View>
          
          <View style={[styles.modalRarityTag, { backgroundColor: rarityColor.bg }]}>
            <Text style={[styles.modalRarityText, { color: rarityColor.text }]}>{RARITY_LABELS[badge.rarity]}</Text>
          </View>
          
          <Text style={styles.modalBadgeName}>{badge.name}</Text>
          <Text style={styles.modalBadgeDescription}>{badge.description}</Text>
          
          {isUnlocked ? (
            <>
              <View style={styles.modalUnlocked}>
                <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
                <Text style={styles.modalUnlockedText}>Unlocked {userBadge?.unlockedAt ? new Date(userBadge.unlockedAt).toLocaleDateString() : ''}</Text>
              </View>
              <TouchableOpacity style={styles.shareButton} onPress={onShare}>
                <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.shareButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name="share-social" size={18} color={COLORS.white} />
                  <Text style={styles.shareButtonText}>Share</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.modalProgress}>
              <Text style={styles.modalProgressLabel}>Progress</Text>
              <View style={styles.modalProgressBar}>
                <LinearGradient colors={badge.gradient as any} style={[styles.modalProgressFill, { width: `${progressPercent}%` }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              </View>
              <Text style={styles.modalProgressText}>{progress} / {badge.targetValue}</Text>
            </View>
          )}
          
          <View style={styles.modalMeta}>
            <View style={styles.modalMetaItem}>
              <Ionicons name="star" size={16} color={COLORS.warning} />
              <Text style={styles.modalMetaText}>{badge.xp} XP</Text>
            </View>
            <View style={styles.modalMetaItem}>
              <Ionicons name={CATEGORY_INFO[badge.category].icon as any} size={16} color={COLORS.mediumGray} />
              <Text style={styles.modalMetaText}>{CATEGORY_INFO[badge.category].label}</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Unlock Celebration
const UnlockCelebrationModal = ({ visible, onClose, badges }: { visible: boolean; onClose: () => void; badges: Badge[] }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }).start();
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
          <Text style={styles.celebrationTitle}>Badge Unlocked!</Text>
          {badges.slice(0, 3).map((badge) => (
            <View key={badge.id} style={styles.celebrationBadge}>
              <LinearGradient colors={badge.gradient as any} style={styles.celebrationIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name={badge.icon as any} size={32} color={COLORS.white} />
              </LinearGradient>
              <Text style={styles.celebrationBadgeName}>{badge.name}</Text>
              <Text style={styles.celebrationXPText}>+{badge.xp} XP</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.celebrationButton} onPress={onClose}>
            <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.celebrationButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.celebrationButtonText}>Awesome!</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function AwardsScreen() {
  const { userBadges, newlyUnlocked, totalXP, currentIsland, loadUserBadges, checkBadges, clearNewlyUnlocked, getCompletedCount, getCurrentIsland, getIslandProgress, getBadgesForIsland } = useAwardsStore();
  const { completedWorkouts, weekWorkouts, stats } = useWorkoutStore();
  
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showIslandSelector, setShowIslandSelector] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'incomplete'>('all');
  const [categoryFilter, setCategoryFilter] = useState<BadgeCategory | 'all'>('all');
  
  useEffect(() => { loadUserBadges(); }, []);
  
  useEffect(() => {
    const checkForBadges = async () => {
      const allCompleted = [...completedWorkouts, ...weekWorkouts.filter(w => w.completed && !w.isRestDay)].filter((w, i, self) => i === self.findIndex(x => x.id === w.id));
      const categoryCounts: Record<string, number> = { upper: 0, lower: 0, full: 0, cardio: 0, core: 0 };
      allCompleted.forEach(w => {
        const type = (w.type || '').toLowerCase();
        if (type.includes('upper') || type.includes('push') || type.includes('pull')) categoryCounts.upper++;
        else if (type.includes('lower') || type.includes('leg')) categoryCounts.lower++;
        else if (type.includes('cardio') || type.includes('hiit')) categoryCounts.cardio++;
        else if (type.includes('core')) categoryCounts.core++;
        else categoryCounts.full++;
      });
      await checkBadges({
        totalWorkouts: allCompleted.length,
        currentStreak: stats?.currentStreak || 0,
        totalSets: allCompleted.length * 15,
        totalReps: allCompleted.length * 150,
        totalMinutes: stats?.totalMinutes || allCompleted.length * 45,
        weeklyWorkouts: stats?.weeklyWorkouts || 0,
        categoryCounts,
      });
    };
    if (completedWorkouts.length > 0 || weekWorkouts.some(w => w.completed)) checkForBadges();
  }, [completedWorkouts, weekWorkouts, stats]);
  
  useEffect(() => { if (newlyUnlocked.length > 0) setShowCelebration(true); }, [newlyUnlocked]);
  
  const handleShare = async () => {
    if (!selectedBadge) return;
    try {
      await Share.share({ message: `🏆 I unlocked "${selectedBadge.name}" on Thryvin! #FitnessGoals` });
    } catch (error) { console.error('Error sharing:', error); }
  };
  
  const island = getCurrentIsland();
  const islandProgress = getIslandProgress();
  const completedCount = getCompletedCount();
  const newlyUnlockedBadges = BADGE_DEFINITIONS.filter(b => newlyUnlocked.includes(b.id));
  
  // Get badges for current island and apply filters
  let filteredBadges = BADGE_DEFINITIONS.filter(b => b.island <= currentIsland);
  
  if (categoryFilter !== 'all') filteredBadges = filteredBadges.filter(b => b.category === categoryFilter);
  if (filter === 'completed') filteredBadges = filteredBadges.filter(b => userBadges.find(ub => ub.badgeId === b.id)?.completed);
  else if (filter === 'incomplete') filteredBadges = filteredBadges.filter(b => !userBadges.find(ub => ub.badgeId === b.id)?.completed);
  
  return (
    <SafeAreaView style={styles.container}>
      <AppHeader mode="fitness" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Purple Island Banner */}
        <TouchableOpacity onPress={() => setShowIslandSelector(true)} activeOpacity={0.9}>
          <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.islandBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
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
            
            <View style={styles.islandProgressSection}>
              <View style={styles.islandProgressBar}>
                <View style={[styles.islandProgressFill, { width: `${islandProgress.percentage}%` }]} />
              </View>
              <Text style={styles.islandProgressText}>
                {currentIsland < 10 ? `${islandProgress.current}/${islandProgress.required} to next island` : 'Max level! 🌟'}
              </Text>
            </View>
            
            <View style={styles.tapHint}>
              <Text style={styles.tapHintText}>Tap to view all islands</Text>
              <Ionicons name="chevron-up" size={16} color="rgba(255,255,255,0.8)" />
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
        
        {/* Combined Filters in ONE row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {/* Status filters */}
          {(['all', 'completed', 'incomplete'] as const).map(f => (
            <TouchableOpacity key={f} style={[styles.filterChip, filter === f && categoryFilter === 'all' && styles.filterChipActive]} onPress={() => { setFilter(f); setCategoryFilter('all'); }}>
              <Text style={[styles.filterChipText, filter === f && categoryFilter === 'all' && styles.filterChipTextActive]}>
                {f === 'all' ? 'All' : f === 'completed' ? '✅ Done' : '🔓 In Progress'}
              </Text>
            </TouchableOpacity>
          ))}
          
          <View style={styles.filterDivider} />
          
          {/* Category filters */}
          {(Object.keys(CATEGORY_INFO) as BadgeCategory[]).map(cat => (
            <TouchableOpacity key={cat} style={[styles.filterChip, categoryFilter === cat && styles.filterChipActive]} onPress={() => { setCategoryFilter(cat); setFilter('all'); }}>
              <Ionicons name={CATEGORY_INFO[cat].icon as any} size={14} color={categoryFilter === cat ? COLORS.white : COLORS.text} />
              <Text style={[styles.filterChipText, categoryFilter === cat && styles.filterChipTextActive, { marginLeft: 4 }]}>
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
              isAvailable={badge.island <= currentIsland}
            />
          ))}
        </View>
        
        {filteredBadges.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={56} color={COLORS.mediumGray} />
            <Text style={styles.emptyStateText}>No badges match your filters</Text>
          </View>
        )}
        
        <View style={{ height: 32 }} />
      </ScrollView>
      
      <IslandSelectorModal visible={showIslandSelector} onClose={() => setShowIslandSelector(false)} currentIsland={currentIsland} completedCount={completedCount} />
      <BadgeDetailModal visible={!!selectedBadge} onClose={() => setSelectedBadge(null)} badge={selectedBadge} userBadge={userBadges.find(ub => ub.badgeId === selectedBadge?.id)} onShare={handleShare} />
      <UnlockCelebrationModal visible={showCelebration} onClose={() => { setShowCelebration(false); clearNewlyUnlocked(); }} badges={newlyUnlockedBadges} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  scrollView: { flex: 1 },
  
  // Island Banner (PURPLE)
  islandBanner: { margin: 16, borderRadius: 20, padding: 20 },
  islandBannerContent: { flexDirection: 'row', alignItems: 'center' },
  islandBannerEmoji: { fontSize: 44 },
  islandBannerInfo: { flex: 1, marginLeft: 14 },
  islandBannerName: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  islandBannerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  islandBannerStats: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  islandBannerXP: { fontSize: 22, fontWeight: '700', color: COLORS.white },
  islandBannerXPLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)' },
  islandProgressSection: { marginTop: 14 },
  islandProgressBar: { height: 5, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 2.5, overflow: 'hidden' },
  islandProgressFill: { height: '100%', backgroundColor: COLORS.white, borderRadius: 2.5 },
  islandProgressText: { fontSize: 11, color: 'rgba(255,255,255,0.9)', marginTop: 6, textAlign: 'center' },
  tapHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  tapHintText: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  
  // Stats Row
  statsRow: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: COLORS.white, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.lightGray, ...CARD_SHADOW },
  statBox: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.mediumGray, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: COLORS.lightGray, marginHorizontal: 8 },
  
  // Filters (ONE ROW)
  filterRow: { paddingHorizontal: 12, paddingVertical: 12, alignItems: 'center' },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, backgroundColor: COLORS.lightGray, borderRadius: 18, marginRight: 8 },
  filterChipActive: { backgroundColor: COLORS.gradientStart },
  filterChipText: { fontSize: 12, fontWeight: '500', color: COLORS.text },
  filterChipTextActive: { color: COLORS.white },
  filterDivider: { width: 1, height: 20, backgroundColor: COLORS.lightGray, marginHorizontal: 6 },
  
  // Badge Grid
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, marginTop: 4 },
  badgeCard: { width: (SCREEN_WIDTH - 36) / 2, marginBottom: 10, marginHorizontal: 4 },
  badgeCardInner: { backgroundColor: COLORS.white, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.lightGray, minHeight: 145, ...CARD_SHADOW },
  badgeCardLocked: { backgroundColor: '#FAFAFA' },
  badgeCardUnavailable: { opacity: 0.5 },
  rarityTag: { position: 'absolute', top: 6, right: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  rarityText: { fontSize: 8, fontWeight: '600' },
  badgeIconContainer: { marginTop: 6, marginBottom: 8 },
  badgeIconGradient: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  badgeIconLocked: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E8E8E8', justifyContent: 'center', alignItems: 'center' },
  badgeName: { fontSize: 12, fontWeight: '600', color: COLORS.text, textAlign: 'center', marginBottom: 5 },
  badgeNameLocked: { color: COLORS.mediumGray },
  unlockedBadge: { flexDirection: 'row', alignItems: 'center' },
  unlockedText: { fontSize: 10, color: COLORS.success, marginLeft: 3, fontWeight: '500' },
  progressSection: { width: '100%', alignItems: 'center' },
  progressBar: { width: '100%', height: 4, backgroundColor: '#E8E8E8', borderRadius: 2, overflow: 'hidden', marginBottom: 3 },
  progressFill: { height: '100%', borderRadius: 2 },
  progressText: { fontSize: 9, color: COLORS.mediumGray },
  lockedSection: { flexDirection: 'row', alignItems: 'center' },
  lockedText: { fontSize: 9, color: COLORS.mediumGray, marginLeft: 3 },
  xpBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  xpText: { fontSize: 9, color: COLORS.warning, fontWeight: '600', marginLeft: 2 },
  
  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyStateText: { marginTop: 12, fontSize: 15, color: COLORS.mediumGray },
  
  // Island Modal (Vertical Scroll)
  islandModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  islandModalContent: { flex: 1, backgroundColor: COLORS.white, marginTop: 60, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20 },
  islandModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  islandModalTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  islandModalClose: { padding: 8 },
  islandModalSubtitle: { fontSize: 14, color: COLORS.mediumGray, paddingHorizontal: 20, marginTop: 4, marginBottom: 16 },
  islandScrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  
  // Badge Detail Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, alignItems: 'center', minHeight: 340 },
  modalClose: { position: 'absolute', top: 16, right: 16, padding: 8 },
  modalIconContainer: { marginTop: 8, marginBottom: 10 },
  modalIconGradient: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  modalIconLocked: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E8E8E8', justifyContent: 'center', alignItems: 'center' },
  modalRarityTag: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  modalRarityText: { fontSize: 12, fontWeight: '600' },
  modalBadgeName: { fontSize: 20, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  modalBadgeDescription: { fontSize: 14, color: COLORS.mediumGray, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  modalUnlocked: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  modalUnlockedText: { fontSize: 14, color: COLORS.success, fontWeight: '500', marginLeft: 6 },
  shareButton: { width: '100%', marginBottom: 12 },
  shareButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12 },
  shareButtonText: { fontSize: 15, fontWeight: '600', color: COLORS.white, marginLeft: 6 },
  modalProgress: { width: '100%', marginBottom: 12 },
  modalProgressLabel: { fontSize: 12, color: COLORS.mediumGray, marginBottom: 6 },
  modalProgressBar: { height: 8, backgroundColor: '#E8E8E8', borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  modalProgressFill: { height: '100%', borderRadius: 4 },
  modalProgressText: { fontSize: 13, color: COLORS.text, textAlign: 'center' },
  modalMeta: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  modalMetaItem: { flexDirection: 'row', alignItems: 'center' },
  modalMetaText: { fontSize: 13, color: COLORS.mediumGray, marginLeft: 4 },
  
  // Celebration
  celebrationOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  celebrationContent: { backgroundColor: COLORS.white, borderRadius: 24, padding: 28, alignItems: 'center', margin: 32, width: SCREEN_WIDTH - 64 },
  celebrationEmoji: { fontSize: 52, marginBottom: 10 },
  celebrationTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  celebrationBadge: { alignItems: 'center', marginBottom: 12 },
  celebrationIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  celebrationBadgeName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  celebrationXPText: { fontSize: 14, color: COLORS.warning, fontWeight: '600', marginTop: 4 },
  celebrationButton: { marginTop: 12, width: '100%' },
  celebrationButtonGradient: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  celebrationButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.white },
});
