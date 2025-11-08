'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { getServerLoadColor, getServerLoadBgColor } from '@/lib/utils';

interface Server {
  id: string;
  name: string;
  country: string;
  load: number;
  is_active: boolean;
  current_clients: number;
  max_clients: number;
}

interface ServerStatusGridProps {
  servers: Server[];
  loading?: boolean;
}

export function ServerStatusGrid({ servers, loading }: ServerStatusGridProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Server Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900">Server Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {servers.map((server) => (
            <div
              key={server.id}
              className="rounded-lg border p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">{server.name}</h4>
                  <p className="text-sm text-gray-500">{server.country}</p>
                </div>
                <div
                  className={`h-3 w-3 rounded-full ${
                    server.is_active ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Load</span>
                  <span className={getServerLoadColor(server.load)}>
                    {server.load}%
                  </span>
                </div>
                
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full ${getServerLoadBgColor(server.load)}`}
                    style={{ width: `${server.load}%` }}
                  />
                </div>

                <div className="flex justify-between text-sm text-gray-500">
                  <span>Clients</span>
                  <span>{server.current_clients} / {server.max_clients}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
