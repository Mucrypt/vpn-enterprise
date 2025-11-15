"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { Shield, Lock, Zap, Globe, Users, BarChart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store';
import HydrationStatus from '@/components/debug/hydration-status';

export default function Home() {
  const { isAuthenticated, hasHydrated, isLoading } = useAuthStore();
  const router = useRouter();

  const handleDashboardClick = useCallback(() => {
    // If auth store not yet hydrated, ignore click
    if (!hasHydrated) return;
    // Route based on auth status
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/auth/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  const dashboardButtonDisabled = !hasHydrated || isLoading;

  // Immediate mount: ensure we never stay stuck in Loading due to missed persist callback
  useEffect(() => {
    const state = useAuthStore.getState();
    if (!state.hasHydrated) {
      state.setHydrated(true);
      state.setLoading(false);
      console.debug('[Home] Immediate mount hydration applied');
    } else if (state.isLoading) {
      // Safety: clear loading if already hydrated but flag remained
      state.setLoading(false);
    }
  }, []);

  // Removed fallback timeout; immediate mount effect now guarantees hydration.

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <HydrationStatus />
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <Shield className="h-20 w-20 text-blue-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            VPN Enterprise Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Enterprise-grade WireGuard VPN management with advanced security features, 
            real-time monitoring, and multi-server support.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              className="text-lg px-8"
              onClick={handleDashboardClick}
              disabled={dashboardButtonDisabled}
            >
              {dashboardButtonDisabled ? (
                <span className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Loading...</span>
              ) : isAuthenticated ? 'Go to Dashboard' : 'Sign In'}
            </Button>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Learn More
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <Lock className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>Enterprise Security</CardTitle>
              <CardDescription>
                Advanced security features including kill switch, 2FA, and comprehensive audit logging
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>High Performance</CardTitle>
              <CardDescription>
                WireGuard protocol with automatic load balancing across multiple servers
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Globe className="h-10 w-10 text-purple-600 mb-2" />
              <CardTitle>Multi-Server Support</CardTitle>
              <CardDescription>
                Manage multiple VPN servers with automatic failover and geographic distribution
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-orange-600 mb-2" />
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Complete user lifecycle management with role-based access control
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart className="h-10 w-10 text-red-600 mb-2" />
              <CardTitle>Real-time Analytics</CardTitle>
              <CardDescription>
                Live monitoring of connections, bandwidth usage, and server performance
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-indigo-600 mb-2" />
              <CardTitle>Split Tunneling</CardTitle>
              <CardDescription>
                Flexible routing with per-app and domain-based split tunneling
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Tech Stack Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Built with Modern Technologies</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div>
              <h3 className="font-semibold text-lg mb-2">Frontend</h3>
              <p className="text-gray-600">Next.js 16 + React 19</p>
              <p className="text-gray-600">Tailwind CSS 4</p>
              <p className="text-gray-600">TypeScript</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Backend</h3>
              <p className="text-gray-600">Node.js + Express</p>
              <p className="text-gray-600">Supabase</p>
              <p className="text-gray-600">PostgreSQL</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">VPN Core</h3>
              <p className="text-gray-600">WireGuard</p>
              <p className="text-gray-600">Load Balancing</p>
              <p className="text-gray-600">Auto-failover</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Security</h3>
              <p className="text-gray-600">2FA Support</p>
              <p className="text-gray-600">Kill Switch</p>
              <p className="text-gray-600">Audit Logging</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-blue-600 text-white rounded-lg p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Access your enterprise VPN dashboard and start managing your infrastructure
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="text-lg px-12"
            onClick={handleDashboardClick}
            disabled={dashboardButtonDisabled}
          >
            {dashboardButtonDisabled ? (
              <span className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Loading...</span>
            ) : isAuthenticated ? 'Open Dashboard' : 'Get Started'}
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-gray-600">
            VPN Enterprise Platform © 2025 | Built with Next.js, Supabase & WireGuard
          </p>
        </div>
      </footer>
    </div>
  );
}