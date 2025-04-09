// src/components/programs/DaysPicker.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../styles/theme';

// Define the Day type
interface Day {
  id: number;
  label: string;
  fullName: string;
}

// Define props interface
interface DaysPickerProps {
  selectedDays: number[];
  onDayToggle: (dayId: number) => void;
}

const DaysPicker: React.FC<DaysPickerProps> = ({ selectedDays, onDayToggle }) => {
  const days: Day[] = [
    { id: 0, label: 'S', fullName: 'Sunday' },
    { id: 1, label: 'M', fullName: 'Monday' },
    { id: 2, label: 'T', fullName: 'Tuesday' },
    { id: 3, label: 'W', fullName: 'Wednesday' },
    { id: 4, label: 'T', fullName: 'Thursday' },
    { id: 5, label: 'F', fullName: 'Friday' },
    { id: 6, label: 'S', fullName: 'Saturday' },
  ];

  return (
    <View style={styles.container}>
      {days.map((day) => (
        <TouchableOpacity
          key={day.id}
          style={[
            styles.dayButton,
            selectedDays.includes(day.id) && styles.selectedDayButton
          ]}
          onPress={() => onDayToggle(day.id)}
          accessibilityLabel={`Toggle ${day.fullName}`}
        >
          <Text
            style={[
              styles.dayText,
              selectedDays.includes(day.id) && styles.selectedDayText
            ]}
          >
            {day.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SIZES.base,
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDayButton: {
    backgroundColor: COLORS.primary,
  },
  dayText: {
    ...FONTS.body3,
    color: COLORS.gray,
    fontWeight: 'bold',
  },
  selectedDayText: {
    color: COLORS.white,
  },
});

export default DaysPicker;