import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuthStore } from '@/src/store';

type SubscriptionPlan = 'free' | 'basic' | 'premium' | 'enterprise';
type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'trial';

interface Subscription {
  id: string;
  plan_type: SubscriptionPlan;
  status: SubscriptionStatus;
  max_devices: number;
  data_limit_gb: number | null;
  bandwidth_limit_mbps: number | null;
  expires_at: string | null;
  auto_renew: boolean;
}

interface PlanDetails {
  name: string;
  price: string;
  period: string;
  features: string[];
  color: [string, string];
  icon: any;
}

const PLANS: Record<SubscriptionPlan, PlanDetails> = {
  free: {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['1 Device', '10 GB/month', 'Basic Servers', 'Standard Speed'],
    color: ['#6B7280', '#4B5563'],
    icon: 'gift.fill',
  },
  basic: {
    name: 'Basic',
    price: '$9.99',
    period: '/month',
    features: ['3 Devices', 'Unlimited Data', 'All Global Servers', 'High Speed'],
    color: ['#3B82F6', '#2563EB'],
    icon: 'star.fill',
  },
  premium: {
    name: 'Premium',
    price: '$15.99',
    period: '/month',
    features: [
      '5 Devices',
      'Unlimited Data',
      'Premium Servers',
      'P2P Support',
      'Streaming Optimized',
      'Priority Support',
    ],
    color: ['#8B5CF6', '#7C3AED'],
    icon: 'crown.fill',
  },
  enterprise: {
    name: 'Enterprise',
    price: '$49.99',
    period: '/month',
    features: [
      'Unlimited Devices',
      'Unlimited Data',
      'Dedicated Servers',
      'Custom Configuration',
      '24/7 Premium Support',
      'Advanced Security',
    ],
    color: ['#F59E0B', '#D97706'],
    icon: 'building.2.fill',
  },
};

export default function BillingScreen() {
  const { user } = useAuthStore();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    setIsLoading(true);
    try {
      // TODO: Fetch from Supabase user_subscriptions table
      // For now, using mock data
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const mockSubscription: Subscription = {
        id: '1',
        plan_type: 'free',
        status: 'active',
        max_devices: 1,
        data_limit_gb: 10,
        bandwidth_limit_mbps: 100,
        expires_at: null,
        auto_renew: false,
      };
      
      setSubscription(mockSubscription);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (plan === subscription?.plan_type) {
      return;
    }

    Alert.alert(
      `Upgrade to ${PLANS[plan].name}`,
      `${PLANS[plan].price}${PLANS[plan].period}\n\nFeatures:\n${PLANS[plan].features.join('\n')}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            // TODO: Integrate with Stripe/payment gateway
            // TODO: Update Supabase user_subscriptions table
            Alert.alert('Coming Soon', 'Payment integration will be available soon!');
          },
        },
      ]
    );
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will lose access to premium features.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            // TODO: Update Supabase to set cancel_at_period_end
            Alert.alert('Subscription Cancelled', 'Your subscription will end at the current period.');
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  const currentPlan = subscription?.plan_type || 'free';
  const currentPlanDetails = PLANS[currentPlan];

  return (
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Current Plan Card */}
        <View style={styles.currentPlanContainer}>
          <Text style={styles.sectionTitle}>Current Plan</Text>
          <LinearGradient colors={currentPlanDetails.color} style={styles.currentPlanCard}>
            <View style={styles.currentPlanHeader}>
              <IconSymbol name={currentPlanDetails.icon} size={32} color="#FFFFFF" />
              <View style={styles.currentPlanInfo}>
                <Text style={styles.currentPlanName}>{currentPlanDetails.name}</Text>
                <Text style={styles.currentPlanPrice}>
                  {currentPlanDetails.price}
                  <Text style={styles.currentPlanPeriod}>{currentPlanDetails.period}</Text>
                </Text>
              </View>
            </View>

            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {subscription?.status.toUpperCase() || 'ACTIVE'}
              </Text>
            </View>

            {subscription?.expires_at && (
              <Text style={styles.expiryText}>
                Renews on {new Date(subscription.expires_at).toLocaleDateString()}
              </Text>
            )}

            <View style={styles.usageStats}>
              <View style={styles.usageStat}>
                <IconSymbol name="iphone" size={20} color="#FFFFFF" />
                <Text style={styles.usageStatText}>
                  {subscription?.max_devices || 1} Devices
                </Text>
              </View>
              <View style={styles.usageStat}>
                <IconSymbol name="arrow.down.circle.fill" size={20} color="#FFFFFF" />
                <Text style={styles.usageStatText}>
                  {subscription?.data_limit_gb ? `${subscription.data_limit_gb} GB` : 'Unlimited'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Available Plans */}
        <View style={styles.plansContainer}>
          <Text style={styles.sectionTitle}>Available Plans</Text>
          
          {(Object.keys(PLANS) as SubscriptionPlan[]).map((planKey) => {
            const plan = PLANS[planKey];
            const isCurrent = planKey === currentPlan;

            return (
              <TouchableOpacity
                key={planKey}
                style={[styles.planCard, isCurrent && styles.planCardCurrent]}
                onPress={() => !isCurrent && handleUpgrade(planKey)}
                disabled={isCurrent}>
                <View style={styles.planHeader}>
                  <LinearGradient
                    colors={plan.color}
                    style={styles.planIcon}>
                    <IconSymbol name={plan.icon} size={24} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={styles.planInfo}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planPrice}>
                      {plan.price}
                      <Text style={styles.planPeriod}>{plan.period}</Text>
                    </Text>
                  </View>
                  {isCurrent && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>CURRENT</Text>
                    </View>
                  )}
                </View>

                <View style={styles.planFeatures}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <IconSymbol name="checkmark.circle.fill" size={16} color="#10B981" />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                {!isCurrent && (
                  <LinearGradient
                    colors={plan.color}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.upgradeButton}>
                    <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Cancel Subscription */}
        {currentPlan !== 'free' && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelSubscription}>
            <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  currentPlanContainer: {
    marginBottom: 32,
  },
  currentPlanCard: {
    padding: 20,
    borderRadius: 16,
  },
  currentPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentPlanInfo: {
    flex: 1,
    marginLeft: 16,
  },
  currentPlanName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  currentPlanPrice: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
  },
  currentPlanPeriod: {
    fontSize: 14,
    fontWeight: '400',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  expiryText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 16,
  },
  usageStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  usageStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usageStatText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  plansContainer: {
    marginBottom: 32,
  },
  planCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardCurrent: {
    borderColor: '#10B981',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planInfo: {
    flex: 1,
    marginLeft: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 4,
  },
  planPeriod: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
  },
  currentBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  planFeatures: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    color: '#D1D5DB',
    fontSize: 14,
    marginLeft: 8,
  },
  upgradeButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
