'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Server, Users, Activity, TrendingUp } from 'lucide-react';

interface StatsData {
  totalServers: number;
  activeConnections: number;
  totalUsers: number;
  dataTransferred: string;
}

interface StatsOverviewProps {
  data?: StatsData;
  loading?: boolean;
}

export function StatsOverview({ data, loading }: StatsOverviewProps) {
  const stats = data || {
    totalServers: 0,
    activeConnections: 0,
    totalUsers: 0,
    dataTransferred: '0 GB',
  };

  const cards = [
    {
      title: 'Total Servers',
      value: stats.totalServers,
      icon: Server,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Connections',
      value: stats.activeConnections,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Data Transferred',
      value: stats.dataTransferred,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">{card.title}</CardTitle>
              <div className={`rounded-lg p-2 ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
              ) : (
                <div className="text-2xl font-bold text-gray-900">{card.value}</div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
