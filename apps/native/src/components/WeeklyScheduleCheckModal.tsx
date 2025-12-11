import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  accent: '#A22BF6',
  accentSecondary: '#FF4EC7',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  success: '#34C759',
  danger: '#FF3B30',
};

interface WeeklyScheduleCheckModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selectedDays: string[]) => void;
  weekStartDate: Date;
  suggestedDays?: string[]; // Pre-selected days from previous week pattern
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const WeeklyScheduleCheckModal = ({
  visible,
  onClose,
  onConfirm,
  weekStartDate,
  suggestedDays = [],
}: WeeklyScheduleCheckModalProps) => {
  const [response, setResponse] = useState<'yes' | 'no' | 'maybe' | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>(suggestedDays);
  
  // Generate the week's dates
  const weekDates = useMemo(() => {
    const dates = [];
    const start = new Date(weekStartDate);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push({
        date: date.toISOString().split('T')[0],
        dayName: DAYS_OF_WEEK[i],
        dayNum: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
      });
    }
    
    return dates;
  }, [weekStartDate]);
  
  // Format week range for display
  const weekRangeText = useMemo(() => {
    const start = new Date(weekStartDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    
    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()} - ${end.getDate()}`;
    }
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`;
  }, [weekStartDate]);
  
  const toggleDay = (dateStr: string) => {
    setSelectedDays(prev => {
      if (prev.includes(dateStr)) {
        return prev.filter(d => d !== dateStr);
      }
      return [...prev, dateStr];
    });
  };
  
  const handleYes = () => {
    setResponse('yes');
    // Keep the suggested days and confirm
    onConfirm(suggestedDays);
  };
  
  const handleNo = () => {
    setResponse('no');
    // Show the day selector
  };
  
  const handleMaybe = async () => {
    // Snooze for a week
    await AsyncStorage.setItem('weeklyScheduleCheckSnoozed', new Date().toISOString());
    onClose();
  };
  
  const handleConfirmChanges = () => {
    onConfirm(selectedDays);
  };
  
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentSecondary]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerIcon}>
              <Ionicons name="calendar" size={28} color={COLORS.white} />
            </View>
            <Text style={styles.headerTitle}>Weekly Check-In</Text>
            <Text style={styles.headerSubtitle}>
              For the week of {weekRangeText}
            </Text>
          </LinearGradient>
          
          {/* Content */}
          <View style={styles.content}>
            {response !== 'no' ? (
              // Initial question view
              <>
                <Text style={styles.question}>
                  Do these days work for you this week?
                </Text>
                
                {/* Suggested Days Preview */}
                <View style={styles.suggestedDaysContainer}>
                  {weekDates.map((day) => {
                    const isSuggested = suggestedDays.includes(day.date);
                    return (
                      <View
                        key={day.date}
                        style={[
                          styles.dayPreview,
                          isSuggested && styles.dayPreviewSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayPreviewName,
                            isSuggested && styles.dayPreviewTextSelected,
                          ]}
                        >
                          {day.dayName}
                        </Text>
                        <Text
                          style={[
                            styles.dayPreviewNum,
                            isSuggested && styles.dayPreviewTextSelected,
                          ]}
                        >
                          {day.dayNum}
                        </Text>
                        {isSuggested && (
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color={COLORS.white}
                            style={styles.dayCheckmark}
                          />
                        )}
                      </View>
                    );
                  })}
                </View>
                
                {/* Response Buttons */}
                <View style={styles.responseButtons}>
                  <TouchableOpacity
                    style={[styles.responseButton, styles.yesButton]}
                    onPress={handleYes}
                  >
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                    <Text style={[styles.responseButtonText, { color: COLORS.success }]}>
                      Yes
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.responseButton, styles.noButton]}
                    onPress={handleNo}
                  >
                    <Ionicons name="close-circle" size={24} color={COLORS.danger} />
                    <Text style={[styles.responseButtonText, { color: COLORS.danger }]}>
                      No
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.responseButton, styles.maybeButton]}
                    onPress={handleMaybe}
                  >
                    <Ionicons name="help-circle" size={24} color={COLORS.mediumGray} />
                    <Text style={[styles.responseButtonText, { color: COLORS.mediumGray }]}>
                      Maybe
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.maybeHint}>
                  "Maybe" will ask you again next week
                </Text>
              </>
            ) : (
              // Day selector view
              <>
                <Text style={styles.question}>
                  Select your available days for this week:
                </Text>
                
                {/* Editable Day Selector */}
                <View style={styles.daySelector}>
                  {weekDates.map((day) => {
                    const isSelected = selectedDays.includes(day.date);
                    return (
                      <TouchableOpacity
                        key={day.date}
                        style={[
                          styles.dayButton,
                          isSelected && styles.dayButtonSelected,
                        ]}
                        onPress={() => toggleDay(day.date)}
                      >
                        <Text
                          style={[
                            styles.dayButtonName,
                            isSelected && styles.dayButtonTextSelected,
                          ]}
                        >
                          {day.dayName}
                        </Text>
                        <Text
                          style={[
                            styles.dayButtonNum,
                            isSelected && styles.dayButtonTextSelected,
                          ]}
                        >
                          {day.dayNum}
                        </Text>
                        <Text
                          style={[
                            styles.dayButtonMonth,
                            isSelected && styles.dayButtonTextSelected,
                          ]}
                        >
                          {day.month}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                
                <Text style={styles.selectedCount}>
                  {selectedDays.length} day{selectedDays.length !== 1 ? 's' : ''} selected
                </Text>
                
                {/* Confirm Changes Button */}
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirmChanges}
                  disabled={selectedDays.length === 0}
                >
                  <LinearGradient
                    colors={selectedDays.length > 0 
                      ? [COLORS.accent, COLORS.accentSecondary]
                      : [COLORS.mediumGray, COLORS.mediumGray]
                    }
                    style={styles.confirmGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.confirmButtonText}>Confirm Changes</Text>
                    <Ionicons name="checkmark" size={20} color={COLORS.white} />
                  </LinearGradient>
                </TouchableOpacity>
                
                {/* Back Button */}
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setResponse(null)}
                >
                  <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    padding: 24,
  },
  question: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  suggestedDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 4,
  },
  dayPreview: {
    flex: 1,
    aspectRatio: 0.7,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  dayPreviewSelected: {
    backgroundColor: COLORS.accent,
  },
  dayPreviewName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  dayPreviewNum: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  dayPreviewTextSelected: {
    color: COLORS.white,
  },
  dayCheckmark: {
    marginTop: 4,
  },
  responseButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  responseButton: {
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    minWidth: 90,
  },
  yesButton: {
    borderColor: COLORS.success,
    backgroundColor: `${COLORS.success}10`,
  },
  noButton: {
    borderColor: COLORS.danger,
    backgroundColor: `${COLORS.danger}10`,
  },
  maybeButton: {
    borderColor: COLORS.mediumGray,
    backgroundColor: COLORS.lightGray,
  },
  responseButtonText: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  maybeHint: {
    fontSize: 12,
    color: COLORS.mediumGray,
    textAlign: 'center',
  },
  daySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 6,
  },
  dayButton: {
    flex: 1,
    aspectRatio: 0.65,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 4,
  },
  dayButtonSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  dayButtonName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  dayButtonNum: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  dayButtonMonth: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  dayButtonTextSelected: {
    color: COLORS.white,
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmButton: {
    marginBottom: 12,
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
});
