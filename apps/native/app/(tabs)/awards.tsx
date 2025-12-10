import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Easing,
  Alert,
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

const CATEGORY_INFO: Record<BadgeCategory, { label: string; icon: string; color: string }> = {
  consistency: { label: 'Consistency', icon: 'flame', color: '#FF6B35' },
  volume: { label: 'Volume', icon: 'barbell', color: '#5B8DEF' },
  focus: { label: 'Focus', icon: 'body', color: '#34C759' },
  program: { label: 'Program', icon: 'trophy', color: '#FFD700' },
  challenge: { label: 'Challenge', icon: 'flash', color: '#FF4EC7' },
};

// Animated floating particle component
const FloatingParticle = ({ delay, size, left }: { delay: number; size: number; left: number }) => {
  const animValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, { toValue: 1, duration: 3000 + delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(animValue, { toValue: 0, duration: 3000 + delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    };
    setTimeout(animate, delay);
  }, []);
  
  const translateY = animValue.interpolate({ inputRange: [0, 1], outputRange: [0, -15] });
  const opacity = animValue.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 0.7, 0.3] });
  
  return (
    <Animated.View style={[{ position: 'absolute', left: `${left}%`, bottom: 20, width: size, height: size, borderRadius: size / 2, backgroundColor: 'rgba(255,255,255,0.4)' }, { transform: [{ translateY }], opacity }]} />
  );
};

// Pulsing glow component for current island
const PulsingGlow = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  
  return (
    <Animated.View style={[islandStyles.pulsingGlow, { transform: [{ scale: pulseAnim }] }]}>
      <LinearGradient colors={['rgba(162, 43, 246, 0.4)', 'rgba(255, 78, 199, 0.2)', 'transparent']} style={islandStyles.pulsingGlowInner} />
    </Animated.View>
  );
};

// Beautiful Island Card for Journey Map with Themed Designs
const IslandCard = ({ island, isUnlocked, isCurrent, completedBadges, totalBadges, onPress }: { 
  island: Island; 
  isUnlocked: boolean; 
  isCurrent: boolean; 
  completedBadges: number;
  totalBadges: number;
  onPress: () => void;
}) => {
  const colors = island.landscapeColors;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  };
  
  // Get COMPLETE visual design for each island - totally unique look
  const getIslandDesign = () => {
    const baseColors = isUnlocked ? colors : { sky: '#E0E0E0', ground: '#B0B0B0', accent: '#999' };
    
    switch (island.id) {
      case 1: // Starting Line - Racing track with checkered patterns
        return {
          gradientColors: isUnlocked ? ['#87CEEB', '#FFD700', '#FFA500'] : ['#E0E0E0', '#B0B0B0'],
          borderRadius: 28,
          height: 180,
          terrain: (
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 }}>
              {/* Racing track stripes */}
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end' }}>
                <View style={{ width: '20%', height: 50, backgroundColor: isUnlocked ? '#333' : '#999' }} />
                <View style={{ width: '20%', height: 50, backgroundColor: isUnlocked ? '#FFF' : '#BBB' }} />
                <View style={{ width: '20%', height: 50, backgroundColor: isUnlocked ? '#333' : '#999' }} />
                <View style={{ width: '20%', height: 50, backgroundColor: isUnlocked ? '#FFF' : '#BBB' }} />
                <View style={{ width: '20%', height: 50, backgroundColor: isUnlocked ? '#333' : '#999' }} />
              </View>
              {/* Finish line */}
              <View style={{ position: 'absolute', right: 20, top: -30, width: 4, height: 60, backgroundColor: isUnlocked ? '#8B4513' : '#777' }} />
              <View style={{ position: 'absolute', right: 15, top: -30, width: 30, height: 25, backgroundColor: isUnlocked ? '#FFD700' : '#999', borderTopLeftRadius: 4, borderTopRightRadius: 4 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {[0,1,2,3,4,5].map(i => (
                    <View key={i} style={{ width: 10, height: 8, backgroundColor: i % 2 === 0 ? '#000' : '#FFF' }} />
                  ))}
                </View>
              </View>
            </View>
          ),
        };
        
      case 2: // Newbie Gains - Gym with dumbbells
        return {
          gradientColors: isUnlocked ? ['#FF6B35', '#FFA500', '#FFD700'] : ['#E0E0E0', '#B0B0B0'],
          borderRadius: 24,
          height: 190,
          terrain: (
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 90 }}>
              {/* Gym floor */}
              <View style={{ flex: 1, backgroundColor: isUnlocked ? '#8B4513' : '#888', borderTopLeftRadius: 20, borderTopRightRadius: 20 }} />
              {/* Big dumbbell */}
              <View style={{ position: 'absolute', bottom: 20, left: '35%', flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: isUnlocked ? '#455A64' : '#666' }} />
                <View style={{ width: 40, height: 10, backgroundColor: isUnlocked ? '#607D8B' : '#777', borderRadius: 2 }} />
                <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: isUnlocked ? '#455A64' : '#666' }} />
              </View>
              {/* Flexed arm silhouette */}
              <View style={{ position: 'absolute', right: 40, bottom: 25, width: 50, height: 45 }}>
                <View style={{ position: 'absolute', bottom: 0, left: 10, width: 30, height: 30, backgroundColor: isUnlocked ? '#FFB380' : '#999', borderTopLeftRadius: 15, borderTopRightRadius: 15, borderBottomRightRadius: 10 }} />
                <View style={{ position: 'absolute', bottom: 5, left: 15, width: 15, height: 15, backgroundColor: isUnlocked ? '#FFC9A3' : '#AAA', borderRadius: 8, opacity: 0.8 }} />
              </View>
            </View>
          ),
        };
        
      case 3: // Grind Zone - Volcanic/Fire theme
        return {
          gradientColors: isUnlocked ? ['#FF4500', '#DC143C', '#8B0000'] : ['#E0E0E0', '#B0B0B0'],
          borderRadius: 20,
          height: 195,
          terrain: (
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 95 }}>
              {/* Lava/volcanic ground */}
              <LinearGradient colors={isUnlocked ? ['#FF4500', '#8B0000'] : ['#888', '#666']} style={{ flex: 1, borderTopLeftRadius: 15, borderTopRightRadius: 15 }} />
              {/* Flames */}
              {isUnlocked && (
                <>
                  <View style={{ position: 'absolute', bottom: 30, left: 50, width: 22, height: 40, backgroundColor: '#FF6B35', borderTopLeftRadius: 11, borderTopRightRadius: 11 }} />
                  <View style={{ position: 'absolute', bottom: 30, left: 70, width: 26, height: 50, backgroundColor: '#FF4500', borderTopLeftRadius: 13, borderTopRightRadius: 13 }} />
                  <View style={{ position: 'absolute', bottom: 30, left: 94, width: 20, height: 35, backgroundColor: '#FF8C00', borderTopLeftRadius: 10, borderTopRightRadius: 10 }} />
                  {/* Inner flame glow */}
                  <View style={{ position: 'absolute', bottom: 40, left: 75, width: 16, height: 30, backgroundColor: '#FFD700', borderTopLeftRadius: 8, borderTopRightRadius: 8, opacity: 0.7 }} />
                </>
              )}
            </View>
          ),
        };
        
      case 4: // Iron Paradise - Steel/industrial
        return {
          gradientColors: isUnlocked ? ['#607D8B', '#455A64', '#263238'] : ['#E0E0E0', '#B0B0B0'],
          borderRadius: 26,
          height: 185,
          terrain: (
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 90 }}>
              {/* Metal platform */}
              <View style={{ flex: 1, backgroundColor: isUnlocked ? '#37474F' : '#888' }} />
              {/* Steel panels */}
              {isUnlocked && (
                <>
                  <View style={{ position: 'absolute', top: 10, left: 10, width: 30, height: 30, backgroundColor: '#546E7A', borderWidth: 2, borderColor: '#78909C', borderRadius: 4 }} />
                  <View style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, backgroundColor: '#546E7A', borderWidth: 2, borderColor: '#78909C', borderRadius: 4 }} />
                </>
              )}
              {/* Barbell */}
              <View style={{ position: 'absolute', bottom: 25, left: '25%', right: '25%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: isUnlocked ? '#455A64' : '#666', borderWidth: 3, borderColor: isUnlocked ? '#78909C' : '#888' }} />
                <View style={{ width: 80, height: 8, backgroundColor: isUnlocked ? '#607D8B' : '#777', borderRadius: 4, marginHorizontal: 2 }} />
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: isUnlocked ? '#455A64' : '#666', borderWidth: 3, borderColor: isUnlocked ? '#78909C' : '#888' }} />
              </View>
            </View>
          ),
        };
        
      default:
        return {
          gradientColors: [baseColors.sky, baseColors.ground],
          borderRadius: 24,
          height: 170,
          terrain: (
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 70 }}>
              <View style={{ flex: 1, backgroundColor: baseColors.ground, borderTopLeftRadius: 20, borderTopRightRadius: 20 }} />
            </View>
          ),
        };
    }
  };
  
  const design = getIslandDesign();
  
  return (
    <TouchableOpacity 
      onPress={onPress} 
      onPressIn={handlePressIn} 
      onPressOut={handlePressOut}
      activeOpacity={1}
      disabled={!isUnlocked}
    >
      <Animated.View style={[islandStyles.islandCard, { transform: [{ scale: scaleAnim }], borderRadius: design.borderRadius }]}>
        <LinearGradient
          colors={design.gradientColors}
          style={[islandStyles.islandGradient, { height: design.height, borderTopLeftRadius: design.borderRadius, borderTopRightRadius: design.borderRadius }, isCurrent && islandStyles.islandCurrentBorder]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          {/* Clouds (only for unlocked islands) */}
          {isUnlocked && island.id !== 3 && ( // No clouds in fire island
            <>
              <View style={[islandStyles.cloud, { top: 20, left: 25 }]} />
              <View style={[islandStyles.cloud, { top: 30, right: 35, transform: [{ scale: 0.75 }] }]} />
            </>
          )}
          
          {/* Unique terrain design per island */}
          {design.terrain}
          
          {/* Island emoji badge */}
          <View style={[islandStyles.emojiContainer, !isUnlocked && { opacity: 0.5 }, { backgroundColor: isUnlocked ? 'rgba(255,255,255,0.95)' : 'rgba(200,200,200,0.8)' }]}>
            <Text style={islandStyles.islandEmoji}>{island.emoji}</Text>
          </View>
          
          {/* Lock overlay */}
          {!isUnlocked && (
            <View style={islandStyles.lockOverlay}>
              <View style={islandStyles.lockBadge}>
                <Ionicons name="lock-closed" size={24} color="#666" />
              </View>
            </View>
          )}
          
          {/* Current indicator */}
          {isCurrent && (
            <View style={islandStyles.youAreHereTag}>
              <Ionicons name="location" size={10} color={COLORS.white} />
              <Text style={islandStyles.youAreHereText}>YOU ARE HERE</Text>
            </View>
          )}
        </LinearGradient>
        
        {/* Island info footer */}
        <View style={islandStyles.islandInfo}>
          <View style={islandStyles.islandNameRow}>
            <Text style={[islandStyles.islandName, !isUnlocked && islandStyles.textLocked]} numberOfLines={1}>
              {island.name}
            </Text>
            <View style={[islandStyles.xpBadge, !isUnlocked && { opacity: 0.5 }]}>
              <Text style={islandStyles.xpText}>{island.xpMultiplier}x XP</Text>
            </View>
          </View>
          <Text style={[islandStyles.islandSubtitle, !isUnlocked && islandStyles.textLocked]}>
            {isUnlocked ? island.subtitle : `Unlock with ${island.requiredBadges} badges`}
          </Text>
          
          {/* Progress for this island */}
          {isUnlocked && (
            <View style={islandStyles.badgeProgress}>
              <View style={islandStyles.badgeProgressBar}>
                <View style={[islandStyles.badgeProgressFill, { width: `${totalBadges > 0 ? (completedBadges / totalBadges) * 100 : 0}%` }]} />
              </View>
              <Text style={islandStyles.badgeProgressText}>{completedBadges}/{totalBadges} badges</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Connector line between islands - Gradient Progress Bar
const IslandConnector = ({ isCompleted }: { isCompleted: boolean }) => (
  <View style={islandStyles.connectorContainer}>
    {isCompleted ? (
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={islandStyles.connectorLineGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={[islandStyles.connectorDot, { top: 0 }]} />
        <View style={[islandStyles.connectorDot, { top: '50%' }]} />
        <View style={[islandStyles.connectorDot, { bottom: 0 }]} />
      </LinearGradient>
    ) : (
      <View style={islandStyles.connectorLine} />
    )}
  </View>
);

const islandStyles = StyleSheet.create({
  // Pulsing glow
  pulsingGlow: { position: 'absolute', top: -20, left: -20, right: -20, bottom: -20, zIndex: -1 },
  pulsingGlowInner: { flex: 1, borderRadius: 30 },
  
  // Island card - base (will be customized per island)
  islandCard: { width: SCREEN_WIDTH - 56, marginBottom: 8, borderRadius: 28, overflow: 'visible', alignSelf: 'center', ...CARD_SHADOW },
  islandGradient: { height: 180, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', position: 'relative' },
  islandCurrentBorder: { borderWidth: 4, borderColor: COLORS.gradientStart, borderBottomWidth: 0, shadowColor: COLORS.gradientStart, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10 },
  
  // Clouds
  cloud: { position: 'absolute', width: 46, height: 18, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  
  // Terrain
  terrainContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end' },
  mountainLeft: { width: 70, height: 48, borderTopLeftRadius: 35, borderTopRightRadius: 12, marginRight: -18, shadowColor: '#000', shadowOffset: { width: -2, height: -2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  mountainCenter: { width: 90, height: 65, borderTopLeftRadius: 45, borderTopRightRadius: 45, zIndex: 1, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.2, shadowRadius: 6 },
  mountainRight: { width: 60, height: 42, borderTopLeftRadius: 12, borderTopRightRadius: 30, marginLeft: -12, shadowColor: '#000', shadowOffset: { width: 2, height: -2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  
  // Emoji
  emojiContainer: { position: 'absolute', top: 18, left: 22, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 24, padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4 },
  islandEmoji: { fontSize: 32 },
  
  // Lock
  lockOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  lockBadge: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 25, padding: 12 },
  
  // You are here
  youAreHereTag: { position: 'absolute', top: 12, right: 12, backgroundColor: COLORS.gradientStart, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  youAreHereText: { fontSize: 9, fontWeight: '800', color: COLORS.white, marginLeft: 3, letterSpacing: 0.5 },
  
  // Island info
  islandInfo: { backgroundColor: COLORS.white, padding: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, borderWidth: 1, borderTopWidth: 0, borderColor: COLORS.lightGray },
  islandNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  islandName: { fontSize: 18, fontWeight: '800', color: COLORS.text, flex: 1, letterSpacing: -0.3 },
  xpBadge: { backgroundColor: '#FFF8E1', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, shadowColor: '#F57F17', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
  xpText: { fontSize: 12, fontWeight: '800', color: '#F57F17' },
  islandSubtitle: { fontSize: 13, color: COLORS.mediumGray, marginTop: 4, fontWeight: '500' },
  textLocked: { color: '#999' },
  badgeProgress: { marginTop: 12, flexDirection: 'row', alignItems: 'center' },
  badgeProgressBar: { flex: 1, height: 6, backgroundColor: '#E8E8E8', borderRadius: 3, marginRight: 10, overflow: 'hidden' },
  badgeProgressFill: { height: '100%', backgroundColor: COLORS.gradientStart, borderRadius: 3 },
  badgeProgressText: { fontSize: 12, color: COLORS.mediumGray, fontWeight: '600' },
  
  // Connector
  connectorContainer: { height: 40, alignItems: 'center', justifyContent: 'center' },
  connectorLine: { width: 4, height: '100%', backgroundColor: '#E0E0E0', borderRadius: 2 },
  connectorLineGradient: { width: 4, height: '100%', borderRadius: 2, position: 'relative' },
  connectorDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.white, left: -2, borderWidth: 2, borderColor: COLORS.gradientEnd },
  
  // Themed island elements
  // Starting Line - Checkered flag
  checkeredSquare: { position: 'absolute', width: 15, height: 15, borderRadius: 2 },
  flagPole: { position: 'absolute', bottom: 60, width: 3, height: 50, backgroundColor: '#8B4513' },
  
  // Newbie Gains - Bicep
  bicepShape: { position: 'absolute', left: '40%', width: 50, height: 40, backgroundColor: '#FFB380', borderTopLeftRadius: 25, borderTopRightRadius: 25, borderBottomRightRadius: 15 },
  bicepHighlight: { position: 'absolute', left: '45%', width: 20, height: 15, backgroundColor: '#FFC9A3', borderRadius: 10, opacity: 0.7 },
  
  // Grind Zone - Flames
  flame: { position: 'absolute', width: 20, backgroundColor: '#FF6B35', borderTopLeftRadius: 10, borderTopRightRadius: 10, borderBottomLeftRadius: 5, borderBottomRightRadius: 5 },
  
  // Iron Paradise - Barbell
  barbellBar: { position: 'absolute', left: '30%', right: '30%', height: 5, backgroundColor: '#607D8B', borderRadius: 3 },
  barbellPlate: { position: 'absolute', width: 25, height: 25, backgroundColor: '#455A64', borderRadius: 13, borderWidth: 3, borderColor: '#78909C' },
});

// Enhanced Badge Card with rarity-based styling and animations
const BadgeCard = ({ badge, userBadge, onPress, isAvailable }: { badge: Badge; userBadge?: UserBadge; onPress: () => void; isAvailable: boolean }) => {
  const isUnlocked = userBadge?.completed;
  const progress = userBadge?.progress || 0;
  const progressPercent = Math.min((progress / badge.targetValue) * 100, 100);
  const rarityColor = RARITY_COLORS[badge.rarity];
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;
  
  // Legendary shimmer animation
  useEffect(() => {
    if (isUnlocked && badge.rarity === 'legendary') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shineAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(shineAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [isUnlocked, badge.rarity]);
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  };
  
  const shineOpacity = shineAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.3, 0] });
  
  // Get category icon
  const categoryInfo = CATEGORY_INFO[badge.category];
  
  return (
    <TouchableOpacity 
      style={styles.badgeCard} 
      onPress={onPress} 
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1} 
      disabled={!isAvailable}
    >
      <Animated.View style={[
        styles.badgeCardInner, 
        !isUnlocked && styles.badgeCardLocked, 
        !isAvailable && styles.badgeCardUnavailable,
        isUnlocked && { borderColor: rarityColor.border, borderWidth: 2 },
        badge.rarity === 'legendary' && isUnlocked && styles.legendaryCard,
        badge.rarity === 'epic' && isUnlocked && styles.epicCard,
        { transform: [{ scale: scaleAnim }] }
      ]}>
        {/* Legendary shine effect */}
        {isUnlocked && badge.rarity === 'legendary' && (
          <Animated.View style={[styles.shineOverlay, { opacity: shineOpacity }]} />
        )}
        
        {/* Rarity tag with icon */}
        <View style={[styles.rarityTag, { backgroundColor: rarityColor.bg }]}>
          {badge.rarity === 'legendary' && <Ionicons name="diamond" size={8} color={rarityColor.text} style={{ marginRight: 2 }} />}
          {badge.rarity === 'epic' && <Ionicons name="star" size={8} color={rarityColor.text} style={{ marginRight: 2 }} />}
          <Text style={[styles.rarityText, { color: rarityColor.text }]}>{RARITY_LABELS[badge.rarity]}</Text>
        </View>
        
        {/* Category indicator */}
        <View style={[styles.categoryIndicator, { backgroundColor: categoryInfo.color + '20' }]}>
          <Ionicons name={categoryInfo.icon as any} size={10} color={categoryInfo.color} />
        </View>
        
        {/* Badge icon */}
        <View style={styles.badgeIconContainer}>
          {isUnlocked ? (
            <LinearGradient colors={badge.gradient as any} style={styles.badgeIconGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name={badge.icon as any} size={28} color={COLORS.white} />
            </LinearGradient>
          ) : (
            <View style={[styles.badgeIconLocked, !isAvailable && { opacity: 0.4 }]}>
              <Ionicons name={badge.icon as any} size={28} color={COLORS.mediumGray} />
            </View>
          )}
          
          {/* Unlocked checkmark */}
          {isUnlocked && (
            <View style={styles.checkmarkBadge}>
              <Ionicons name="checkmark" size={10} color={COLORS.white} />
            </View>
          )}
        </View>
        
        <Text style={[styles.badgeName, !isUnlocked && styles.badgeNameLocked]} numberOfLines={2}>{badge.name}</Text>
        <Text style={styles.badgeDesc} numberOfLines={1}>{badge.description}</Text>
        
        {/* Progress section */}
        {isUnlocked ? (
          <View style={styles.unlockedSection}>
            <LinearGradient colors={[COLORS.success + '20', COLORS.success + '10']} style={styles.unlockedBadge}>
              <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
              <Text style={styles.unlockedText}>Earned!</Text>
            </LinearGradient>
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
            <Ionicons name="lock-closed" size={10} color={COLORS.mediumGray} />
            <Text style={styles.lockedText}>Island {badge.island}</Text>
          </View>
        )}
        
        {/* XP badge */}
        <View style={[styles.xpBadge, isUnlocked && styles.xpBadgeEarned]}>
          <Ionicons name="star" size={9} color={isUnlocked ? '#FFD700' : COLORS.warning} />
          <Text style={[styles.xpText, isUnlocked && styles.xpTextEarned]}>{badge.xp}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Island Journey Modal (Beautiful Vertical Scroll Map)
const IslandJourneyModal = ({ 
  visible, 
  onClose, 
  currentIsland, 
  completedCount,
  userBadges 
}: { 
  visible: boolean; 
  onClose: () => void; 
  currentIsland: number; 
  completedCount: number;
  userBadges: UserBadge[];
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      setTimeout(() => {
        const targetY = Math.max(0, (currentIsland - 1) * 260 - 50);
        scrollRef.current?.scrollTo({ y: targetY, animated: true });
      }, 400);
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, currentIsland]);
  
  // Calculate badges per island
  const getBadgeStatsForIsland = (islandId: number) => {
    const islandBadges = BADGE_DEFINITIONS.filter(b => b.island === islandId);
    const completed = islandBadges.filter(b => userBadges.find(ub => ub.badgeId === b.id)?.completed).length;
    return { completed, total: islandBadges.length };
  };
  
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={journeyStyles.modalOverlay}>
        <Animated.View style={[journeyStyles.modalContent, { opacity: fadeAnim }]}>
          {/* Header */}
          <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={journeyStyles.header}>
            <View style={journeyStyles.headerContent}>
              <View>
                <Text style={journeyStyles.headerTitle}>Your Fitness Journey</Text>
                <Text style={journeyStyles.headerSubtitle}>
                  {completedCount} badges earned • {BADGE_DEFINITIONS.length - completedCount} to go
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={journeyStyles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            
            {/* Overall progress */}
            <View style={journeyStyles.overallProgress}>
              <View style={journeyStyles.progressBarContainer}>
                <View style={[journeyStyles.progressBarFill, { width: `${(currentIsland / 10) * 100}%` }]} />
              </View>
              <Text style={journeyStyles.progressLabel}>Island {currentIsland} of 10</Text>
            </View>
            
            {/* Floating particles */}
            <FloatingParticle delay={0} size={6} left={10} />
            <FloatingParticle delay={500} size={4} left={30} />
            <FloatingParticle delay={1000} size={8} left={70} />
            <FloatingParticle delay={1500} size={5} left={85} />
          </LinearGradient>
          
          {/* Island Journey Scroll */}
          <ScrollView 
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={journeyStyles.scrollContent}
          >
            {/* Journey background decoration */}
            <View style={journeyStyles.journeyPath} />
            
            {ISLANDS.map((island, index) => {
              const isUnlocked = completedCount >= island.requiredBadges;
              const isCurrent = island.id === currentIsland;
              const stats = getBadgeStatsForIsland(island.id);
              const isCompleted = stats.completed === stats.total && stats.total > 0;
              
              return (
                <View key={island.id}>
                  <IslandCard
                    island={island}
                    isUnlocked={isUnlocked}
                    isCurrent={isCurrent}
                    completedBadges={stats.completed}
                    totalBadges={stats.total}
                    onPress={() => {}}
                  />
                  {index < ISLANDS.length - 1 && (
                    <IslandConnector isCompleted={isUnlocked && completedCount >= ISLANDS[index + 1].requiredBadges} />
                  )}
                </View>
              );
            })}
            
            {/* Final goal */}
            <View style={journeyStyles.finalGoal}>
              <LinearGradient colors={['#FFD700', '#FFA500']} style={journeyStyles.finalGoalBadge}>
                <Ionicons name="trophy" size={32} color={COLORS.white} />
              </LinearGradient>
              <Text style={journeyStyles.finalGoalText}>Fitness Legend</Text>
              <Text style={journeyStyles.finalGoalSubtext}>Complete all badges to achieve greatness</Text>
            </View>
            
            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const journeyStyles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { flex: 1, backgroundColor: '#F8F9FA', marginTop: 50, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  
  header: { paddingTop: 20, paddingBottom: 24, paddingHorizontal: 20, position: 'relative', overflow: 'hidden' },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  closeButton: { padding: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  
  overallProgress: { marginTop: 16 },
  progressBarContainer: { height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.white, borderRadius: 3 },
  progressLabel: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 6, textAlign: 'center', fontWeight: '600' },
  
  scrollContent: { paddingTop: 24, paddingBottom: 20 },
  journeyPath: { position: 'absolute', left: SCREEN_WIDTH / 2 - 2, top: 0, bottom: 0, width: 4, backgroundColor: '#E0E0E0', borderRadius: 2 },
  
  finalGoal: { alignItems: 'center', marginTop: 20, paddingVertical: 20 },
  finalGoalBadge: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  finalGoalText: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  finalGoalSubtext: { fontSize: 13, color: COLORS.mediumGray, marginTop: 4, textAlign: 'center' },
});

// Enhanced Badge Detail Modal
const BadgeDetailModal = ({ visible, onClose, badge, userBadge, onShare }: { visible: boolean; onClose: () => void; badge: Badge | null; userBadge?: UserBadge; onShare: () => void }) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
    }
  }, [visible]);
  
  if (!badge) return null;
  const isUnlocked = userBadge?.completed;
  const progress = userBadge?.progress || 0;
  const progressPercent = Math.min((progress / badge.targetValue) * 100, 100);
  const rarityColor = RARITY_COLORS[badge.rarity];
  const categoryInfo = CATEGORY_INFO[badge.category];
  const island = ISLANDS.find(i => i.id === badge.island);
  
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={detailStyles.overlay}>
        <TouchableOpacity style={detailStyles.backdrop} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[detailStyles.content, { transform: [{ translateY: slideAnim }] }]}>
          {/* Header with gradient based on badge */}
          <LinearGradient 
            colors={isUnlocked ? badge.gradient as any : ['#E0E0E0', '#B0B0B0']} 
            style={detailStyles.header}
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity style={detailStyles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={22} color={COLORS.white} />
            </TouchableOpacity>
            
            {/* Rarity banner */}
            <View style={[detailStyles.rarityBanner, { backgroundColor: rarityColor.bg }]}>
              {badge.rarity === 'legendary' && <Ionicons name="diamond" size={12} color={rarityColor.text} />}
              {badge.rarity === 'epic' && <Ionicons name="star" size={12} color={rarityColor.text} />}
              <Text style={[detailStyles.rarityText, { color: rarityColor.text }]}>{RARITY_LABELS[badge.rarity]}</Text>
            </View>
            
            {/* Badge icon */}
            <View style={detailStyles.iconContainer}>
              <View style={[detailStyles.iconCircle, isUnlocked && detailStyles.iconCircleUnlocked]}>
                <Ionicons name={badge.icon as any} size={48} color={isUnlocked ? COLORS.white : COLORS.mediumGray} />
              </View>
              {isUnlocked && (
                <View style={detailStyles.checkmark}>
                  <Ionicons name="checkmark" size={16} color={COLORS.white} />
                </View>
              )}
            </View>
          </LinearGradient>
          
          {/* Content */}
          <View style={detailStyles.body}>
            <Text style={detailStyles.badgeName}>{badge.name}</Text>
            <Text style={detailStyles.badgeDesc}>{badge.description}</Text>
            
            {/* Meta info row */}
            <View style={detailStyles.metaRow}>
              <View style={detailStyles.metaItem}>
                <View style={[detailStyles.metaIcon, { backgroundColor: COLORS.warning + '20' }]}>
                  <Ionicons name="star" size={14} color={COLORS.warning} />
                </View>
                <Text style={detailStyles.metaValue}>{badge.xp}</Text>
                <Text style={detailStyles.metaLabel}>XP</Text>
              </View>
              <View style={detailStyles.metaItem}>
                <View style={[detailStyles.metaIcon, { backgroundColor: categoryInfo.color + '20' }]}>
                  <Ionicons name={categoryInfo.icon as any} size={14} color={categoryInfo.color} />
                </View>
                <Text style={detailStyles.metaValue}>{categoryInfo.label}</Text>
                <Text style={detailStyles.metaLabel}>Category</Text>
              </View>
              <View style={detailStyles.metaItem}>
                <View style={[detailStyles.metaIcon, { backgroundColor: COLORS.gradientStart + '20' }]}>
                  <Text style={{ fontSize: 12 }}>{island?.emoji}</Text>
                </View>
                <Text style={detailStyles.metaValue}>Island {badge.island}</Text>
                <Text style={detailStyles.metaLabel}>{island?.name}</Text>
              </View>
            </View>
            
            {/* Progress or Unlocked status */}
            {isUnlocked ? (
              <View style={detailStyles.unlockedSection}>
                <View style={detailStyles.unlockedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  <Text style={detailStyles.unlockedText}>
                    Unlocked {userBadge?.unlockedAt ? new Date(userBadge.unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                  </Text>
                </View>
                
                <TouchableOpacity onPress={onShare} activeOpacity={0.8}>
                  <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={detailStyles.shareButton}>
                    <Ionicons name="share-social" size={18} color={COLORS.white} />
                    <Text style={detailStyles.shareText}>Share Achievement</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={detailStyles.progressSection}>
                <View style={detailStyles.progressHeader}>
                  <Text style={detailStyles.progressTitle}>Progress</Text>
                  <Text style={detailStyles.progressPercent}>{Math.round(progressPercent)}%</Text>
                </View>
                <View style={detailStyles.progressBarOuter}>
                  <LinearGradient 
                    colors={badge.gradient as any} 
                    style={[detailStyles.progressBarInner, { width: `${progressPercent}%` }]} 
                    start={{ x: 0, y: 0 }} 
                    end={{ x: 1, y: 0 }} 
                  />
                </View>
                <Text style={detailStyles.progressNumbers}>{progress} / {badge.targetValue}</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const detailStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  backdrop: { flex: 1 },
  content: { backgroundColor: COLORS.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  
  header: { paddingTop: 20, paddingBottom: 30, alignItems: 'center', position: 'relative' },
  closeButton: { position: 'absolute', top: 16, right: 16, padding: 6, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 16 },
  rarityBanner: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  rarityText: { fontSize: 12, fontWeight: '700' },
  iconContainer: { position: 'relative' },
  iconCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  iconCircleUnlocked: { backgroundColor: 'rgba(255,255,255,0.2)' },
  checkmark: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.success, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.white },
  
  body: { padding: 24 },
  badgeName: { fontSize: 24, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  badgeDesc: { fontSize: 15, color: COLORS.mediumGray, textAlign: 'center', marginTop: 6, marginBottom: 20 },
  
  metaRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 },
  metaItem: { alignItems: 'center' },
  metaIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  metaValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  metaLabel: { fontSize: 11, color: COLORS.mediumGray, marginTop: 2 },
  
  unlockedSection: { alignItems: 'center' },
  unlockedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.success + '15', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginBottom: 16 },
  unlockedText: { fontSize: 14, color: COLORS.success, fontWeight: '600', marginLeft: 8 },
  shareButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16 },
  shareText: { fontSize: 15, fontWeight: '600', color: COLORS.white, marginLeft: 8 },
  
  progressSection: { },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  progressPercent: { fontSize: 14, fontWeight: '700', color: COLORS.gradientStart },
  progressBarOuter: { height: 10, backgroundColor: '#E8E8E8', borderRadius: 5, overflow: 'hidden' },
  progressBarInner: { height: '100%', borderRadius: 5 },
  progressNumbers: { fontSize: 13, color: COLORS.mediumGray, textAlign: 'center', marginTop: 8 },
});

// Epic Unlock Celebration Modal with Confetti
const ConfettiParticle = ({ delay, startX }: { delay: number; startX: number }) => {
  const animY = useRef(new Animated.Value(0)).current;
  const animX = useRef(new Animated.Value(0)).current;
  const animRotate = useRef(new Animated.Value(0)).current;
  const animOpacity = useRef(new Animated.Value(1)).current;
  
  const color = useMemo(() => {
    const colors = ['#FFD700', '#FF4EC7', '#A22BF6', '#34C759', '#5B8DEF', '#FF6B35'];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);
  
  const size = useMemo(() => 6 + Math.random() * 6, []);
  
  useEffect(() => {
    const duration = 2000 + Math.random() * 1000;
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(animY, { toValue: SCREEN_HEIGHT * 0.7, duration, useNativeDriver: true }),
        Animated.timing(animX, { toValue: (Math.random() - 0.5) * 200, duration, useNativeDriver: true }),
        Animated.timing(animRotate, { toValue: 3 + Math.random() * 3, duration, useNativeDriver: true }),
        Animated.timing(animOpacity, { toValue: 0, duration: duration * 0.8, delay: duration * 0.2, useNativeDriver: true }),
      ]).start();
    }, delay);
  }, []);
  
  const rotate = animRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  
  return (
    <Animated.View style={[
      celebrationStyles.confetti,
      { 
        left: startX,
        width: size,
        height: size * 1.5,
        backgroundColor: color,
        opacity: animOpacity,
        transform: [{ translateY: animY }, { translateX: animX }, { rotate }]
      }
    ]} />
  );
};

const UnlockCelebrationModal = ({ visible, onClose, badges }: { visible: boolean; onClose: () => void; badges: Badge[] }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [showConfetti, setShowConfetti] = useState(false);
  
  const confettiPositions = useMemo(() => 
    Array.from({ length: 30 }, (_, i) => ({
      delay: i * 50,
      startX: Math.random() * SCREEN_WIDTH
    })), 
  [visible]);
  
  useEffect(() => {
    if (visible) {
      setShowConfetti(true);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 50, useNativeDriver: true }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
          ])
        ),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      glowAnim.setValue(0);
      setShowConfetti(false);
    }
  }, [visible]);
  
  if (badges.length === 0) return null;
  
  const totalXP = badges.reduce((sum, b) => sum + b.xp, 0);
  const rarityColor = RARITY_COLORS[badges[0].rarity];
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.6] });
  
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={celebrationStyles.overlay}>
        {/* Confetti */}
        {showConfetti && confettiPositions.map((pos, i) => (
          <ConfettiParticle key={i} delay={pos.delay} startX={pos.startX} />
        ))}
        
        <Animated.View style={[celebrationStyles.content, { transform: [{ scale: scaleAnim }] }]}>
          {/* Glowing background */}
          <Animated.View style={[celebrationStyles.glowBackground, { opacity: glowOpacity }]}>
            <LinearGradient 
              colors={[badges[0].gradient[0] + '40', badges[0].gradient[1] + '20', 'transparent']} 
              style={celebrationStyles.glowGradient}
            />
          </Animated.View>
          
          {/* Trophy emoji with sparkles */}
          <View style={celebrationStyles.trophyContainer}>
            <Text style={celebrationStyles.trophyEmoji}>🏆</Text>
            <Text style={celebrationStyles.sparkle1}>✨</Text>
            <Text style={celebrationStyles.sparkle2}>✨</Text>
          </View>
          
          <Text style={celebrationStyles.title}>
            {badges.length > 1 ? `${badges.length} Badges Unlocked!` : 'Badge Unlocked!'}
          </Text>
          
          {/* Badge(s) display */}
          <View style={celebrationStyles.badgesContainer}>
            {badges.slice(0, 3).map((badge, index) => (
              <View key={badge.id} style={[celebrationStyles.badgeItem, index > 0 && { marginTop: 12 }]}>
                <LinearGradient 
                  colors={badge.gradient as any} 
                  style={celebrationStyles.badgeIcon}
                  start={{ x: 0, y: 0 }} 
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name={badge.icon as any} size={28} color={COLORS.white} />
                </LinearGradient>
                <View style={celebrationStyles.badgeInfo}>
                  <Text style={celebrationStyles.badgeName}>{badge.name}</Text>
                  <View style={celebrationStyles.badgeMeta}>
                    <View style={[celebrationStyles.rarityTag, { backgroundColor: RARITY_COLORS[badge.rarity].bg }]}>
                      <Text style={[celebrationStyles.rarityText, { color: RARITY_COLORS[badge.rarity].text }]}>
                        {RARITY_LABELS[badge.rarity]}
                      </Text>
                    </View>
                    <View style={celebrationStyles.xpTag}>
                      <Ionicons name="star" size={10} color={COLORS.warning} />
                      <Text style={celebrationStyles.xpText}>+{badge.xp}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
          
          {/* Total XP earned */}
          <View style={celebrationStyles.totalXP}>
            <Text style={celebrationStyles.totalXPLabel}>Total XP Earned</Text>
            <Text style={celebrationStyles.totalXPValue}>+{totalXP}</Text>
          </View>
          
          {/* Continue button */}
          <TouchableOpacity onPress={onClose} activeOpacity={0.9} style={celebrationStyles.buttonWrapper}>
            <LinearGradient 
              colors={[COLORS.gradientStart, COLORS.gradientEnd]} 
              style={celebrationStyles.button}
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 1 }}
            >
              <Text style={celebrationStyles.buttonText}>Awesome! 🎉</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const celebrationStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  confetti: { position: 'absolute', top: -20, borderRadius: 2 },
  content: { width: SCREEN_WIDTH - 32, maxWidth: 420, backgroundColor: COLORS.white, borderRadius: 32, padding: 36, alignItems: 'center', overflow: 'hidden', ...CARD_SHADOW },
  
  glowBackground: { position: 'absolute', top: -60, left: -60, right: -60, height: 250 },
  glowGradient: { flex: 1 },
  
  trophyContainer: { position: 'relative', marginBottom: 12 },
  trophyEmoji: { fontSize: 72 },
  sparkle1: { position: 'absolute', top: -8, right: -18, fontSize: 26 },
  sparkle2: { position: 'absolute', top: 12, left: -24, fontSize: 22 },
  
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginBottom: 24, letterSpacing: -0.7 },
  
  badgesContainer: { width: '100%', marginBottom: 24 },
  badgeItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 18, padding: 16 },
  badgeIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  badgeInfo: { flex: 1, marginLeft: 16 },
  badgeName: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  badgeMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  rarityTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginRight: 8 },
  rarityText: { fontSize: 10, fontWeight: '600' },
  xpTag: { flexDirection: 'row', alignItems: 'center' },
  xpText: { fontSize: 12, fontWeight: '700', color: COLORS.warning, marginLeft: 3 },
  
  totalXP: { backgroundColor: '#FFF8E1', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  totalXPLabel: { fontSize: 15, color: '#F57F17', marginRight: 10, fontWeight: '600' },
  totalXPValue: { fontSize: 22, fontWeight: '800', color: '#F57F17' },
  
  buttonWrapper: { width: '100%' },
  button: { paddingVertical: 18, borderRadius: 18, alignItems: 'center' },
  buttonText: { fontSize: 19, fontWeight: '700', color: COLORS.white },
});

export default function AwardsScreen() {
  const { userBadges, newlyUnlocked, totalXP, currentIsland, loadUserBadges, checkBadges, clearNewlyUnlocked, getCompletedCount, getCurrentIsland, getIslandProgress, getBadgesForIsland, resetToStartingLine } = useAwardsStore();
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
      const rarityEmoji = selectedBadge.rarity === 'legendary' ? '💎' : selectedBadge.rarity === 'epic' ? '⭐' : selectedBadge.rarity === 'rare' ? '🔷' : '✨';
      const island = ISLANDS.find(i => i.id === selectedBadge.island);
      
      // Rich share message with visual appeal
      const shareMessage = `
🏆 Achievement Unlocked! 🏆

${rarityEmoji} ${selectedBadge.name.toUpperCase()} ${rarityEmoji}
${selectedBadge.description}

📍 Island: ${island?.name || 'Unknown'} ${island?.emoji || ''}
${RARITY_LABELS[selectedBadge.rarity]} Badge
+${selectedBadge.xp} XP

💪 Join me on Thryvin - Your AI Fitness Coach!
Transform your fitness journey with personalized workouts and gamified progression.

🔗 Download Thryvin (Coming Soon to App Store)
#Thryvin #FitnessGoals #Achievement #WorkoutMotivation
      `.trim();
      
      await Share.share({ 
        message: shareMessage,
        title: `${selectedBadge.name} - Thryvin Achievement`,
      });
    } catch (error) { 
      console.error('Error sharing:', error); 
    }
  };
  
  const island = getCurrentIsland();
  const islandProgress = getIslandProgress();
  const completedCount = getCompletedCount();
  
  // Get completed badges for CURRENT island only
  const currentIslandBadges = BADGE_DEFINITIONS.filter(b => b.island === currentIsland);
  const currentIslandCompletedCount = userBadges.filter(ub => {
    const badge = BADGE_DEFINITIONS.find(b => b.id === ub.badgeId && b.island === currentIsland);
    return badge && ub.completed;
  }).length;
  
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
        {/* Enhanced Purple Island Banner with particles */}
        <TouchableOpacity 
          onPress={() => setShowIslandSelector(true)} 
          onLongPress={() => {
            // Long press to reset (useful for fixing progression issues)
            Alert.alert(
              'Reset Badge Progress?',
              'This will reset you to Starting Line and clear all badge progress. Use this if you got moved to the wrong island.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Reset', 
                  style: 'destructive',
                  onPress: async () => {
                    await resetToStartingLine();
                    Alert.alert('✅ Reset Complete', 'You are back on Starting Line!');
                  }
                },
              ]
            );
          }}
          activeOpacity={0.9}
        >
          <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.islandBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            {/* Floating particles for visual flair */}
            <FloatingParticle delay={0} size={5} left={5} />
            <FloatingParticle delay={800} size={4} left={25} />
            <FloatingParticle delay={400} size={6} left={75} />
            <FloatingParticle delay={1200} size={4} left={90} />
            
            <View style={styles.islandBannerContent}>
              <View style={styles.islandEmojiContainer}>
                <Text style={styles.islandBannerEmoji}>{island.emoji}</Text>
              </View>
              <View style={styles.islandBannerInfo}>
                <Text style={styles.islandBannerName}>{island.name}</Text>
                <Text style={styles.islandBannerSubtitle}>{island.subtitle}</Text>
              </View>
              <View style={styles.islandBannerStats}>
                <Text style={styles.islandBannerXP}>{totalXP.toLocaleString()}</Text>
                <Text style={styles.islandBannerXPLabel}>XP</Text>
              </View>
            </View>
            
            <View style={styles.islandProgressSection}>
              <View style={styles.islandProgressBar}>
                <Animated.View style={[styles.islandProgressFill, { width: `${islandProgress.percentage}%` }]} />
              </View>
              <Text style={styles.islandProgressText}>
                {currentIsland < 10 
                  ? `${islandProgress.current}/${islandProgress.required} badges to next island (80% required)` 
                  : 'Max level reached! 🌟'}
              </Text>
            </View>
            
            <View style={styles.tapHint}>
              <Ionicons name="map" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.tapHintText}>Tap to view your journey</Text>
              <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.8)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
        
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{currentIslandCompletedCount}/{currentIslandBadges.length}</Text>
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
      
      <IslandJourneyModal visible={showIslandSelector} onClose={() => setShowIslandSelector(false)} currentIsland={currentIsland} completedCount={completedCount} userBadges={userBadges} />
      <BadgeDetailModal visible={!!selectedBadge} onClose={() => setSelectedBadge(null)} badge={selectedBadge} userBadge={userBadges.find(ub => ub.badgeId === selectedBadge?.id)} onShare={handleShare} />
      <UnlockCelebrationModal visible={showCelebration} onClose={() => { setShowCelebration(false); clearNewlyUnlocked(); }} badges={newlyUnlockedBadges} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  scrollView: { flex: 1 },
  
  // Island Banner (PURPLE) - Enhanced
  islandBanner: { margin: 16, borderRadius: 24, padding: 20, overflow: 'hidden', position: 'relative' },
  islandBannerContent: { flexDirection: 'row', alignItems: 'center' },
  islandEmojiContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  islandBannerEmoji: { fontSize: 32 },
  islandBannerInfo: { flex: 1, marginLeft: 14 },
  islandBannerName: { fontSize: 20, fontWeight: '800', color: COLORS.white, letterSpacing: -0.3 },
  islandBannerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 3 },
  islandBannerStats: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10 },
  islandBannerXP: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  islandBannerXPLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  islandProgressSection: { marginTop: 16 },
  islandProgressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 3, overflow: 'hidden' },
  islandProgressFill: { height: '100%', backgroundColor: COLORS.white, borderRadius: 3 },
  islandProgressText: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 8, textAlign: 'center', fontWeight: '500' },
  tapHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, gap: 6 },
  tapHintText: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  
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
  badgeCard: { width: (SCREEN_WIDTH - 36) / 2, marginBottom: 12, marginHorizontal: 4 },
  badgeCardInner: { backgroundColor: COLORS.white, borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.lightGray, minHeight: 175, ...CARD_SHADOW },
  badgeCardLocked: { backgroundColor: '#FAFAFA' },
  badgeCardUnavailable: { opacity: 0.5 },
  legendaryCard: { backgroundColor: '#FFFDF5', borderColor: '#FFD700' },
  epicCard: { backgroundColor: '#FBF5FF' },
  shineOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%', backgroundColor: 'rgba(255,215,0,0.15)', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  rarityTag: { position: 'absolute', top: 8, right: 8, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  rarityText: { fontSize: 9, fontWeight: '700' },
  categoryIndicator: { position: 'absolute', top: 8, left: 8, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  badgeIconContainer: { marginTop: 12, marginBottom: 8, position: 'relative' },
  badgeIconGradient: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  badgeIconLocked: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#E8E8E8', justifyContent: 'center', alignItems: 'center' },
  checkmarkBadge: { position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.success, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.white },
  badgeName: { fontSize: 13, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: 2, lineHeight: 17 },
  badgeNameLocked: { color: COLORS.mediumGray },
  badgeDesc: { fontSize: 10, color: COLORS.mediumGray, textAlign: 'center', marginBottom: 8 },
  unlockedSection: { width: '100%', alignItems: 'center' },
  unlockedBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  unlockedText: { fontSize: 10, color: COLORS.success, marginLeft: 4, fontWeight: '600' },
  progressSection: { width: '100%', alignItems: 'center' },
  progressBar: { width: '100%', height: 5, backgroundColor: '#E8E8E8', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 10, color: COLORS.mediumGray, fontWeight: '500' },
  lockedSection: { flexDirection: 'row', alignItems: 'center' },
  lockedText: { fontSize: 10, color: COLORS.mediumGray, marginLeft: 4 },
  xpBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 6, backgroundColor: '#FFF8E1', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  xpBadgeEarned: { backgroundColor: '#FFD700' + '30' },
  xpText: { fontSize: 10, color: COLORS.warning, fontWeight: '700', marginLeft: 3 },
  xpTextEarned: { color: '#B8860B' },
  
  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyStateText: { marginTop: 12, fontSize: 15, color: COLORS.mediumGray },
});
