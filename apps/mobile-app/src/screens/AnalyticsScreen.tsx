import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useStatsStore, useVPNStore } from '@/src/store';
import type { Achievement, UserStats } from '@/src/types/vpn';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const { stats } = useStatsStore();
  const { connection } = useVPNStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week');

  // Mock achievements
  const achievements: Achievement[] = [
    {
      id: '1',
      name: 'First Connection',
      description: 'Connect to VPN for the first time',
      icon: '🎯',
      unlockedAt: new Date(),
      progress: 100,
      maxProgress: 100,
    },
    {
      id: '2',
      name: 'Speed Demon',
      description: 'Achieve 100 Mbps download speed',
      icon: '⚡',
      unlockedAt: new Date(),
      progress: 100,
      maxProgress: 100,
    },
    {
      id: '3',
      name: 'World Traveler',
      description: 'Connect to servers in 5 different countries',
      icon: '🌍',
      progress: 3,
      maxProgress: 5,
    },
    {
      id: '4',
      name: 'Marathon Runner',
      description: 'Stay connected for 24 hours straight',
      icon: '🏃',
      progress: 8,
      maxProgress: 24,
    },
    {
      id: '5',
      name: 'Privacy Guardian',
      description: 'Block 1000 trackers',
      icon: '🛡️',
      progress: 234,
      maxProgress: 1000,
    },
    {
      id: '6',
      name: 'Data Saver',
      description: 'Save 10GB with compression',
      icon: '💾',
      progress: 0,
      maxProgress: 10,
    },
  ];

  const handlePeriodChange = (period: 'day' | 'week' | 'month') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPeriod(period);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const calculateLevel = (totalData: number): number => {
    // Level up every 10GB
    return Math.floor(totalData / (10 * 1024 * 1024 * 1024)) + 1;
  };

  const calculateLevelProgress = (totalData: number): number => {
    const levelSize = 10 * 1024 * 1024 * 1024; // 10GB
    return ((totalData % levelSize) / levelSize) * 100;
  };

  const totalData = stats.totalDataUsed;
  const currentLevel = calculateLevel(totalData);
  const levelProgress = calculateLevelProgress(totalData);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Level Card */}
      <LinearGradient
        colors={['#6366F1', '#8B5CF6']}
        style={styles.levelCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.levelHeader}>
          <Text style={styles.levelTitle}>Your Level</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelNumber}>{currentLevel}</Text>
          </View>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${levelProgress}%` }]} />
          </View>
          <Text style={styles.progressText}>{levelProgress.toFixed(0)}% to Level {currentLevel + 1}</Text>
        </View>
      </LinearGradient>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[styles.periodButton, selectedPeriod === 'day' && styles.periodButtonActive]}
          onPress={() => handlePeriodChange('day')}
        >
          <Text style={[styles.periodButtonText, selectedPeriod === 'day' && styles.periodButtonTextActive]}>
            Day
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
          onPress={() => handlePeriodChange('week')}
        >
          <Text style={[styles.periodButtonText, selectedPeriod === 'week' && styles.periodButtonTextActive]}>
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
          onPress={() => handlePeriodChange('month')}
        >
          <Text style={[styles.periodButtonText, selectedPeriod === 'month' && styles.periodButtonTextActive]}>
            Month
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Usage Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⬆️</Text>
            <Text style={styles.statValue}>{formatBytes(stats.dataUploaded)}</Text>
            <Text style={styles.statLabel}>Uploaded</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⬇️</Text>
            <Text style={styles.statValue}>{formatBytes(stats.dataDownloaded)}</Text>
            <Text style={styles.statLabel}>Downloaded</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🕐</Text>
            <Text style={styles.statValue}>{formatDuration(stats.totalConnectionTime)}</Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🔌</Text>
            <Text style={styles.statValue}>{stats.totalConnections}</Text>
            <Text style={styles.statLabel}>Connections</Text>
          </View>
        </View>
      </View>

      {/* Performance Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Performance</Text>
        <View style={styles.metricsCard}>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Average Speed</Text>
            <Text style={styles.metricValue}>
              {stats.averageSpeed.toFixed(1)} Mbps
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Peak Speed</Text>
            <Text style={styles.metricValue}>
              {stats.peakSpeed.toFixed(1)} Mbps
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Average Latency</Text>
            <Text style={styles.metricValue}>
              {stats.averageLatency.toFixed(0)} ms
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Data Saved</Text>
            <Text style={styles.metricValue}>
              {formatBytes(stats.dataSaved)}
            </Text>
          </View>
        </View>
      </View>

      {/* Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 Achievements</Text>
        <View style={styles.achievementsGrid}>
          {achievements.map((achievement) => (
            <View
              key={achievement.id}
              style={[
                styles.achievementCard,
                achievement.unlockedAt && styles.achievementCardUnlocked,
              ]}
            >
              <Text style={styles.achievementIcon}>{achievement.icon}</Text>
              <Text style={styles.achievementName}>{achievement.name}</Text>
              <Text style={styles.achievementDescription} numberOfLines={2}>
                {achievement.description}
              </Text>
              {!achievement.unlockedAt && (
                <View style={styles.achievementProgress}>
                  <View style={styles.achievementProgressBar}>
                    <View
                      style={[
                        styles.achievementProgressFill,
                        {
                          width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.achievementProgressText}>
                    {achievement.progress}/{achievement.maxProgress}
                  </Text>
                </View>
              )}
              {achievement.unlockedAt && (
                <View style={styles.unlockedBadge}>
                  <Text style={styles.unlockedText}>✓ Unlocked</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Connection History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Recent Activity</Text>
        <View style={styles.historyCard}>
          <View style={styles.historyItem}>
            <View style={styles.historyDot} />
            <View style={styles.historyContent}>
              <Text style={styles.historyServer}>New York, USA</Text>
              <Text style={styles.historyTime}>2 hours ago • 1h 23m</Text>
              <Text style={styles.historyData}>1.2 GB transferred</Text>
            </View>
          </View>
          <View style={styles.historyItem}>
            <View style={styles.historyDot} />
            <View style={styles.historyContent}>
              <Text style={styles.historyServer}>London, UK</Text>
              <Text style={styles.historyTime}>5 hours ago • 45m</Text>
              <Text style={styles.historyData}>450 MB transferred</Text>
            </View>
          </View>
          <View style={styles.historyItem}>
            <View style={styles.historyDot} />
            <View style={styles.historyContent}>
              <Text style={styles.historyServer}>Tokyo, Japan</Text>
              <Text style={styles.historyTime}>1 day ago • 2h 15m</Text>
              <Text style={styles.historyData}>2.8 GB transferred</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  levelCard: {
    margin: 16,
    marginTop: 60,
    padding: 24,
    borderRadius: 20,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  levelBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressBarContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  periodButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  metricsCard: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  metricLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    width: (width - 44) / 2,
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    opacity: 0.6,
  },
  achievementCardUnlocked: {
    opacity: 1,
    borderColor: '#10B981',
  },
  achievementIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  achievementProgress: {
    gap: 4,
  },
  achievementProgressBar: {
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    overflow: 'hidden',
  },
  achievementProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  achievementProgressText: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'right',
  },
  unlockedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  unlockedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  historyCard: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  historyItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginTop: 6,
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyServer: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  historyTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  historyData: {
    fontSize: 12,
    color: '#10B981',
  },
  bottomPadding: {
    height: 32,
  },
});
