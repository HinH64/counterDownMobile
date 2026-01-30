import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  SafeAreaView,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import FlipClock from '../components/FlipClock';
import TodoList from '../components/TodoList';
import DatePickerModal from '../components/DatePickerModal';
import PageIndicator from '../components/PageIndicator';
import { CountdownData, Todo } from '../types';
import { saveData, loadData } from '../utils/storage';
import { formatDate } from '../utils/time';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const HomeScreen: React.FC = () => {
  const [data, setData] = useState<CountdownData>({
    targetDate: null,
    title: '',
    todos: [],
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useSharedValue(0);
  const activeIndex = useSharedValue(0);
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

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    scrollX.value = offsetX;
    activeIndex.value = offsetX / SCREEN_WIDTH;
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  if (isLoading) {
    return (
      <LinearGradient colors={['#0f0f1a', '#1a1a2e', '#16213e']} style={styles.gradient}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f0f1a', '#1a1a2e', '#16213e']} style={styles.gradient}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        {data.targetDate ? (
          <>
            {/* Page Indicator */}
            <View style={styles.indicatorContainer}>
              <PageIndicator count={2} activeIndex={activeIndex} />
            </View>

            {/* Swipeable Pages */}
            <AnimatedScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              style={styles.scrollView}
            >
              {/* Page 1: Countdown */}
              <View style={styles.page}>
                <View style={styles.countdownPage}>
                  {/* Title */}
                  <TouchableOpacity
                    onPress={() => setIsEditingTitle(true)}
                    activeOpacity={0.7}
                    style={styles.titleContainer}
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

                  {/* Flip Clock */}
                  <View style={styles.clockContainer}>
                    <FlipClock targetDate={data.targetDate} />
                  </View>

                  {/* Target Date */}
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dateLabel}>TARGET DATE</Text>
                    <Text style={styles.dateText}>
                      {formatDate(data.targetDate)}
                    </Text>
                  </TouchableOpacity>

                  {/* Swipe hint */}
                  <View style={styles.swipeHint}>
                    <Text style={styles.swipeHintText}>Swipe left for tasks →</Text>
                  </View>

                  {/* Reset Button */}
                  <TouchableOpacity
                    style={styles.resetButton}
                    onPress={handleReset}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.resetButtonText}>Reset</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Page 2: Tasks */}
              <View style={styles.page}>
                <View style={styles.tasksPage}>
                  <TodoList
                    todos={data.todos}
                    onAddTodo={handleAddTodo}
                    onToggleTodo={handleToggleTodo}
                    onDeleteTodo={handleDeleteTodo}
                  />
                </View>
              </View>
            </AnimatedScrollView>
          </>
        ) : (
          /* No date set - Welcome screen */
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Countdown</Text>
            <Text style={styles.welcomeSubtitle}>
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
          </View>
        )}

        {/* Date Picker Modal */}
        <DatePickerModal
          visible={showDatePicker}
          currentDate={data.targetDate ? new Date(data.targetDate) : new Date()}
          onConfirm={handleSetDate}
          onCancel={() => setShowDatePicker(false)}
        />
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  indicatorContainer: {
    paddingTop: 10,
  },
  scrollView: {
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
  },
  countdownPage: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  titleContainer: {
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
    paddingBottom: 4,
    minWidth: 200,
  },
  clockContainer: {
    marginVertical: 30,
  },
  dateButton: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    marginTop: 10,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 2,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  swipeHint: {
    marginTop: 40,
    opacity: 0.5,
  },
  swipeHintText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  resetButton: {
    position: 'absolute',
    bottom: 30,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  resetButtonText: {
    fontSize: 14,
    color: 'rgba(255, 59, 48, 0.8)',
    fontWeight: '600',
  },
  tasksPage: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  welcomeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  welcomeTitle: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 40,
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
});

export default HomeScreen;
