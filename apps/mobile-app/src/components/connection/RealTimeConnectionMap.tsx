import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import Svg, { Circle, Line, G, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useVPNStore, useServersStore } from '@/src/store';

const { width, height } = Dimensions.get('window');
const MAP_WIDTH = width - 40;
const MAP_HEIGHT = 250;

interface Location {
  x: number;
  y: number;
  latitude: number;
  longitude: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

export default function RealTimeConnectionMap() {
  const { currentServer, status } = useVPNStore();
  const { servers } = useServersStore();
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const connectionLineAnim = useRef(new Animated.Value(0)).current;
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [serverLocation, setServerLocation] = useState<Location | null>(null);

  // Convert lat/lng to map coordinates (simple mercator-like projection)
  const latLngToXY = (lat: number, lng: number): { x: number; y: number } => {
    // Normalize longitude from -180,180 to 0,1
    const x = ((lng + 180) / 360) * MAP_WIDTH;
    
    // Normalize latitude from -90,90 to 0,1 (Mercator projection)
    const latRad = (lat * Math.PI) / 180;
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const y = MAP_HEIGHT / 2 - (MAP_WIDTH * mercN) / (2 * Math.PI);
    
    return { x, y };
  };

  // Get user's approximate location (mock for now)
  useEffect(() => {
    // TODO: Get actual user location using expo-location
    // For now, using a mock location (e.g., San Francisco)
    const mockUserLat = 37.7749;
    const mockUserLng = -122.4194;
    const userCoords = latLngToXY(mockUserLat, mockUserLng);
    
    setUserLocation({
      x: userCoords.x,
      y: userCoords.y,
      latitude: mockUserLat,
      longitude: mockUserLng,
    });
  }, []);

  // Update server location when connected
  useEffect(() => {
    if (currentServer && currentServer.latitude && currentServer.longitude) {
      const serverCoords = latLngToXY(currentServer.latitude, currentServer.longitude);
      setServerLocation({
        x: serverCoords.x,
        y: serverCoords.y,
        latitude: currentServer.latitude,
        longitude: currentServer.longitude,
      });
    } else {
      setServerLocation(null);
    }
  }, [currentServer]);

  // Pulsing animation for connection points
  useEffect(() => {
    if (status === 'connected') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Animate connection line
      Animated.loop(
        Animated.sequence([
          Animated.timing(connectionLineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(connectionLineAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      connectionLineAnim.setValue(0);
    }
  }, [status]);

  // Render all server locations as small dots
  const renderServerDots = () => {
    return servers
      .filter((server) => server.latitude && server.longitude)
      .map((server) => {
        const coords = latLngToXY(server.latitude, server.longitude);
        const isActive = currentServer?.id === server.id;
        
        return (
          <G key={server.id}>
            {isActive ? (
              <>
                <Circle
                  cx={coords.x}
                  cy={coords.y}
                  r={8}
                  fill="#10B981"
                  opacity={0.3}
                />
                <Circle
                  cx={coords.x}
                  cy={coords.y}
                  r={5}
                  fill="#10B981"
                />
              </>
            ) : (
              <Circle
                cx={coords.x}
                cy={coords.y}
                r={3}
                fill="#4B5563"
                opacity={0.6}
              />
            )}
          </G>
        );
      });
  };

  return (
    <View style={styles.container}>
      <Svg width={MAP_WIDTH} height={MAP_HEIGHT}>
        <Defs>
          <RadialGradient id="userGlow" cx="50%" cy="50%">
            <Stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="serverGlow" cx="50%" cy="50%">
            <Stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* World Map Outline (simplified) */}
        <Path
          d="M10,125 L60,100 L120,105 L180,95 L240,110 L300,100 L340,115 M20,150 L80,135 L140,145 L200,130 L260,140 L320,135"
          stroke="#374151"
          strokeWidth={1}
          fill="none"
          opacity={0.5}
        />

        {/* Render all server dots */}
        {renderServerDots()}

        {/* User Location */}
        {userLocation && (
          <G>
            <Circle cx={userLocation.x} cy={userLocation.y} r={15} fill="url(#userGlow)" />
            <Circle cx={userLocation.x} cy={userLocation.y} r={6} fill="#3B82F6" />
            <Circle
              cx={userLocation.x}
              cy={userLocation.y}
              r={3}
              fill="#FFFFFF"
              opacity={0.9}
            />
          </G>
        )}

        {/* Connection Line (when connected) */}
        {status === 'connected' && userLocation && serverLocation && (
          <>
            <Line
              x1={userLocation.x}
              y1={userLocation.y}
              x2={serverLocation.x}
              y2={serverLocation.y}
              stroke="#10B981"
              strokeWidth={2}
              opacity={0.3}
              strokeDasharray="5,5"
            />
            
            {/* Animated data flow */}
            <AnimatedLine
              x1={userLocation.x}
              y1={userLocation.y}
              x2={serverLocation.x}
              y2={serverLocation.y}
              stroke="#10B981"
              strokeWidth={3}
              strokeDasharray="10,20"
              strokeDashoffset={connectionLineAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -30],
              })}
            />
          </>
        )}

        {/* Server Location (when connected) */}
        {status === 'connected' && serverLocation && (
          <G>
            <AnimatedCircle
              cx={serverLocation.x}
              cy={serverLocation.y}
              r={15}
              fill="url(#serverGlow)"
              scale={pulseAnim}
              origin={`${serverLocation.x}, ${serverLocation.y}`}
            />
            <Circle cx={serverLocation.x} cy={serverLocation.y} r={8} fill="#10B981" />
            <Circle
              cx={serverLocation.x}
              cy={serverLocation.y}
              r={4}
              fill="#FFFFFF"
              opacity={0.9}
            />
          </G>
        )}

        {/* Connecting animation (when connecting) */}
        {status === 'connecting' && userLocation && serverLocation && (
          <>
            <Line
              x1={userLocation.x}
              y1={userLocation.y}
              x2={serverLocation.x}
              y2={serverLocation.y}
              stroke="#F59E0B"
              strokeWidth={2}
              opacity={0.5}
              strokeDasharray="5,5"
            />
            <AnimatedCircle
              cx={serverLocation.x}
              cy={serverLocation.y}
              r={12}
              fill="none"
              stroke="#F59E0B"
              strokeWidth={2}
              scale={pulseAnim}
              origin={`${serverLocation.x}, ${serverLocation.y}`}
            />
          </>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
});
