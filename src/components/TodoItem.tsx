import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Platform, Modal } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
  FadeIn,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { Todo, TASK_COLORS, TaskColor } from '../types';

interface Props {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateDate: (id: string, date: number | null, color: TaskColor) => void;
  targetDate?: number | null;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const formatShortDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getRandomColor = (): TaskColor => {
  const randomIndex = Math.floor(Math.random() * TASK_COLORS.length);
  return TASK_COLORS[randomIndex];
};

const TodoItem: React.FC<Props> = ({ todo, onToggle, onDelete, onUpdateDate, targetDate }) => {
  const scale = useSharedValue(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(
    todo.dueDate ? new Date(todo.dueDate) : null
  );

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(todo.id);
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDelete(todo.id);
  };

  const handleDatePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTempDate(todo.dueDate ? new Date(todo.dueDate) : new Date());
    setShowDatePicker(true);
  };

  const handleColorPress = () => {
    if (!todo.dueDate) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowColorPicker(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        // Auto-assign random color when setting date
        const color = todo.color || getRandomColor();
        onUpdateDate(todo.id, selectedDate.getTime(), color);
      }
    } else if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const handleConfirmDate = () => {
    setShowDatePicker(false);
    if (tempDate) {
      // Auto-assign random color when setting date (keep existing color if already set)
      const color = todo.color || getRandomColor();
      onUpdateDate(todo.id, tempDate.getTime(), color);
    }
    setTempDate(null);
  };

  const handleSelectColor = (color: TaskColor) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (todo.dueDate) {
      onUpdateDate(todo.id, todo.dueDate, color);
    }
    setShowColorPicker(false);
  };

  const handleRemoveDate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUpdateDate(todo.id, null, TASK_COLORS[0]);
    setShowDatePicker(false);
    setTempDate(null);
  };

  const handleCancelDatePicker = () => {
    setShowDatePicker(false);
    setTempDate(null);
  };

  const handleCancelColorPicker = () => {
    setShowColorPicker(false);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkboxStyle = useAnimatedStyle(() => ({
    backgroundColor: todo.completed
      ? withTiming('rgba(76, 217, 100, 0.9)', { duration: 200 })
      : withTiming('transparent', { duration: 200 }),
    borderColor: todo.completed
      ? withTiming('rgba(76, 217, 100, 0.9)', { duration: 200 })
      : withTiming('rgba(255, 255, 255, 0.4)', { duration: 200 }),
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: todo.completed
      ? withTiming(0.5, { duration: 200 })
      : withTiming(1, { duration: 200 }),
  }));

  const minDate = new Date();
  const maxDate = targetDate ? new Date(targetDate) : undefined;

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      layout={Layout.springify()}
    >
      <AnimatedPressable
        style={[styles.container, animatedStyle]}
        onPressIn={() => {
          scale.value = withSpring(0.98);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
      >
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={handleToggle}
          activeOpacity={0.7}
        >
          <Animated.View style={[styles.checkbox, checkboxStyle]}>
            {todo.completed && <Text style={styles.checkmark}>✓</Text>}
          </Animated.View>
        </TouchableOpacity>

        <View style={styles.contentContainer}>
          <Animated.Text
            style={[
              styles.text,
              textStyle,
              todo.completed && styles.completedText,
            ]}
            numberOfLines={2}
          >
            {todo.text}
          </Animated.Text>

          {/* Date badge if date is set */}
          {todo.dueDate && (
            <View style={[styles.dateBadge, { backgroundColor: todo.color || TASK_COLORS[0] }]}>
              <Text style={styles.dateBadgeText}>{formatShortDate(todo.dueDate)}</Text>
            </View>
          )}
        </View>

        {/* Date/Calendar button */}
        <TouchableOpacity
          style={[
            styles.dateButton,
            todo.dueDate ? { backgroundColor: `${todo.color || TASK_COLORS[0]}30` } : undefined
          ]}
          onPress={handleDatePress}
          activeOpacity={0.7}
        >
          <Text style={[styles.dateButtonText, todo.dueDate ? { color: todo.color || TASK_COLORS[0] } : undefined]}>
            📅
          </Text>
        </TouchableOpacity>

        {/* Color button - only enabled when date is set */}
        <TouchableOpacity
          style={[
            styles.colorButton,
            todo.dueDate
              ? { backgroundColor: todo.color || TASK_COLORS[0] }
              : styles.colorButtonDisabled
          ]}
          onPress={handleColorPress}
          activeOpacity={todo.dueDate ? 0.7 : 1}
          disabled={!todo.dueDate}
        >
          <Text style={styles.colorButtonText}>🎨</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteText}>×</Text>
        </TouchableOpacity>
      </AnimatedPressable>

      {/* iOS Date Picker Modal */}
      {Platform.OS === 'ios' && showDatePicker && (
        <Modal transparent animationType="slide" visible={showDatePicker}>
          <View style={styles.modalOverlay}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <TouchableOpacity onPress={handleCancelDatePicker}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.datePickerTitle}>Select Due Date</Text>
                <TouchableOpacity onPress={handleConfirmDate}>
                  <Text style={styles.confirmText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate || new Date()}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={minDate}
                maximumDate={maxDate}
                textColor="#FFFFFF"
              />
              {/* Remove date option */}
              {todo.dueDate && (
                <TouchableOpacity
                  style={styles.removeDateButtonInPicker}
                  onPress={handleRemoveDate}
                >
                  <Text style={styles.removeDateText}>Remove Date</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Android Date Picker */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={tempDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={minDate}
          maximumDate={maxDate}
        />
      )}

      {/* Color Picker Modal */}
      <Modal transparent animationType="fade" visible={showColorPicker}>
        <View style={styles.modalOverlay}>
          <View style={styles.colorPickerContainer}>
            <Text style={styles.colorPickerTitle}>Choose Color</Text>
            <View style={styles.colorGrid}>
              {TASK_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    todo.color === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => handleSelectColor(color)}
                  activeOpacity={0.7}
                >
                  {todo.color === color && <Text style={styles.colorCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.colorCancelButton}
              onPress={handleCancelColorPicker}
            >
              <Text style={styles.colorCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  contentContainer: {
    flex: 1,
  },
  text: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  dateBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000000',
  },
  dateButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  dateButtonText: {
    fontSize: 14,
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  colorButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    opacity: 0.4,
  },
  colorButtonText: {
    fontSize: 14,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  deleteText: {
    color: '#FF3B30',
    fontSize: 20,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  datePickerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelText: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  confirmText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
  },
  removeDateButtonInPicker: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  removeDateText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  // Color picker styles
  colorPickerContainer: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  colorPickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  colorCheck: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  colorCancelButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  colorCancelText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TodoItem;
