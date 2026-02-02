import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { TaskColor } from '../types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface TaskMarker {
  id: string;
  position: number;  // 0 to 1 - position on the circle (based on date)
  color: TaskColor;
  completed: boolean;
}

interface Props {
  daysProgress: number;    // 0 to 1 - overall days progress
  hoursProgress: number;   // 0 to 1 - current day hours progress (24h cycle)
  daysRemaining?: number;  // Number of days remaining (0 triggers effect)
  size?: number;
  children?: React.ReactNode;
  taskMarkers?: TaskMarker[];  // Task markers to display on outer ring
}

const CircularProgress: React.FC<Props> = ({
  daysProgress,
  hoursProgress,
  daysRemaining = -1,
  size = 280,
  children,
  taskMarkers = [],
}) => {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  // Trigger pulse animation when days = 0
  useEffect(() => {
    if (daysRemaining === 0) {
      // Pulsing scale animation
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // infinite
        false
      );
      // Pulsing glow opacity
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
      pulseOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [daysRemaining]);

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));
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

  const isFinalDay = daysRemaining === 0;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Glow effect layer (behind everything) */}
      {isFinalDay && (
        <Animated.View
          style={[
            styles.glowLayer,
            {
              width: size + 40,
              height: size + 40,
              borderRadius: (size + 40) / 2,
            },
            glowAnimatedStyle,
          ]}
        />
      )}

      <Animated.View
        style={[
          styles.svgContainer,
          { width: size, height: size },
          isFinalDay ? pulseAnimatedStyle : undefined,
        ]}
      >
        <Svg width={size} height={size}>
          <Defs>
            {/* Purple gradient for days (outer) - changes to orange/red on final day */}
            <LinearGradient id="daysGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={isFinalDay ? '#F97316' : '#A855F7'} />
              <Stop offset="50%" stopColor={isFinalDay ? '#EF4444' : '#8B5CF6'} />
              <Stop offset="100%" stopColor={isFinalDay ? '#DC2626' : '#6366F1'} />
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
            stroke={isFinalDay ? 'rgba(249, 115, 22, 0.2)' : 'rgba(168, 85, 247, 0.15)'}
            strokeWidth={outerStrokeWidth}
            fill="transparent"
          />

          {/* Outer progress circle (days) */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={outerRadius}
            stroke="url(#daysGradient)"
            strokeWidth={isFinalDay ? outerStrokeWidth + 2 : outerStrokeWidth}
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

          {/* Task markers on outer ring */}
          {taskMarkers.map((marker) => {
            // Convert position (0-1) to angle, starting from top (-90 degrees)
            const angle = (marker.position * 360 - 90) * (Math.PI / 180);
            const markerRadius = outerRadius;
            const cx = size / 2 + markerRadius * Math.cos(angle);
            const cy = size / 2 + markerRadius * Math.sin(angle);
            const markerSize = marker.completed ? 6 : 10;

            return (
              <Circle
                key={marker.id}
                cx={cx}
                cy={cy}
                r={markerSize}
                fill={marker.color}
                opacity={marker.completed ? 0.5 : 1}
                stroke={marker.completed ? 'transparent' : '#FFFFFF'}
                strokeWidth={marker.completed ? 0 : 2}
              />
            );
          })}
        </Svg>
      </Animated.View>

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
  svgContainer: {
    position: 'absolute',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowLayer: {
    position: 'absolute',
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 10,
  },
});

export default CircularProgress;
