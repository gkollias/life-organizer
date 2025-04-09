// src/components/common/TimePicker.jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, FONTS, SIZES } from '../../styles/theme';

const TimePicker = ({ initialTime, onConfirm, onCancel }) => {
  const [date, setDate] = React.useState(() => {
    const now = new Date();
    if (initialTime) {
      const [hours, minutes] = initialTime.split(':').map(Number);
      now.setHours(hours, minutes, 0, 0);
    }
    return now;
  });

  const handleChange = (event, selectedDate) => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleConfirm = () => {
    onConfirm(date);
  };

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={true}
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Select Time</Text>
          
          <DateTimePicker
            value={date}
            mode="time"
            is24Hour={false}
            display="spinner"
            onChange={handleChange}
            style={styles.picker}
          />
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    width: '80%',
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: SIZES.padding,
  },
  picker: {
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.padding,
  },
  button: {
    flex: 1,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginHorizontal: SIZES.base / 2,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  confirmButtonText: {
    ...FONTS.body3,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: COLORS.lightGray,
  },
  cancelButtonText: {
    ...FONTS.body3,
    color: COLORS.gray,
  },
});

export default TimePicker;