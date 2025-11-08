/**
 * Connection Button - Revolutionary AI-Powered Connect Button
 * The central control for VPN connections
 */

import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Animated } from 'react-native';
import { ConnectionStatus } from '@/src/types/vpn';

interface ConnectionButtonProps {
  isConnected: boolean;
  status: ConnectionStatus;
  onPress: () => void;
  glowAnimation: Animated.Value;
}

export function ConnectionButton({ 
  isConnected, 
  status, 
  onPress, 
  glowAnimation 
}: ConnectionButtonProps) {
  
  const getButtonColor = () => {
    if (isConnected) return '#10B981';
    if (status === 'connecting' || status === 'reconnecting') return '#F59E0B';
    if (status === 'error') return '#EF4444';
    return '#6366F1';
  };

  const getButtonText = () => {
    if (isConnected) return 'Disconnect';
    if (status === 'connecting') return 'Connecting...';
    if (status === 'reconnecting') return 'Reconnecting...';
    if (status === 'disconnecting') return 'Disconnecting...';
    return 'Connect';
  };

  const glowOpacity = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const glowScale = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  return (
    <View style={styles.container}>
      {/* Glow Effect */}
      {isConnected && (
        <Animated.View
          style={[
            styles.glow,
            {
              backgroundColor: getButtonColor(),
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        />
      )}

      {/* Main Button */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: getButtonColor() }]}
        onPress={onPress}
        activeOpacity={0.8}
        disabled={status === 'connecting' || status === 'disconnecting'}
      >
        <View style={styles.iconContainer}>
          {isConnected ? (
            <Text style={styles.icon}>✓</Text>
          ) : status === 'connecting' || status === 'reconnecting' ? (
            <Text style={styles.icon}>⟳</Text>
          ) : (
            <Text style={styles.icon}>⚡</Text>
          )}
        </View>
        
        <Text style={styles.buttonText}>{getButtonText()}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.3,
  },
  button: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  iconContainer: {
    marginBottom: 8,
  },
  icon: {
    fontSize: 48,
    color: '#FFFFFF',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
