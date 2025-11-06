import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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

const MOCK_SHOPPING_LIST = {
  'Proteins': [
    { name: 'Chicken Breast', amount: '1kg', checked: false },
    { name: 'Salmon Fillets', amount: '500g', checked: true },
    { name: 'Greek Yogurt', amount: '2 tubs', checked: false },
    { name: 'Eggs', amount: '12 pack', checked: false },
  ],
  'Vegetables': [
    { name: 'Spinach', amount: '300g', checked: false },
    { name: 'Broccoli', amount: '2 heads', checked: false },
    { name: 'Bell Peppers', amount: '3 units', checked: true },
    { name: 'Sweet Potato', amount: '1kg', checked: false },
  ],
  'Carbs & Grains': [
    { name: 'Brown Rice', amount: '1kg', checked: false },
    { name: 'Quinoa', amount: '500g', checked: false },
    { name: 'Oats', amount: '1kg', checked: true },
    { name: 'Whole Wheat Bread', amount: '1 loaf', checked: false },
  ],
  'Fruits': [
    { name: 'Bananas', amount: '6 units', checked: false },
    { name: 'Berries Mix', amount: '400g', checked: false },
    { name: 'Avocado', amount: '4 units', checked: false },
  ],
};

export default function ShoppingScreen() {
  const [items, setItems] = useState(MOCK_SHOPPING_LIST);

  const toggleItem = (category: string, index: number) => {
    setItems(prev => ({
      ...prev,
      [category]: prev[category].map((item, i) => 
        i === index ? { ...item, checked: !item.checked } : item
      ),
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader mode="nutrition" />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Smart Shopping List</Text>
          <Text style={styles.subtitle}>AI-generated from your meal plan</Text>
        </View>

        {/* Generate Button */}
        <TouchableOpacity style={styles.generateButton}>
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentSecondary]}
            style={styles.generateGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="sparkles" size={18} color={COLORS.white} />
            <Text style={styles.generateText}>Regenerate List</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Shopping List by Category */}
        {Object.entries(items).map(([category, categoryItems]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {categoryItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.itemCard}
                onPress={() => toggleItem(category, index)}
              >
                <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                  {item.checked && (
                    <Ionicons name="checkmark" size={18} color={COLORS.white} />
                  )}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemAmount}>{item.amount}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Add Custom Item */}
        <TouchableOpacity style={styles.addItemButton}>
          <Ionicons name="add-circle-outline" size={24} color={COLORS.accent} />
          <Text style={styles.addItemText}>Add Custom Item</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  generateButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  generateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 6,
  },
  generateText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.mediumGray,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: COLORS.mediumGray,
  },
  itemAmount: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderStyle: 'dashed',
    gap: 8,
  },
  addItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.accent,
  },
});
