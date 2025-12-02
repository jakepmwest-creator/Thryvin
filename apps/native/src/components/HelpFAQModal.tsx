import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  accent: '#A22BF6',
  accentSecondary: '#FF4EC7',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
};

interface HelpFAQModalProps {
  visible: boolean;
  onClose: () => void;
}

const FAQ_DATA = [
  {
    category: 'Getting Started',
    icon: 'rocket',
    questions: [
      {
        q: 'How does Thryvin create my workout program?',
        a: 'Thryvin uses AI to analyze your fitness goals, experience level, available equipment, and preferences to generate a personalized 21-day workout program. The AI continuously learns from your progress to optimize future workouts.'
      },
      {
        q: 'Can I skip or modify exercises?',
        a: 'Yes! During a workout, you can skip any exercise or swap it for an alternative. The AI will note your preferences and adjust future recommendations accordingly.'
      },
      {
        q: 'How long are the workouts?',
        a: 'Workout duration is based on your preferences set during onboarding. You can change this anytime in Profile → Workout Preferences. Sessions typically range from 30-75 minutes.'
      },
    ]
  },
  {
    category: 'Workouts & Progress',
    icon: 'barbell',
    questions: [
      {
        q: 'What if I miss a workout day?',
        a: "No worries! Life happens. You can either skip it and move on, or do the missed workout on your rest day. The program automatically adjusts to keep you on track."
      },
      {
        q: 'How are my stats calculated?',
        a: 'Stats are calculated from completed workouts stored locally on your device. This includes workout count, active minutes, streaks, and estimated calories burned based on exercise intensity.'
      },
      {
        q: 'Can I redo a workout?',
        a: 'Absolutely! You can repeat any workout as many times as you like. Each completion counts toward your stats and helps improve the AI recommendations.'
      },
      {
        q: 'How do I reset my program?',
        a: 'Go to Profile → Reset Program. You can chat with the AI about what changes you want (more intensity, different focus, etc.) before generating a fresh 21-day plan.'
      },
    ]
  },
  {
    category: 'Awards & Achievements',
    icon: 'trophy',
    questions: [
      {
        q: 'How do I earn badges?',
        a: 'Badges are earned automatically as you complete workouts and reach milestones. There are badges for consistency (streaks), volume (total workouts), focus (specific muscle groups), and special challenges.'
      },
      {
        q: 'What are Islands?',
        a: 'Islands represent your progression tiers in Thryvin. As you earn more badges, you unlock new islands with harder challenges and better XP multipliers. There are 10 islands total, from "Starting Line" to "Mount Olympus"!'
      },
      {
        q: 'What is XP and what does it do?',
        a: 'XP (Experience Points) are earned by completing workouts and unlocking badges. XP determines your overall level and island progression. Different badge rarities give different XP amounts.'
      },
    ]
  },
  {
    category: 'Account & Privacy',
    icon: 'shield',
    questions: [
      {
        q: 'Is my data secure?',
        a: 'Yes! Your workout data is stored locally on your device. We only collect anonymized usage data to improve the app (if you opt-in). Your personal information is never sold to third parties.'
      },
      {
        q: 'Can I use Thryvin offline?',
        a: 'Most features work offline! Workouts, stats, and badges are all stored locally. An internet connection is only needed to generate new AI workouts or sync data across devices.'
      },
      {
        q: 'How do I delete my account?',
        a: 'Go to Profile → scroll down → Delete Account. This will permanently remove all your data. This action cannot be undone.'
      },
    ]
  },
  {
    category: 'Technical Issues',
    icon: 'build',
    questions: [
      {
        q: 'The app is running slow. What should I do?',
        a: 'Try closing and reopening the app. If issues persist, clear the app cache in your device settings or reinstall the app. Your data synced to the cloud will be preserved.'
      },
      {
        q: 'My progress rings are not updating.',
        a: 'Pull down on the home screen to refresh. If still not updating, try completing a workout or restarting the app. Stats update in real-time as workouts are logged.'
      },
      {
        q: "Workouts aren't generating. What's wrong?",
        a: 'This usually means a connection issue. Check your internet connection and try again. If it persists, go to Profile → Reset Program to force regenerate your workouts.'
      },
    ]
  },
];

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [expanded, setExpanded] = useState(false);
  const animatedHeight = useState(new Animated.Value(0))[0];

  const toggleExpand = () => {
    setExpanded(!expanded);
    Animated.timing(animatedHeight, {
      toValue: expanded ? 0 : 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  return (
    <TouchableOpacity style={styles.faqItem} onPress={toggleExpand} activeOpacity={0.7}>
      <View style={styles.faqQuestion}>
        <Text style={styles.questionText}>{question}</Text>
        <Ionicons 
          name={expanded ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color={COLORS.mediumGray} 
        />
      </View>
      {expanded && (
        <Text style={styles.answerText}>{answer}</Text>
      )}
    </TouchableOpacity>
  );
};

export const HelpFAQModal = ({ visible, onClose }: HelpFAQModalProps) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Getting Started');

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@thryvin.app?subject=Help%20Request%20-%20Thryvin%20App');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.mediumGray} />
            </TouchableOpacity>
            <Text style={styles.title}>Help & FAQ</Text>
            <View style={{ width: 32 }} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Search hint */}
            <Text style={styles.subtitle}>
              Find answers to common questions or contact support
            </Text>

            {/* FAQ Categories */}
            {FAQ_DATA.map((category) => (
              <View key={category.category} style={styles.categoryContainer}>
                <TouchableOpacity 
                  style={styles.categoryHeader}
                  onPress={() => setExpandedCategory(
                    expandedCategory === category.category ? null : category.category
                  )}
                >
                  <View style={styles.categoryIcon}>
                    <Ionicons name={category.icon as any} size={20} color={COLORS.accent} />
                  </View>
                  <Text style={styles.categoryTitle}>{category.category}</Text>
                  <Ionicons 
                    name={expandedCategory === category.category ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color={COLORS.mediumGray} 
                  />
                </TouchableOpacity>
                
                {expandedCategory === category.category && (
                  <View style={styles.questionsContainer}>
                    {category.questions.map((item, index) => (
                      <FAQItem key={index} question={item.q} answer={item.a} />
                    ))}
                  </View>
                )}
              </View>
            ))}

            {/* Contact Support */}
            <View style={styles.contactSection}>
              <Text style={styles.contactTitle}>Still need help?</Text>
              <Text style={styles.contactSubtitle}>
                Our support team is here to help you succeed in your fitness journey.
              </Text>
              <TouchableOpacity style={styles.contactButton} onPress={handleContactSupport}>
                <Ionicons name="mail" size={20} color={COLORS.white} />
                <Text style={styles.contactButtonText}>Contact Support</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginBottom: 20,
    textAlign: 'center',
  },
  categoryContainer: {
    marginBottom: 16,
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.accent}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  questionsContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.white,
  },
  faqItem: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  questionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  answerText: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginTop: 12,
    lineHeight: 20,
  },
  contactSection: {
    marginTop: 24,
    padding: 20,
    backgroundColor: `${COLORS.accent}08`,
    borderRadius: 16,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  contactSubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
