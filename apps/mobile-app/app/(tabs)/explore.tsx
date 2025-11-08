/**
 * Servers Screen - Server Explorer & Selection
 * Revolutionary server browsing experience
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useServersStore, useVPNStore } from '@/src/store';
import { Server } from '@/src/types/vpn';
import { serverRecommender } from '@/src/services/ai/ServerRecommender';
import vpnConnectionService from '@/src/services/vpn/VPNConnectionService';

export default function ServersScreen() {
  const { servers, favoriteServers, toggleFavorite, recommendedServer } = useServersStore();
  const { status } = useVPNStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'favorites' | 'streaming' | 'p2p'>('all');
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);

  // Filter servers based on search and filter
  const filteredServers = servers.filter(server => {
    const matchesSearch = server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         server.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         server.city.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' ? true :
                         selectedFilter === 'favorites' ? favoriteServers.includes(server.id) :
                         server.features.includes(selectedFilter as any);
    
    return matchesSearch && matchesFilter;
  });

  // Get AI recommendation
  const handleGetRecommendation = async () => {
    setIsLoadingRecommendation(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const recommended = await serverRecommender.getRecommendedServer('general');
      if (recommended) {
        // Scroll to recommended server or highlight it
        console.log('Recommended server:', recommended.name);
      }
    } catch (error) {
      console.error('Failed to get recommendation:', error);
    } finally {
      setIsLoadingRecommendation(false);
    }
  };

  const handleConnect = async (server: Server) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    try {
      await vpnConnectionService.connect(server);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleToggleFavorite = async (serverId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavorite(serverId);
  };

  return (
    <LinearGradient
      colors={['#1F2937', '#111827', '#000000']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Server Explorer</Text>
          <Text style={styles.subtitle}>
            {filteredServers.length} servers available
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search servers, countries, cities..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* AI Recommendation Button */}
        <TouchableOpacity
          style={styles.aiButton}
          onPress={handleGetRecommendation}
          disabled={isLoadingRecommendation}
        >
          <LinearGradient
            colors={['#8B5CF6', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiButtonGradient}
          >
            {isLoadingRecommendation ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.aiButtonIcon}>🤖</Text>
                <Text style={styles.aiButtonText}>AI Recommended Server</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(['all', 'favorites', 'streaming', 'p2p'] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterChip,
                  selectedFilter === filter && styles.filterChipActive,
                ]}
                onPress={() => {
                  setSelectedFilter(filter);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedFilter === filter && styles.filterChipTextActive,
                  ]}
                >
                  {filter === 'all' ? '🌍 All' :
                   filter === 'favorites' ? '⭐ Favorites' :
                   filter === 'streaming' ? '📺 Streaming' :
                   '⚡ P2P'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Server List */}
        <View style={styles.serversList}>
          {filteredServers.map((server) => (
            <ServerCard
              key={server.id}
              server={server}
              isFavorite={favoriteServers.includes(server.id)}
              isRecommended={recommendedServer?.id === server.id}
              isConnecting={status === 'connecting'}
              onConnect={() => handleConnect(server)}
              onToggleFavorite={() => handleToggleFavorite(server.id)}
            />
          ))}
        </View>

        {/* Empty State */}
        {filteredServers.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No servers found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try adjusting your search or filters
            </Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

// Server Card Component
interface ServerCardProps {
  server: Server;
  isFavorite: boolean;
  isRecommended: boolean;
  isConnecting: boolean;
  onConnect: () => void;
  onToggleFavorite: () => void;
}

function ServerCard({ 
  server, 
  isFavorite, 
  isRecommended, 
  isConnecting,
  onConnect, 
  onToggleFavorite 
}: ServerCardProps) {
  const getLoadColor = (load: number) => {
    if (load < 30) return '#10B981'; // Green
    if (load < 70) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getStatusColor = () => {
    if (server.status === 'online') return '#10B981';
    if (server.status === 'offline') return '#6B7280';
    return '#F59E0B';
  };

  return (
    <View style={[styles.serverCard, isRecommended && styles.serverCardRecommended]}>
      {/* Recommended Badge */}
      {isRecommended && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedBadgeText}>✨ AI Recommended</Text>
        </View>
      )}

      {/* Server Info */}
      <View style={styles.serverCardHeader}>
        <View style={styles.serverCardInfo}>
          <Text style={styles.serverCardTitle}>{server.name}</Text>
          <Text style={styles.serverCardSubtitle}>
            {server.city}, {server.country}
          </Text>
        </View>

        {/* Favorite Button */}
        <TouchableOpacity onPress={onToggleFavorite} style={styles.favoriteButton}>
          <Text style={styles.favoriteIcon}>{isFavorite ? '⭐' : '☆'}</Text>
        </TouchableOpacity>
      </View>

      {/* Performance Metrics */}
      <View style={styles.metricsContainer}>
        {/* Load */}
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Load</Text>
          <View style={styles.loadMeterContainer}>
            <View style={styles.loadMeterBackground}>
              <View 
                style={[
                  styles.loadMeterFill, 
                  { width: `${server.load}%`, backgroundColor: getLoadColor(server.load) }
                ]} 
              />
            </View>
            <Text style={[styles.metricValue, { color: getLoadColor(server.load) }]}>
              {server.load}%
            </Text>
          </View>
        </View>

        {/* Ping */}
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Ping</Text>
          <Text style={[styles.metricValue, { color: server.ping && server.ping < 50 ? '#10B981' : '#F59E0B' }]}>
            {server.ping ? `${server.ping}ms` : 'N/A'}
          </Text>
        </View>

        {/* Status */}
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Status</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={[styles.metricValue, { color: getStatusColor() }]}>
              {server.status}
            </Text>
          </View>
        </View>
      </View>

      {/* Features */}
      {server.features.length > 0 && (
        <View style={styles.featuresContainer}>
          {server.features.map((feature) => (
            <View key={feature} style={styles.featureChip}>
              <Text style={styles.featureChipText}>
                {feature === 'streaming' ? '📺' : 
                 feature === 'p2p' ? '⚡' : 
                 feature === 'double-vpn' ? '🔒🔒' : 
                 feature === 'tor-over-vpn' ? '🧅' : '🎯'} {feature}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Connect Button */}
      <TouchableOpacity
        style={styles.connectButton}
        onPress={onConnect}
        disabled={isConnecting || server.status !== 'online'}
      >
        <LinearGradient
          colors={server.status === 'online' ? ['#10B981', '#059669'] : ['#6B7280', '#4B5563']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.connectButtonGradient}
        >
          <Text style={styles.connectButtonText}>
            {isConnecting ? 'Connecting...' : 
             server.status !== 'online' ? 'Offline' : 'Connect'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#374151',
  },
  aiButton: {
    marginBottom: 16,
  },
  aiButtonGradient: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  aiButtonIcon: {
    fontSize: 24,
  },
  aiButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filterChip: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  filterChipActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  filterChipText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  serversList: {
    gap: 16,
  },
  serverCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  serverCardRecommended: {
    borderColor: '#8B5CF6',
    borderWidth: 2,
  },
  recommendedBadge: {
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  recommendedBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  serverCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  serverCardInfo: {
    flex: 1,
  },
  serverCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  serverCardSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  favoriteButton: {
    padding: 4,
  },
  favoriteIcon: {
    fontSize: 24,
  },
  metricsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  metricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadMeterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginLeft: 12,
  },
  loadMeterBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  loadMeterFill: {
    height: '100%',
    borderRadius: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  featureChip: {
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  featureChipText: {
    color: '#D1D5DB',
    fontSize: 12,
  },
  connectButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  connectButtonGradient: {
    padding: 14,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
});
