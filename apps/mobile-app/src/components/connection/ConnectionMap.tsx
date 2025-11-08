/**
 * Connection Map Component
 * Beautiful world map showing VPN connection
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface ConnectionMapProps {
  isConnected: boolean;
  serverLocation?: string;
}

export function ConnectionMap({ isConnected, serverLocation }: ConnectionMapProps) {
  const pulseAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isConnected) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnimation.setValue(0);
    }
  }, [isConnected]);

  // Simplified world map representation
  return (
    <View style={styles.container}>
      <Svg width={width} height={200} viewBox="0 0 400 200">
        {/* World map outline (simplified) */}
        <Path
          d="M 50 80 Q 80 70, 120 80 L 140 90 Q 160 95, 180 90 L 200 85 Q 220 80, 240 85 L 260 90 Q 280 95, 300 90 L 320 80 Q 340 75, 360 80"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="2"
          fill="none"
        />
        <Path
          d="M 60 120 Q 90 110, 130 120 L 150 130 Q 170 135, 190 130 L 210 125"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="2"
          fill="none"
        />

        {/* User location (center) */}
        <Circle cx="200" cy="100" r="8" fill="#3B82F6" opacity={0.8} />
        <Circle cx="200" cy="100" r="4" fill="#FFFFFF" />

        {/* Server location */}
        {isConnected && (
          <>
            {/* Connection line */}
            <Line
              x1="200"
              y1="100"
              x2="320"
              y2="85"
              stroke="#10B981"
              strokeWidth="2"
              opacity={0.6}
              strokeDasharray="5,5"
            />
            
            {/* Server marker */}
            <Circle cx="320" cy="85" r="10" fill="#10B981" opacity={0.8} />
            <Circle cx="320" cy="85" r="6" fill="#FFFFFF" />

            {/* Pulse effect */}
            <Circle cx="320" cy="85" r="14" fill="none" stroke="#10B981" strokeWidth="2" opacity={0.3} />
          </>
        )}

        {/* Grid points */}
        {!isConnected && (
          <>
            <Circle cx="100" cy="80" r="3" fill="rgba(255,255,255,0.3)" />
            <Circle cx="150" cy="90" r="3" fill="rgba(255,255,255,0.3)" />
            <Circle cx="250" cy="85" r="3" fill="rgba(255,255,255,0.3)" />
            <Circle cx="320" cy="85" r="3" fill="rgba(255,255,255,0.3)" />
            <Circle cx="120" cy="130" r="3" fill="rgba(255,255,255,0.3)" />
            <Circle cx="180" cy="125" r="3" fill="rgba(255,255,255,0.3)" />
          </>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
