import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  daysProgress: number;    // 0 to 1 - overall days progress
  hoursProgress: number;   // 0 to 1 - current day hours progress (24h cycle)
  size?: number;
  children?: React.ReactNode;
}

const CircularProgress: React.FC<Props> = ({
  daysProgress,
  hoursProgress,
  size = 280,
  children,
}) => {
  const outerStrokeWidth = 6;
  const innerStrokeWidth = 4;
  const gap = 12;

  const outerRadius = (size - outerStrokeWidth) / 2;
  const innerRadius = outerRadius - gap - innerStrokeWidth;

  const outerCircumference = 2 * Math.PI * outerRadius;
  const innerCircumference = 2 * Math.PI * innerRadius;

  // Outer ring - days progress (purple gradient)
  const outerAnimatedProps = useAnimatedProps(() => {
    const strokeDashoffset = outerCircumference * (1 - daysProgress);
    return {
      strokeDashoffset: withTiming(strokeDashoffset, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      }),
    };
  });

  // Inner ring - hours progress (cyan/teal gradient)
  const innerAnimatedProps = useAnimatedProps(() => {
    const strokeDashoffset = innerCircumference * (1 - hoursProgress);
    return {
      strokeDashoffset: withTiming(strokeDashoffset, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      }),
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          {/* Purple gradient for days (outer) */}
          <LinearGradient id="daysGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#A855F7" />
            <Stop offset="50%" stopColor="#8B5CF6" />
            <Stop offset="100%" stopColor="#6366F1" />
          </LinearGradient>

          {/* Cyan/Teal gradient for hours (inner) */}
          <LinearGradient id="hoursGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#06B6D4" />
            <Stop offset="50%" stopColor="#14B8A6" />
            <Stop offset="100%" stopColor="#10B981" />
          </LinearGradient>
        </Defs>

        {/* Outer background circle (days) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={outerRadius}
          stroke="rgba(168, 85, 247, 0.15)"
          strokeWidth={outerStrokeWidth}
          fill="transparent"
        />

        {/* Outer progress circle (days) */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={outerRadius}
          stroke="url(#daysGradient)"
          strokeWidth={outerStrokeWidth}
          fill="transparent"
          strokeDasharray={outerCircumference}
          animatedProps={outerAnimatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />

        {/* Inner background circle (hours) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={innerRadius}
          stroke="rgba(6, 182, 212, 0.12)"
          strokeWidth={innerStrokeWidth}
          fill="transparent"
        />

        {/* Inner progress circle (hours) */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={innerRadius}
          stroke="url(#hoursGradient)"
          strokeWidth={innerStrokeWidth}
          fill="transparent"
          strokeDasharray={innerCircumference}
          animatedProps={innerAnimatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CircularProgress;
