'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Users, Zap } from 'lucide-react';

interface ConnectionMapProps {
  connections?: any[];
}

export function ConnectionMap({ connections = [] }: ConnectionMapProps) {
  // Mock server locations
  const servers = [
    { id: 1, name: 'US East', country: 'United States', city: 'New York', lat: 40.7128, lng: -74.0060, active: 45, total: 100 },
    { id: 2, name: 'US West', country: 'United States', city: 'Los Angeles', lat: 34.0522, lng: -118.2437, active: 32, total: 100 },
    { id: 3, name: 'EU Central', country: 'Germany', city: 'Frankfurt', lat: 50.1109, lng: 8.6821, active: 28, total: 80 },
    { id: 4, name: 'UK', country: 'United Kingdom', city: 'London', lat: 51.5074, lng: -0.1278, active: 19, total: 60 },
    { id: 5, name: 'Asia Pacific', country: 'Singapore', city: 'Singapore', lat: 1.3521, lng: 103.8198, active: 41, total: 100 },
    { id: 6, name: 'Japan', country: 'Japan', city: 'Tokyo', lat: 35.6762, lng: 139.6503, active: 25, total: 80 },
    { id: 7, name: 'Australia', country: 'Australia', city: 'Sydney', lat: -33.8688, lng: 151.2093, active: 15, total: 50 },
    { id: 8, name: 'Brazil', country: 'Brazil', city: 'São Paulo', lat: -23.5505, lng: -46.6333, active: 12, total: 50 },
  ];

  // Convert lat/lng to SVG coordinates (simplified projection)
  const project = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 800;
    const y = ((90 - lat) / 180) * 400;
    return { x, y };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          Global Connection Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* SVG World Map */}
        <div className="relative w-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-gray-200 overflow-hidden">
          <svg
            viewBox="0 0 800 400"
            className="w-full h-auto"
            style={{ minHeight: '400px' }}
          >
            {/* World map continents (simplified) */}
            <g className="fill-gray-300 opacity-40">
              {/* North America */}
              <path d="M 150,80 L 180,70 L 220,75 L 240,90 L 230,120 L 200,140 L 170,135 L 150,110 Z" />
              {/* Europe */}
              <path d="M 380,90 L 420,85 L 440,95 L 435,115 L 410,120 L 385,110 Z" />
              {/* Asia */}
              <path d="M 500,80 L 600,70 L 650,90 L 640,140 L 580,160 L 520,140 L 500,110 Z" />
              {/* Africa */}
              <path d="M 380,150 L 420,145 L 450,170 L 440,220 L 400,240 L 370,220 L 375,175 Z" />
              {/* South America */}
              <path d="M 230,200 L 260,190 L 280,210 L 275,260 L 250,280 L 230,260 L 225,230 Z" />
              {/* Australia */}
              <path d="M 620,260 L 670,255 L 690,270 L 680,295 L 640,300 L 615,285 Z" />
            </g>

            {/* Server locations with pulsing effect */}
            {servers.map((server) => {
              const pos = project(server.lat, server.lng);
              const load = (server.active / server.total) * 100;
              const color = load > 75 ? '#ef4444' : load > 50 ? '#f59e0b' : '#10b981';
              
              return (
                <g key={server.id}>
                  {/* Pulsing circle animation */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="8"
                    fill={color}
                    opacity="0.3"
                  >
                    <animate
                      attributeName="r"
                      from="8"
                      to="20"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.5"
                      to="0"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  
                  {/* Main server dot */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="6"
                    fill={color}
                    stroke="white"
                    strokeWidth="2"
                  />
                  
                  {/* Connection lines (to central hub) */}
                  <line
                    x1={pos.x}
                    y1={pos.y}
                    x2="400"
                    y2="200"
                    stroke={color}
                    strokeWidth="1"
                    opacity="0.2"
                    strokeDasharray="5,5"
                  />
                </g>
              );
            })}

            {/* Central hub */}
            <circle cx="400" cy="200" r="10" fill="#3b82f6" stroke="white" strokeWidth="3" />
            <circle cx="400" cy="200" r="15" fill="#3b82f6" opacity="0.3">
              <animate
                attributeName="r"
                from="15"
                to="25"
                dur="1.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                from="0.3"
                to="0"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        </div>

        {/* Server Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {servers.map((server) => {
            const load = (server.active / server.total) * 100;
            const color = load > 75 ? 'bg-red-500' : load > 50 ? 'bg-orange-500' : 'bg-green-500';
            
            return (
              <div key={server.id} className="bg-white border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-3 w-3 rounded-full ${color}`} />
                  <span className="font-medium text-sm text-gray-900">{server.name}</span>
                </div>
                <div className="text-xs text-gray-500 mb-1">{server.city}</div>
                <div className="flex items-center gap-1 text-xs text-gray-700">
                  <Users className="h-3 w-3" />
                  <span>{server.active}/{server.total}</span>
                  <span className="ml-auto">{load.toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Connections Summary */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Total Active</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {servers.reduce((sum, s) => sum + s.active, 0)}
            </p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">Locations</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{servers.length}</p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Capacity</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {servers.reduce((sum, s) => sum + s.total, 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
