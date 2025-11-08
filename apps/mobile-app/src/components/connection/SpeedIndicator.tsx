/**
 * Speed Indicator Component
 * Displays connection metrics in a beautiful way
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SpeedIndicatorProps {
  label: string;
  speed: string;
  icon: string;
  color: string;
}

export function SpeedIndicator({ label, speed, icon, color }: SpeedIndicatorProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Text style={[styles.icon, { color }]}>{icon}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.speed}>{speed}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 24,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  speed: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
