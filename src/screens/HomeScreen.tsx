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
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import FlipClock from '../components/FlipClock';
import TodoList from '../components/TodoList';
import DatePickerModal from '../components/DatePickerModal';
import CircularProgress from '../components/CircularProgress';
import PageIndicator from '../components/PageIndicator';
import { CountdownData, Todo, TaskColor, TASK_COLORS } from '../types';
import { saveData, loadData } from '../utils/storage';
import { formatDate, calculateTimeLeft } from '../utils/time';
import { TaskMarker } from '../components/CircularProgress';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

// Theme colors - Purple/Blue gradient
const COLORS = {
  primary: '#8B5CF6',      // Purple
  secondary: '#6366F1',    // Indigo
  accent: '#A78BFA',       // Light purple
  background: ['#0f0a1f', '#1a1033', '#0d1528'] as const,
  cardBg: 'rgba(139, 92, 246, 0.1)',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  danger: '#EF4444',
};

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

  const handleUpdateTodoDate = (id: string, date: number | null, color: TaskColor) => {
    setData((prev) => ({
      ...prev,
      todos: prev.todos.map((todo) =>
        todo.id === id ? { ...todo, dueDate: date, color } : todo
      ),
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

  // Calculate days progress (how much of the total countdown has passed)
  const getDaysProgress = () => {
    if (!data.targetDate) return 0;
    const timeLeft = calculateTimeLeft(data.targetDate);
    if (timeLeft.total <= 0) return 1;

    // Calculate total days from start (when countdown was set)
    // For simplicity, we show progress based on remaining days out of initial days
    const totalDays = timeLeft.days + 1; // +1 to include today
    const maxDays = 365; // Assume max 1 year countdown for progress calculation

    // Progress = time elapsed / total time
    // We invert it: more days remaining = less progress
    const progress = 1 - (totalDays / Math.max(totalDays, maxDays));
    return Math.min(Math.max(progress, 0.05), 1); // Min 5% to show some progress
  };

  // Calculate hours progress within the current day (24h cycle)
  const getHoursProgress = () => {
    if (!data.targetDate) return 0;
    const timeLeft = calculateTimeLeft(data.targetDate);
    if (timeLeft.total <= 0) return 1;

    // Hours remaining in current day converted to progress
    // 24 hours = 0%, 0 hours = 100%
    const hoursRemaining = timeLeft.hours + (timeLeft.minutes / 60) + (timeLeft.seconds / 3600);
    const progress = 1 - (hoursRemaining / 24);
    return Math.min(Math.max(progress, 0), 1);
  };

  // Calculate task completion progress
  const getTaskProgress = () => {
    if (data.todos.length === 0) return 0;
    const completed = data.todos.filter(t => t.completed).length;
    return completed / data.todos.length;
  };

  // Generate task markers for the circular progress
  const getTaskMarkers = (): TaskMarker[] => {
    if (!data.targetDate) return [];

    const now = Date.now();
    const totalDuration = data.targetDate - now;

    // Only include todos that have due dates
    return data.todos
      .filter((todo) => todo.dueDate)
      .map((todo) => {
        // Calculate position based on how far the due date is from now relative to target
        const timeUntilDue = todo.dueDate! - now;
        // Position: 0 = now (top of circle), 1 = target date
        // We want tasks due soon to be near the progress line
        const position = Math.max(0, Math.min(1, timeUntilDue / totalDuration));

        return {
          id: todo.id,
          position,
          color: todo.color || TASK_COLORS[0],
          completed: todo.completed,
        };
      });
  };

  // Get tasks for a specific date (for showing in countdown page)
  const getTodaysTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    return data.todos.filter(
      (todo) => todo.dueDate && todo.dueDate >= todayStart && todo.dueDate < todayEnd
    );
  };

  if (isLoading) {
    return (
      <LinearGradient colors={[...COLORS.background]} style={styles.gradient}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[...COLORS.background]} style={styles.gradient}>
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
                  {/* Goal Label */}
                  <Text style={styles.goalLabel}>CURRENT GOAL</Text>

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

                  {/* Circular Progress with Flip Clock */}
                  <View style={styles.circleContainer}>
                    <CircularProgress
                      daysProgress={getDaysProgress()}
                      hoursProgress={getHoursProgress()}
                      daysRemaining={calculateTimeLeft(data.targetDate).days}
                      size={280}
                      taskMarkers={getTaskMarkers()}
                    >
                      <FlipClock targetDate={data.targetDate} compact />
                    </CircularProgress>
                  </View>

                  {/* Today's tasks indicator */}
                  {getTodaysTasks().length > 0 && (
                    <View style={styles.todayTasksContainer}>
                      <Text style={styles.todayTasksLabel}>Today's Tasks</Text>
                      <View style={styles.todayTasksList}>
                        {getTodaysTasks().slice(0, 3).map((task) => (
                          <View
                            key={task.id}
                            style={[
                              styles.todayTaskItem,
                              { borderLeftColor: task.color || TASK_COLORS[0] },
                              task.completed && styles.todayTaskItemCompleted,
                            ]}
                          >
                            <Text
                              style={[
                                styles.todayTaskText,
                                task.completed && styles.todayTaskTextCompleted,
                              ]}
                              numberOfLines={1}
                            >
                              {task.text}
                            </Text>
                          </View>
                        ))}
                        {getTodaysTasks().length > 3 && (
                          <Text style={styles.todayTasksMore}>
                            +{getTodaysTasks().length - 3} more
                          </Text>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Task Progress Bar */}
                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Task Progress</Text>
                      <Text style={styles.progressPercent}>
                        {Math.round(getTaskProgress() * 100)}%
                      </Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${getTaskProgress() * 100}%` },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Target Date Button */}
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.dateButtonText}>
                      {formatDate(data.targetDate)}
                    </Text>
                  </TouchableOpacity>

                  {/* Reset Button */}
                  <TouchableOpacity
                    style={styles.resetButton}
                    onPress={handleReset}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.resetButtonText}>Reset Timer</Text>
                  </TouchableOpacity>

                  {/* Swipe hint */}
                  <Text style={styles.swipeHint}>Swipe left for tasks →</Text>
                </View>
              </View>

              {/* Page 2: Tasks */}
              <View style={styles.page}>
                <View style={styles.tasksPage}>
                  <View style={styles.tasksHeader}>
                    <Text style={styles.tasksTitle}>Tasks</Text>
                    <Text style={styles.tasksSubtitle}>
                      {data.todos.filter(t => t.completed).length} of {data.todos.length} completed
                    </Text>
                  </View>
                  <TodoList
                    todos={data.todos}
                    onAddTodo={handleAddTodo}
                    onToggleTodo={handleToggleTodo}
                    onDeleteTodo={handleDeleteTodo}
                    onUpdateTodoDate={handleUpdateTodoDate}
                    targetDate={data.targetDate}
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
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.setDateButtonText}>Set Target Date</Text>
              </LinearGradient>
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
    color: COLORS.textSecondary,
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
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  goalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    letterSpacing: 2,
    marginTop: 10,
  },
  titleContainer: {
    paddingVertical: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  titleInput: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingBottom: 4,
    minWidth: 200,
  },
  circleContainer: {
    marginVertical: 24,
  },
  progressSection: {
    width: '100%',
    marginVertical: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  dateButton: {
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  dateButtonText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  resetButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  resetButtonText: {
    fontSize: 14,
    color: COLORS.danger,
    fontWeight: '500',
  },
  swipeHint: {
    position: 'absolute',
    bottom: 30,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  tasksPage: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tasksHeader: {
    paddingVertical: 16,
  },
  tasksTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  tasksSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
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
    color: COLORS.text,
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  setDateButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    paddingHorizontal: 36,
    paddingVertical: 18,
  },
  setDateButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  // Today's tasks styles
  todayTasksContainer: {
    width: '100%',
    marginTop: 8,
    marginBottom: 8,
  },
  todayTasksLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  todayTasksList: {
    gap: 6,
  },
  todayTaskItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  todayTaskItemCompleted: {
    opacity: 0.5,
  },
  todayTaskText: {
    fontSize: 13,
    color: COLORS.text,
  },
  todayTaskTextCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  todayTasksMore: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default HomeScreen;
