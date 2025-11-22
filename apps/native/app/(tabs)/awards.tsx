import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../../src/components/AppHeader';
import { COLORS, CARD_SHADOW } from '../../src/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Achievement Categories
const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'grid', gradient: [COLORS.gradientStart, COLORS.gradientEnd] },
  { id: 'strength', label: 'Strength', icon: 'barbell', gradient: ['#FF3B30', '#FF9500'] },
  { id: 'consistency', label: 'Streak', icon: 'flame', gradient: ['#FF6B35', '#FFD60A'] },
  { id: 'social', label: 'Social', icon: 'people', gradient: ['#34C759', '#00C7BE'] },
  { id: 'milestones', label: 'Milestones', icon: 'trophy', gradient: ['#FFD700', '#FFA500'] },
];

// Achievements Data with categories
const ACHIEVEMENTS = [
  // Milestones
  {
    id: 1,
    title: 'First Steps',
    description: 'Complete your first workout',
    category: 'milestones',
    earned: true,
    earnedDate: 'Jan 15, 2024',
    icon: 'walk',
    gradient: ['#FFD700', '#FFA500'],
    xp: 50,
    rarity: 'common',
  },
  {
    id: 2,
    title: 'Century Club',
    description: 'Complete 100 workouts',
    category: 'milestones',
    earned: false,
    progress: 65,
    total: 100,
    icon: 'star',
    gradient: ['#A22BF6', '#FF4EC7'],
    xp: 500,
    rarity: 'legendary',
  },
  
  // Streak/Consistency
  {
    id: 3,
    title: 'Week Warrior',
    description: 'Train 7 days in a row',
    category: 'consistency',
    earned: true,
    earnedDate: 'Jan 22, 2024',
    icon: 'flame',
    gradient: ['#FF6B35', '#FFD60A'],
    xp: 100,
    rarity: 'rare',
  },
  {
    id: 4,
    title: 'Consistency King',
    description: 'Train 30 days straight',
    category: 'consistency',
    earned: false,
    progress: 15,
    total: 30,
    icon: 'flame-outline',
    gradient: ['#FF3B30', '#FF9500'],
    xp: 300,
    rarity: 'epic',
  },
  {
    id: 5,
    title: 'Year of Gains',
    description: 'Train 365 days in a year',
    category: 'consistency',
    earned: false,
    progress: 127,
    total: 365,
    icon: 'calendar',
    gradient: ['#FFD700', '#FFA500'],
    xp: 1000,
    rarity: 'legendary',
  },
  
  // Strength
  {
    id: 6,
    title: 'Strength Novice',
    description: 'Lift 1,000 total lbs',
    category: 'strength',
    earned: true,
    earnedDate: 'Feb 5, 2024',
    icon: 'barbell',
    gradient: ['#FF3B30', '#FF9500'],
    xp: 100,
    rarity: 'common',
  },
  {
    id: 7,
    title: 'Powerhouse',
    description: 'Bench press 2x bodyweight',
    category: 'strength',
    earned: false,
    progress: 180,
    total: 200,
    icon: 'fitness',
    gradient: ['#A22BF6', '#FF4EC7'],
    xp: 400,
    rarity: 'epic',
  },
  {
    id: 8,
    title: 'Deadlift Demon',
    description: 'Deadlift 3x bodyweight',
    category: 'strength',
    earned: false,
    progress: 225,
    total: 300,
    icon: 'barbell-outline',
    gradient: ['#FF6B35', '#FFD60A'],
    xp: 500,
    rarity: 'legendary',
  },
  
  // Social
  {
    id: 9,
    title: 'First Friend',
    description: 'Make your first connection',
    category: 'social',
    earned: true,
    earnedDate: 'Jan 18, 2024',
    icon: 'people',
    gradient: ['#34C759', '#00C7BE'],
    xp: 50,
    rarity: 'common',
  },
  {
    id: 10,
    title: 'Social Butterfly',
    description: 'Get 100 likes on posts',
    category: 'social',
    earned: false,
    progress: 45,
    total: 100,
    icon: 'heart',
    gradient: ['#FF4EC7', '#A22BF6'],
    xp: 200,
    rarity: 'rare',
  },
  {
    id: 11,
    title: 'Influencer',
    description: 'Reach 1,000 followers',
    category: 'social',
    earned: false,
    progress: 234,
    total: 1000,
    icon: 'trending-up',
    gradient: ['#5B8DEF', '#34C4E5'],
    xp: 750,
    rarity: 'legendary',
  },
  
  // More Milestones
  {
    id: 12,
    title: 'Early Bird',
    description: 'Complete 10 morning workouts',
    category: 'milestones',
    earned: true,
    earnedDate: 'Feb 1, 2024',
    icon: 'sunny',
    gradient: ['#FFD60A', '#FFED4E'],
    xp: 150,
    rarity: 'rare',
  },
  {
    id: 13,
    title: 'Night Owl',
    description: 'Complete 10 evening workouts',
    category: 'milestones',
    earned: false,
    progress: 6,
    total: 10,
    icon: 'moon',
    gradient: ['#5B8DEF', '#34C4E5'],
    xp: 150,
    rarity: 'rare',
  },
];

const RARITY_COLORS: any = {
  common: ['#8E8E93', '#C7C7CC'],
  rare: ['#5B8DEF', '#34C4E5'],
  epic: ['#A22BF6', '#FF4EC7'],
  legendary: ['#FFD700', '#FFA500'],
};

export default function AwardsScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [scaleAnim] = useState(new Animated.Value(1));

  const filteredAchievements = selectedCategory === 'all' 
    ? ACHIEVEMENTS 
    : ACHIEVEMENTS.filter(a => a.category === selectedCategory);

  const earnedCount = ACHIEVEMENTS.filter(a => a.earned).length;
  const totalXP = ACHIEVEMENTS.filter(a => a.earned).reduce((sum, a) => sum + a.xp, 0);
  const currentStreak = 15;

  const handleCategoryPress = (categoryId: string) => {
    // Bounce animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    setSelectedCategory(categoryId);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Awards & Achievements" showProfile />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Stats Banner */}
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statsBanner}
        >
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="star" size={32} color={COLORS.white} />
              <Text style={styles.statValue}>{totalXP.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="trophy" size={32} color={COLORS.white} />
              <Text style={styles.statValue}>{earnedCount}/{ACHIEVEMENTS.length}</Text>
              <Text style={styles.statLabel}>Unlocked</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="flame" size={32} color={COLORS.white} />
              <Text style={styles.statValue}>{currentStreak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map((category) => {
            const isActive = selectedCategory === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                onPress={() => handleCategoryPress(category.id)}
                activeOpacity={0.8}
              >
                {isActive ? (
                  <LinearGradient
                    colors={category.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.categoryButton}
                  >
                    <Ionicons name={category.icon as any} size={20} color={COLORS.white} />
                    <Text style={styles.categoryTextActive}>{category.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.categoryButtonInactive}>
                    <Ionicons name={category.icon as any} size={20} color={COLORS.mediumGray} />
                    <Text style={styles.categoryTextInactive}>{category.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Achievements Grid */}
        <View style={styles.achievementsGrid}>
          {filteredAchievements.map((achievement, index) => (
            <AchievementCard key={achievement.id} achievement={achievement} index={index} />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Achievement Card Component
const AchievementCard = ({ achievement, index }: any) => {
  const [scaleAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: index * 50,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  const progressPercent = achievement.progress 
    ? (achievement.progress / achievement.total) * 100 
    : 0;

  return (
    <Animated.View style={[styles.achievementCard, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.achievementTouchable}
      >
        <LinearGradient
          colors={achievement.earned ? achievement.gradient : ['#F8F9FA', '#E8E8E8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.achievementGradient,
            !achievement.earned && styles.achievementLocked,
          ]}
        >
          {/* Rarity Badge */}
          <View style={[styles.rarityBadge, { backgroundColor: RARITY_COLORS[achievement.rarity][0] }]}>
            <Text style={styles.rarityText}>{achievement.rarity.toUpperCase()}</Text>
          </View>

          {/* Icon */}
          <View style={[
            styles.achievementIcon,
            !achievement.earned && styles.achievementIconLocked,
          ]}>
            <Ionicons
              name={achievement.icon as any}
              size={48}
              color={achievement.earned ? COLORS.white : COLORS.mediumGray}
            />
          </View>

          {/* Title & Description */}
          <Text style={[
            styles.achievementTitle,
            !achievement.earned && styles.achievementTitleLocked,
          ]}>
            {achievement.title}
          </Text>
          <Text style={[
            styles.achievementDescription,
            !achievement.earned && styles.achievementDescriptionLocked,
          ]}>
            {achievement.description}
          </Text>

          {/* Progress Bar or Earned Date */}
          {achievement.earned ? (
            <View style={styles.earnedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.white} />
              <Text style={styles.earnedText}>Earned {achievement.earnedDate}</Text>
            </View>
          ) : achievement.progress !== undefined ? (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={achievement.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${progressPercent}%` }]}
                />
              </View>
              <Text style={styles.progressText}>
                {achievement.progress}/{achievement.total}
              </Text>
            </View>
          ) : null}

          {/* XP Badge */}
          <View style={styles.xpBadge}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.xpText}>{achievement.xp} XP</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  statsBanner: {
    margin: 16,
    borderRadius: 24,
    padding: 24,
    ...CARD_SHADOW,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoriesScroll: {
    marginTop: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  categoryButtonInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: COLORS.lightGray,
    gap: 8,
  },
  categoryTextActive: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  categoryTextInactive: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  achievementsGrid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    width: (SCREEN_WIDTH - 44) / 2,
  },
  achievementTouchable: {
    borderRadius: 20,
    overflow: 'hidden',
    ...CARD_SHADOW,
  },
  achievementGradient: {
    padding: 16,
    minHeight: 240,
    position: 'relative',
  },
  achievementLocked: {
    opacity: 0.6,
  },
  rarityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  achievementIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  achievementIconLocked: {
    backgroundColor: COLORS.lightGray,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementTitleLocked: {
    color: COLORS.text,
  },
  achievementDescription: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 12,
    minHeight: 32,
  },
  achievementDescriptionLocked: {
    color: COLORS.mediumGray,
  },
  earnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  earnedText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.mediumGray,
    textAlign: 'center',
  },
  xpBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  xpText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
});
