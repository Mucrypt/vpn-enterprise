/**
 * AI-Powered Server Recommendation Engine
 * Machine learning-based server selection beyond NordVPN
 */

import { Server, AIRecommendation } from '@/src/types/vpn';
import { useServersStore, usePreferencesStore } from '@/src/store';
import { api } from '@/src/services/api/VPNEnterpriseAPI';

interface UserBehaviorPattern {
  preferredTimes: number[]; // Hours of day (0-23)
  preferredCountries: Map<string, number>; // Country -> usage count
  averageSessionDuration: number;
  dataUsagePattern: 'streaming' | 'browsing' | 'gaming' | 'torrenting' | 'mixed';
}

class ServerRecommendationEngine {
  private userBehavior: UserBehaviorPattern = {
    preferredTimes: [],
    preferredCountries: new Map(),
    averageSessionDuration: 0,
    dataUsagePattern: 'mixed',
  };

  /**
   * Get AI-recommended server based on user habits and current context
   */
  async getRecommendedServer(purpose?: 'streaming' | 'p2p' | 'gaming' | 'general'): Promise<Server | null> {
    try {
      const servers = await api.getServers();
      if (servers.length === 0) return null;

      const recommendations = servers.map(server => ({
        server,
        score: this.calculateRecommendationScore(server, purpose),
      }));

      recommendations.sort((a, b) => b.score - a.score);
      return recommendations[0].server;
    } catch (error) {
      // Silently fail when API is unavailable (expected during development with mock data)
      // Only log in development mode
      if (__DEV__ && error instanceof Error && !error.message.includes('Network Error')) {
        console.warn('Server recommendation unavailable:', error.message);
      }
      return null;
    }
  }

  /**
   * Calculate recommendation score (0-100) for a server
   */
  private calculateRecommendationScore(server: Server, purpose?: string): number {
    let score = 50; // Base score

    // Factor 1: Server load (lower is better) - Weight: 30%
    const loadPenalty = (server.load / 100) * 30;
    score -= loadPenalty;

    // Factor 2: Latency (lower is better) - Weight: 25%
    if (server.ping !== null) {
      const latencyPenalty = Math.min((server.ping / 200) * 25, 25);
      score -= latencyPenalty;
    }

    // Factor 3: User preferences - Weight: 20%
    const { preferences } = usePreferencesStore.getState();
    if (preferences.preferredCountries.includes(server.country)) {
      score += 20;
    }

    // Factor 4: Historical usage - Weight: 15%
    const usageCount = this.userBehavior.preferredCountries.get(server.country) || 0;
    const usageBonus = Math.min((usageCount / 10) * 15, 15);
    score += usageBonus;

    // Factor 5: Purpose-specific features - Weight: 10%
    if (purpose) {
      const purposeBonus = this.getPurposeBonus(server, purpose);
      score += purposeBonus;
    }

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Get bonus score based on specific purpose
   */
  private getPurposeBonus(server: Server, purpose: string): number {
    switch (purpose) {
      case 'streaming':
        return server.features.includes('streaming') ? 10 : 0;
      case 'torrenting':
        return server.features.includes('p2p') ? 10 : 0;
      case 'privacy':
        return server.features.includes('double-vpn') || server.features.includes('tor-over-vpn') ? 10 : 0;
      case 'gaming':
        // Prefer low-latency servers
        return server.ping !== null && server.ping < 30 ? 10 : 0;
      default:
        return 0;
    }
  }

  /**
   * Learn from user connection patterns
   */
  learnFromConnection(server: Server, duration: number) {
    // Update country preferences
    const currentCount = this.userBehavior.preferredCountries.get(server.country) || 0;
    this.userBehavior.preferredCountries.set(server.country, currentCount + 1);

    // Update time preferences
    const hour = new Date().getHours();
    if (!this.userBehavior.preferredTimes.includes(hour)) {
      this.userBehavior.preferredTimes.push(hour);
    }

    // Update average session duration
    const sessions = Array.from(this.userBehavior.preferredCountries.values()).reduce((a, b) => a + b, 0);
    this.userBehavior.averageSessionDuration = 
      (this.userBehavior.averageSessionDuration * (sessions - 1) + duration) / sessions;
  }

  /**
   * Get multiple server recommendations with reasons
   */
  async getTopRecommendations(count: number = 3): Promise<AIRecommendation[]> {
    try {
      const servers = await api.getServers();
      const availableServers = servers.filter(s => s.status === 'online');

      const recommendations: AIRecommendation[] = availableServers.map(server => {
        const score = this.calculateRecommendationScore(server);
        const reason = this.determineRecommendationReason(server);
        
        return {
          serverId: server.id,
          score,
          reason,
          confidence: this.calculateConfidence(score),
        };
      });

      // Sort and return top N
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, count);
    } catch (error) {
      // Silently return empty array when API is unavailable
      // App will use fallback recommendation logic
      if (__DEV__ && error instanceof Error && !error.message.includes('Network Error')) {
        console.warn('Recommendations unavailable:', error.message);
      }
      return [];
    }
  }

  /**
   * Determine the primary reason for recommending a server
   */
  private determineRecommendationReason(server: Server): AIRecommendation['reason'] {
    if (server.ping !== null && server.ping < 20) return 'low-latency';
    if (server.load < 30) return 'high-bandwidth';
    if (server.features.includes('streaming')) return 'streaming';
    
    const { preferences } = usePreferencesStore.getState();
    if (preferences.preferredCountries.includes(server.country)) return 'location';
    
    const usageCount = this.userBehavior.preferredCountries.get(server.country) || 0;
    if (usageCount > 5) return 'habit';

    return 'security';
  }

  /**
   * Calculate confidence level based on score
   */
  private calculateConfidence(score: number): number {
    // Higher scores get higher confidence
    return Math.min(score + 20, 100);
  }

  /**
   * Predict optimal connection time based on patterns
   */
  predictOptimalTime(): number {
    if (this.userBehavior.preferredTimes.length === 0) {
      return new Date().getHours();
    }

    // Return most common connection hour
    const timeCounts = new Map<number, number>();
    this.userBehavior.preferredTimes.forEach(hour => {
      timeCounts.set(hour, (timeCounts.get(hour) || 0) + 1);
    });

    let maxCount = 0;
    let optimalHour = new Date().getHours();

    timeCounts.forEach((count, hour) => {
      if (count > maxCount) {
        maxCount = count;
        optimalHour = hour;
      }
    });

    return optimalHour;
  }
}

// Export singleton instance
export const serverRecommender = new ServerRecommendationEngine();
export default serverRecommender;
