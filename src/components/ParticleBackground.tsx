import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface ParticleProps {
  delay: number;
  size: number;
  initialX: number;
  color: string;
}

const Particle: React.FC<ParticleProps> = ({ delay, size, initialX, color }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, {
          duration: 4000 + Math.random() * 2000,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 1], [height + 50, -50]);
    const translateX = interpolate(
      progress.value,
      [0, 0.5, 1],
      [0, Math.sin(progress.value * Math.PI * 2) * 30, 0]
    );
    const opacity = interpolate(
      progress.value,
      [0, 0.1, 0.9, 1],
      [0, 0.6, 0.6, 0]
    );
    const scale = interpolate(
      progress.value,
      [0, 0.5, 1],
      [0.5, 1, 0.5]
    );

    return {
      transform: [
        { translateY },
        { translateX },
        { scale },
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: initialX,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

const ParticleBackground: React.FC = () => {
  const colors = [
    'rgba(147, 112, 219, 0.6)',
    'rgba(100, 149, 237, 0.6)',
    'rgba(255, 182, 193, 0.5)',
    'rgba(144, 238, 144, 0.5)',
    'rgba(255, 218, 185, 0.5)',
  ];

  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    delay: i * 300,
    size: 4 + Math.random() * 8,
    initialX: Math.random() * width,
    color: colors[i % colors.length],
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => (
        <Particle
          key={particle.id}
          delay={particle.delay}
          size={particle.size}
          initialX={particle.initialX}
          color={particle.color}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
  },
});

export default ParticleBackground;
