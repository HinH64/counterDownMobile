import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { TimeLeft } from '../types';
import { calculateTimeLeft } from '../utils/time';

interface Props {
  targetDate: number;
}

interface FlipCardProps {
  value: string;
  label: string;
}

const FlipCard: React.FC<FlipCardProps> = ({ value, label }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [nextValue, setNextValue] = useState(value);
  const flipAnimation = useSharedValue(0);

  const updateDisplay = useCallback(() => {
    setDisplayValue(nextValue);
  }, [nextValue]);

  useEffect(() => {
    if (value !== displayValue) {
      setNextValue(value);
      flipAnimation.value = 0;
      flipAnimation.value = withTiming(1, {
        duration: 300,
        easing: Easing.inOut(Easing.ease),
      });

      // Update display value halfway through animation
      const timeout = setTimeout(() => {
        setDisplayValue(value);
      }, 150);

      return () => clearTimeout(timeout);
    }
  }, [value]);

  // Top flap (flips down, shows old value then hides)
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
      transform: [
        { perspective: 400 },
        { rotateX: `${rotateX}deg` },
      ],
      opacity,
    };
  });

  // Bottom flap (flips down from top, shows new value)
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
      transform: [
        { perspective: 400 },
        { rotateX: `${rotateX}deg` },
      ],
      opacity,
    };
  });

  return (
    <View style={styles.flipCardContainer}>
      <View style={styles.flipCard}>
        {/* Static top half - shows current display value */}
        <View style={styles.cardTop}>
          <View style={styles.cardTopInner}>
            <Text style={styles.cardValue}>{displayValue}</Text>
          </View>
        </View>

        {/* Static bottom half - shows next value */}
        <View style={styles.cardBottom}>
          <View style={styles.cardBottomInner}>
            <Text style={styles.cardValue}>{nextValue}</Text>
          </View>
        </View>

        {/* Animated top flap - flips down showing old value */}
        <Animated.View style={[styles.flipTop, topFlapStyle]}>
          <View style={styles.flipTopInner}>
            <Text style={styles.cardValue}>{displayValue}</Text>
          </View>
        </Animated.View>

        {/* Animated bottom flap - flips down showing new value */}
        <Animated.View style={[styles.flipBottom, bottomFlapStyle]}>
          <View style={styles.flipBottomInner}>
            <Text style={styles.cardValue}>{nextValue}</Text>
          </View>
        </Animated.View>

        {/* Center divider */}
        <View style={styles.cardDivider} />

        {/* Corner screws decoration */}
        <View style={[styles.screw, styles.screwTopLeft]} />
        <View style={[styles.screw, styles.screwTopRight]} />
        <View style={[styles.screw, styles.screwBottomLeft]} />
        <View style={[styles.screw, styles.screwBottomRight]} />
      </View>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
};

const FlipClock: React.FC<Props> = ({ targetDate }) => {
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

  const formatValue = (val: number) => String(val).padStart(2, '0');

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

const CARD_WIDTH = 68;
const CARD_HEIGHT = 85;
const HALF_HEIGHT = CARD_HEIGHT / 2;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipCardContainer: {
    alignItems: 'center',
    marginHorizontal: 3,
  },
  flipCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  // Static top half
  cardTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HALF_HEIGHT,
    backgroundColor: '#2d2d2d',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
  },
  cardTopInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Static bottom half
  cardBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: HALF_HEIGHT,
    backgroundColor: '#222222',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
  },
  cardBottomInner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Animated top flap (flips down)
  flipTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HALF_HEIGHT,
    backgroundColor: '#2d2d2d',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
    zIndex: 10,
    backfaceVisibility: 'hidden',
    transformOrigin: 'bottom',
  },
  flipTopInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Animated bottom flap (comes from top)
  flipBottom: {
    position: 'absolute',
    top: HALF_HEIGHT,
    left: 0,
    right: 0,
    height: HALF_HEIGHT,
    backgroundColor: '#222222',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
    zIndex: 10,
    backfaceVisibility: 'hidden',
    transformOrigin: 'top',
  },
  flipBottomInner: {
    position: 'absolute',
    top: -HALF_HEIGHT,
    left: 0,
    right: 0,
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardValue: {
    fontSize: 46,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  cardDivider: {
    position: 'absolute',
    top: HALF_HEIGHT - 1,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#111111',
    zIndex: 20,
  },
  screw: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#444444',
    zIndex: 30,
  },
  screwTopLeft: {
    top: 4,
    left: 4,
  },
  screwTopRight: {
    top: 4,
    right: 4,
  },
  screwBottomLeft: {
    bottom: 4,
    left: 4,
  },
  screwBottomRight: {
    bottom: 4,
    right: 4,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 8,
    letterSpacing: 1,
  },
  separator: {
    height: CARD_HEIGHT,
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
  completedText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default FlipClock;
