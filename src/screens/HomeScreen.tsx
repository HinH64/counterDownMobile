import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import CountdownTimer from '../components/CountdownTimer';
import TodoList from '../components/TodoList';
import DatePickerModal from '../components/DatePickerModal';
import ParticleBackground from '../components/ParticleBackground';
import { CountdownData, Todo } from '../types';
import { saveData, loadData } from '../utils/storage';
import { formatDate } from '../utils/time';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const HomeScreen: React.FC = () => {
  const [data, setData] = useState<CountdownData>({
    targetDate: null,
    title: '',
    todos: [],
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const buttonScale = useSharedValue(1);

  useEffect(() => {
    loadSavedData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      saveData(data);
    }
  }, [data, isLoading]);

  const loadSavedData = async () => {
    const savedData = await loadData();
    if (savedData) {
      setData(savedData);
    }
    setIsLoading(false);
  };

  const handleSetDate = (date: Date) => {
    setData((prev) => ({ ...prev, targetDate: date.getTime() }));
    setShowDatePicker(false);
  };

  const handleTitleChange = (title: string) => {
    setData((prev) => ({ ...prev, title }));
  };

  const handleAddTodo = (todo: Todo) => {
    setData((prev) => ({ ...prev, todos: [...prev.todos, todo] }));
  };

  const handleToggleTodo = (id: string) => {
    setData((prev) => ({
      ...prev,
      todos: prev.todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      ),
    }));
  };

  const handleDeleteTodo = (id: string) => {
    setData((prev) => ({
      ...prev,
      todos: prev.todos.filter((todo) => todo.id !== id),
    }));
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setData({ targetDate: null, title: '', todos: [] });
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  if (isLoading) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.gradient}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.gradient}>
      <StatusBar barStyle="light-content" />
      <ParticleBackground />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          {/* Header */}
          <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
            {data.targetDate ? (
              <TouchableOpacity
                onPress={() => setIsEditingTitle(true)}
                activeOpacity={0.7}
              >
                {isEditingTitle ? (
                  <TextInput
                    style={styles.titleInput}
                    value={data.title}
                    onChangeText={handleTitleChange}
                    onBlur={() => setIsEditingTitle(false)}
                    placeholder="Event name..."
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    autoFocus
                    maxLength={30}
                  />
                ) : (
                  <Text style={styles.title}>
                    {data.title || 'Tap to add title'}
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <Text style={styles.welcomeTitle}>Countdown Timer</Text>
            )}
          </Animated.View>

          {/* Countdown Section */}
          {data.targetDate ? (
            <Animated.View entering={FadeInDown.delay(200).duration(500)}>
              <CountdownTimer targetDate={data.targetDate} />
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.dateText}>
                  {formatDate(data.targetDate)}
                </Text>
                <Text style={styles.changeDateText}>Tap to change</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Animated.View
              entering={FadeInDown.delay(200).duration(500)}
              style={styles.noDateContainer}
            >
              <Text style={styles.noDateText}>
                Set a target date to start your countdown
              </Text>
              <AnimatedTouchable
                style={[styles.setDateButton, buttonAnimatedStyle]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowDatePicker(true);
                }}
                onPressIn={() => {
                  buttonScale.value = withSpring(0.95);
                }}
                onPressOut={() => {
                  buttonScale.value = withSpring(1);
                }}
                activeOpacity={0.9}
              >
                <Text style={styles.setDateButtonText}>Set Target Date</Text>
              </AnimatedTouchable>
            </Animated.View>
          )}

          {/* Todo List */}
          {data.targetDate && (
            <Animated.View
              entering={FadeInDown.delay(400).duration(500)}
              style={styles.todoContainer}
            >
              <TodoList
                todos={data.todos}
                onAddTodo={handleAddTodo}
                onToggleTodo={handleToggleTodo}
                onDeleteTodo={handleDeleteTodo}
              />
            </Animated.View>
          )}

          {/* Reset Button */}
          {data.targetDate && (
            <Animated.View
              entering={FadeInDown.delay(600).duration(500)}
              style={styles.resetContainer}
            >
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleReset}
                activeOpacity={0.7}
              >
                <Text style={styles.resetButtonText}>Reset Countdown</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Date Picker Modal */}
          <DatePickerModal
            visible={showDatePicker}
            currentDate={data.targetDate ? new Date(data.targetDate) : new Date()}
            onConfirm={handleSetDate}
            onCancel={() => setShowDatePicker(false)}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  titleInput: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
    paddingBottom: 4,
    minWidth: 200,
  },
  noDateContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noDateText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 24,
  },
  setDateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  setDateButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dateButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dateText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  changeDateText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 4,
  },
  todoContainer: {
    flex: 1,
    marginTop: 16,
  },
  resetContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  resetButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  resetButtonText: {
    fontSize: 14,
    color: 'rgba(255, 59, 48, 0.8)',
    fontWeight: '600',
  },
});

export default HomeScreen;
