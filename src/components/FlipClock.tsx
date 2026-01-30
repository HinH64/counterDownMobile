import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { TimeLeft } from '../types';
import { calculateTimeLeft } from '../utils/time';

interface Props {
  targetDate: number;
  compact?: boolean;
}

interface FlipCardProps {
  value: string;
  label: string;
  compact?: boolean;
}

const FlipCard: React.FC<FlipCardProps> = ({ value, label, compact }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [nextValue, setNextValue] = useState(value);
  const flipAnimation = useSharedValue(0);

  useEffect(() => {
    if (value !== displayValue) {
      setNextValue(value);
      flipAnimation.value = 0;
      flipAnimation.value = withTiming(1, {
        duration: 300,
        easing: Easing.inOut(Easing.ease),
      });

      const timeout = setTimeout(() => {
        setDisplayValue(value);
      }, 150);

      return () => clearTimeout(timeout);
    }
  }, [value]);

  const topFlapStyle = useAnimatedStyle(() => {
    const rotateX = interpolate(
      flipAnimation.value,
      [0, 0.5, 0.5, 1],
      [0, -90, -90, -90]
    );
    const opacity = interpolate(
      flipAnimation.value,
      [0, 0.5, 0.5, 1],
      [1, 1, 0, 0]
    );
    return {
      transform: [{ perspective: 300 }, { rotateX: `${rotateX}deg` }],
      opacity,
    };
  });

  const bottomFlapStyle = useAnimatedStyle(() => {
    const rotateX = interpolate(
      flipAnimation.value,
      [0, 0.5, 0.5, 1],
      [90, 90, 90, 0]
    );
    const opacity = interpolate(
      flipAnimation.value,
      [0, 0.5, 0.5, 1],
      [0, 0, 1, 1]
    );
    return {
      transform: [{ perspective: 300 }, { rotateX: `${rotateX}deg` }],
      opacity,
    };
  });

  const cardWidth = compact ? 44 : 68;
  const cardHeight = compact ? 54 : 85;
  const halfHeight = cardHeight / 2;
  const fontSize = compact ? 28 : 46;

  return (
    <View style={styles.flipCardContainer}>
      <View style={[styles.flipCard, { width: cardWidth, height: cardHeight }]}>
        {/* Static top half */}
        <View style={[styles.cardTop, { height: halfHeight }]}>
          <View style={[styles.cardTopInner, { height: cardHeight }]}>
            <Text style={[styles.cardValue, { fontSize }]}>{displayValue}</Text>
          </View>
        </View>

        {/* Static bottom half */}
        <View style={[styles.cardBottom, { height: halfHeight }]}>
          <View style={[styles.cardBottomInner, { height: cardHeight }]}>
            <Text style={[styles.cardValue, { fontSize }]}>{nextValue}</Text>
          </View>
        </View>

        {/* Animated top flap */}
        <Animated.View style={[styles.flipTop, { height: halfHeight }, topFlapStyle]}>
          <View style={[styles.flipTopInner, { height: cardHeight }]}>
            <Text style={[styles.cardValue, { fontSize }]}>{displayValue}</Text>
          </View>
        </Animated.View>

        {/* Animated bottom flap */}
        <Animated.View style={[styles.flipBottom, { top: halfHeight, height: halfHeight }, bottomFlapStyle]}>
          <View style={[styles.flipBottomInner, { top: -halfHeight, height: cardHeight }]}>
            <Text style={[styles.cardValue, { fontSize }]}>{nextValue}</Text>
          </View>
        </Animated.View>

        {/* Center divider */}
        <View style={[styles.cardDivider, { top: halfHeight - 1 }]} />
      </View>
      {!compact && <Text style={styles.cardLabel}>{label}</Text>}
    </View>
  );
};

const FlipClock: React.FC<Props> = ({ targetDate, compact = false }) => {
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
        <Text style={styles.completedText}>Done!</Text>
      </View>
    );
  }

  const formatValue = (val: number) => String(val).padStart(2, '0');

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {/* Days - shown big at top */}
        <View style={styles.daysSection}>
          <Text style={styles.daysValue}>{timeLeft.days}</Text>
          <Text style={styles.daysLabel}>DAYS</Text>
        </View>

        {/* Hours : Minutes : Seconds */}
        <View style={styles.timeRow}>
          <FlipCard value={formatValue(timeLeft.hours)} label="H" compact />
          <Text style={styles.compactSeparator}>:</Text>
          <FlipCard value={formatValue(timeLeft.minutes)} label="M" compact />
          <Text style={styles.compactSeparator}>:</Text>
          <FlipCard value={formatValue(timeLeft.seconds)} label="S" compact />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.clockRow}>
        <FlipCard value={formatValue(timeLeft.days)} label="DAYS" />
        <View style={styles.separator}>
          <View style={styles.separatorDot} />
          <View style={styles.separatorDot} />
        </View>
        <FlipCard value={formatValue(timeLeft.hours)} label="HOURS" />
        <View style={styles.separator}>
          <View style={styles.separatorDot} />
          <View style={styles.separatorDot} />
        </View>
        <FlipCard value={formatValue(timeLeft.minutes)} label="MINS" />
        <View style={styles.separator}>
          <View style={styles.separatorDot} />
          <View style={styles.separatorDot} />
        </View>
        <FlipCard value={formatValue(timeLeft.seconds)} label="SECS" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  compactContainer: {
    alignItems: 'center',
  },
  daysSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  daysValue: {
    fontSize: 56,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    lineHeight: 64,
  },
  daysLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 3,
    marginTop: 2,
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  flipCardContainer: {
    alignItems: 'center',
    marginHorizontal: 2,
  },
  flipCard: {
    borderRadius: 6,
    backgroundColor: '#1a1a2e',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  cardTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#252542',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    overflow: 'hidden',
  },
  cardTopInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1e1e38',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    overflow: 'hidden',
  },
  cardBottomInner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#252542',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    overflow: 'hidden',
    zIndex: 10,
    backfaceVisibility: 'hidden',
  },
  flipTopInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#1e1e38',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    overflow: 'hidden',
    zIndex: 10,
    backfaceVisibility: 'hidden',
  },
  flipBottomInner: {
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardValue: {
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  cardDivider: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#0f0f1a',
    zIndex: 20,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 8,
    letterSpacing: 1,
  },
  separator: {
    height: 85,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    gap: 10,
  },
  separatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  compactSeparator: {
    fontSize: 22,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 2,
    marginBottom: 4,
  },
  completedText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default FlipClock;
