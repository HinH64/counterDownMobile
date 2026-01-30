import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { TimeLeft } from '../types';
import { calculateTimeLeft } from '../utils/time';

interface Props {
  targetDate: number;
}

interface TimeUnitProps {
  value: number;
  label: string;
}

const TimeUnit: React.FC<TimeUnitProps> = ({ value, label }) => {
  const scale = useSharedValue(1);
  const previousValue = React.useRef(value);

  useEffect(() => {
    if (previousValue.current !== value) {
      scale.value = withSequence(
        withTiming(1.2, { duration: 100 }),
        withSpring(1, { damping: 10, stiffness: 100 })
      );
      previousValue.current = value;
    }
  }, [value, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scale.value, [1, 1.2], [1, 0.8], Extrapolate.CLAMP),
  }));

  return (
    <Animated.View style={[styles.timeUnit, containerStyle]}>
      <View style={styles.timeCard}>
        <Animated.Text style={[styles.timeValue, animatedStyle]}>
          {String(value).padStart(2, '0')}
        </Animated.Text>
      </View>
      <Text style={styles.timeLabel}>{label}</Text>
    </Animated.View>
  );
};

const CountdownTimer: React.FC<Props> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.total <= 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.completedText}>The Day Has Arrived!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.timerRow}>
        <TimeUnit value={timeLeft.days} label="Days" />
        <Text style={styles.separator}>:</Text>
        <TimeUnit value={timeLeft.hours} label="Hours" />
        <Text style={styles.separator}>:</Text>
        <TimeUnit value={timeLeft.minutes} label="Mins" />
        <Text style={styles.separator}>:</Text>
        <TimeUnit value={timeLeft.seconds} label="Secs" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeUnit: {
    alignItems: 'center',
    marginHorizontal: 4,
  },
  timeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 70,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  timeValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  timeLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  separator: {
    fontSize: 32,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 20,
  },
  completedText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default CountdownTimer;
