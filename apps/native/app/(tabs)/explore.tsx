import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../../src/components/AppHeader';

const COLORS = {
  accent: '#4CAF50',
  accentSecondary: '#8BC34A',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  shadow: 'rgba(76, 175, 80, 0.15)',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;

const MOCK_RECIPES = [
  {
    name: 'Grilled Salmon Bowl',
    description: 'Fresh salmon with quinoa, avocado, and roasted vegetables',
    calories: 520,
    protein: 42,
    prepTime: '25 min',
    difficulty: 'Medium',
  },
  {
    name: 'Mediterranean Chicken',
    description: 'Herb-crusted chicken with Greek salad and hummus',
    calories: 450,
    protein: 48,
    prepTime: '30 min',
    difficulty: 'Easy',
  },
  {
    name: 'Veggie Power Bowl',
    description: 'Plant-based protein with roasted chickpeas and tahini',
    calories: 380,
    protein: 18,
    prepTime: '20 min',
    difficulty: 'Easy',
  },
];

export default function ExploreScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const currentRecipe = MOCK_RECIPES[currentIndex];

  const handleLike = () => {
    if (currentIndex < MOCK_RECIPES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0); // Loop back
    }
  };

  const handleDislike = () => {
    if (currentIndex < MOCK_RECIPES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader mode="nutrition" />
      
      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.mediumGray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes or ingredients..."
            placeholderTextColor={COLORS.mediumGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Recipe Card (Tinder-style) */}
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            {/* Recipe Image Placeholder */}
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentSecondary]}
              style={styles.cardImage}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="restaurant" size={64} color={COLORS.white} />
            </LinearGradient>

            {/* Recipe Info */}
            <View style={styles.cardContent}>
              <Text style={styles.recipeName}>{currentRecipe.name}</Text>
              <Text style={styles.recipeDescription}>{currentRecipe.description}</Text>

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="flame" size={18} color={COLORS.accent} />
                  <Text style={styles.statText}>{currentRecipe.calories} cal</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="fitness" size={18} color={COLORS.accent} />
                  <Text style={styles.statText}>{currentRecipe.protein}g protein</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="time" size={18} color={COLORS.accent} />
                  <Text style={styles.statText}>{currentRecipe.prepTime}</Text>
                </View>
              </View>

              {/* Difficulty Badge */}
              <View style={styles.difficultyBadge}>
                <Text style={styles.difficultyText}>{currentRecipe.difficulty}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionButton, styles.dislikeButton]} onPress={handleDislike}>
            <Ionicons name="close" size={32} color="#FF5252" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoButton}>
            <Ionicons name="information-circle-outline" size={28} color={COLORS.accent} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.likeButton]} onPress={handleLike}>
            <Ionicons name="heart" size={32} color={COLORS.accent} />
          </TouchableOpacity>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {MOCK_RECIPES.length}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    paddingBottom: 120,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 14,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 20,
  },
  recipeName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  recipeDescription: {
    fontSize: 15,
    color: COLORS.mediumGray,
    lineHeight: 22,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${COLORS.accent}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 24,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  dislikeButton: {
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: '#FF5252',
  },
  likeButton: {
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.accent,
  },
  infoButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
});
