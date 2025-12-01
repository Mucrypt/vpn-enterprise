"use client";

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Globe, Wifi, Shield, MapPin, Zap, Users } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface ServerLocation {
  id: string;
  city: string;
  country: string;
  x: number;
  y: number;
  status: 'online' | 'high-load' | 'maintenance';
  connections: number;
  ping: number;
}

export default function InteractiveNetworkMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedServer, setSelectedServer] = useState<ServerLocation | null>(null);
  
  const servers: ServerLocation[] = [
    { id: '1', city: 'New York', country: 'USA', x: 25, y: 35, status: 'online', connections: 2847, ping: 12 },
    { id: '2', city: 'London', country: 'UK', x: 50, y: 25, status: 'online', connections: 1923, ping: 8 },
    { id: '3', city: 'Tokyo', country: 'Japan', x: 85, y: 40, status: 'high-load', connections: 3421, ping: 23 },
    { id: '4', city: 'Singapore', country: 'Singapore', x: 80, y: 55, status: 'online', connections: 1654, ping: 15 },
    { id: '5', city: 'Frankfurt', country: 'Germany', x: 52, y: 28, status: 'online', connections: 2156, ping: 7 },
    { id: '6', city: 'Sydney', country: 'Australia', x: 88, y: 75, status: 'online', connections: 987, ping: 34 },
    { id: '7', city: 'São Paulo', country: 'Brazil', x: 35, y: 65, status: 'maintenance', connections: 0, ping: 0 },
    { id: '8', city: 'Mumbai', country: 'India', x: 72, y: 48, status: 'online', connections: 2341, ping: 18 },
    { id: '9', city: 'Toronto', country: 'Canada', x: 22, y: 30, status: 'online', connections: 1542, ping: 14 },
    { id: '10', city: 'Moscow', country: 'Russia', x: 60, y: 22, status: 'online', connections: 1876, ping: 21 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-400 border-green-500';
      case 'high-load': return 'bg-yellow-400 border-yellow-500';
      case 'maintenance': return 'bg-red-400 border-red-500';
      default: return 'bg-gray-400 border-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'high-load': return 'High Load';
      case 'maintenance': return 'Maintenance';
      default: return 'Unknown';
    }
  };

  useEffect(() => {
    if (!containerRef.current || !mapRef.current) return;

    // Animate container entrance
    gsap.fromTo(containerRef.current, {
      opacity: 0,
      y: 50
    }, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 80%",
        toggleActions: "play none none reverse"
      }
    });

    // Animate server dots
    const serverDots = mapRef.current.querySelectorAll('.server-dot');
    gsap.fromTo(serverDots, {
      scale: 0,
      opacity: 0
    }, {
      scale: 1,
      opacity: 1,
      duration: 0.8,
      ease: "back.out(2)",
      stagger: 0.1,
      delay: 0.5,
      scrollTrigger: {
        trigger: mapRef.current,
        start: "top 80%",
        toggleActions: "play none none reverse"
      }
    });

    // Animate connection lines
    const connectionLines = mapRef.current.querySelectorAll('.connection-line');
    gsap.fromTo(connectionLines, {
      strokeDasharray: "0 1000",
      opacity: 0
    }, {
      strokeDasharray: "1000 0",
      opacity: 0.3,
      duration: 2,
      ease: "none",
      stagger: 0.2,
      delay: 1,
      scrollTrigger: {
        trigger: mapRef.current,
        start: "top 80%",
        toggleActions: "play none none reverse"
      }
    });

    // Pulse animation for online servers
    gsap.to(".server-pulse", {
      scale: 1.5,
      opacity: 0,
      duration: 2,
      ease: "power2.out",
      repeat: -1,
      stagger: 0.3
    });

  }, []);

  return (
    <div ref={containerRef} className="py-16 bg-gradient-to-br from-white via-emerald-50/30 to-green-50/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100/60 rounded-full border border-blue-200 mb-4">
            <Globe className="w-4 h-4 text-blue-600" />
            <span className="text-blue-700 font-medium text-sm">Global Network</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Interactive{' '}
            <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              Network Map
            </span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Explore our global server network. Click on any server to see real-time performance metrics and connection details.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-emerald-200 p-8 shadow-2xl">
            {/* World Map */}
            <div ref={mapRef} className="relative w-full h-96 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-2xl border border-blue-200 overflow-hidden">
              {/* Decorative grid */}
              <div className="absolute inset-0 opacity-10">
                <div className="grid grid-cols-12 h-full">
                  {Array.from({ length: 48 }, (_, i) => (
                    <div key={i} className="border-r border-emerald-400"></div>
                  ))}
                </div>
                <div className="absolute inset-0 grid grid-rows-8">
                  {Array.from({ length: 8 }, (_, i) => (
                    <div key={i} className="border-b border-emerald-400"></div>
                  ))}
                </div>
              </div>

              {/* Connection lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {servers.filter(s => s.status === 'online').map((server, index) => 
                  servers.filter(s => s.status === 'online' && s.id !== server.id).slice(0, 2).map((targetServer, targetIndex) => (
                    <line
                      key={`${server.id}-${targetServer.id}`}
                      className="connection-line"
                      x1={`${server.x}%`}
                      y1={`${server.y}%`}
                      x2={`${targetServer.x}%`}
                      y2={`${targetServer.y}%`}
                      stroke="url(#connectionGradient)"
                      strokeWidth="1"
                      opacity="0.3"
                    />
                  ))
                )}
                <defs>
                  <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Server locations */}
              {servers.map((server) => (
                <div
                  key={server.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{ left: `${server.x}%`, top: `${server.y}%` }}
                  onClick={() => setSelectedServer(server)}
                >
                  {/* Pulse effect for online servers */}
                  {server.status === 'online' && (
                    <div className={`server-pulse absolute inset-0 w-6 h-6 ${getStatusColor(server.status)} rounded-full`}></div>
                  )}
                  
                  {/* Main server dot */}
                  <div className={`server-dot relative w-4 h-4 ${getStatusColor(server.status)} rounded-full border-2 group-hover:scale-150 transition-all duration-300 shadow-lg`}>
                    {/* Inner glow */}
                    <div className="absolute inset-0.5 bg-white rounded-full opacity-60"></div>
                  </div>

                  {/* Server info tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                    <div className="bg-white/95 backdrop-blur-sm rounded-lg border border-emerald-200 px-3 py-2 shadow-xl min-w-32">
                      <div className="text-center">
                        <div className="font-semibold text-gray-800 text-sm">{server.city}</div>
                        <div className="text-gray-600 text-xs">{server.country}</div>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <div className={`w-2 h-2 ${getStatusColor(server.status)} rounded-full`}></div>
                          <span className="text-xs text-gray-600">{getStatusText(server.status)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Server details panel */}
            {selectedServer && (
              <div className="mt-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                      {selectedServer.city}, {selectedServer.country}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <div className={`w-3 h-3 ${getStatusColor(selectedServer.status)} rounded-full`}></div>
                      <span className="text-gray-600 font-medium">{getStatusText(selectedServer.status)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedServer(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/60 rounded-lg border border-emerald-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span className="text-gray-600 text-sm font-medium">Active Connections</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                      {selectedServer.connections.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-white/60 rounded-lg border border-emerald-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-yellow-600" />
                      <span className="text-gray-600 text-sm font-medium">Ping Time</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                      {selectedServer.ping}ms
                    </div>
                  </div>

                  <div className="bg-white/60 rounded-lg border border-emerald-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-600 text-sm font-medium">Load Status</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                      {selectedServer.status === 'online' ? 'Low' : 
                       selectedServer.status === 'high-load' ? 'High' : 'N/A'}
                    </div>
                  </div>
                </div>

                {selectedServer.status === 'online' && (
                  <div className="mt-4 flex justify-center">
                    <button className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium">
                      Connect to {selectedServer.city}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Network statistics */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { icon: Globe, label: "Global Servers", value: servers.length, color: "text-blue-600" },
                { icon: Shield, label: "Online Servers", value: servers.filter(s => s.status === 'online').length, color: "text-green-600" },
                { icon: Wifi, label: "Total Connections", value: servers.reduce((sum, s) => sum + s.connections, 0).toLocaleString(), color: "text-purple-600" },
                { icon: Zap, label: "Avg Response", value: Math.round(servers.filter(s => s.status === 'online').reduce((sum, s) => sum + s.ping, 0) / servers.filter(s => s.status === 'online').length) + "ms", color: "text-yellow-600" }
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-white/40 backdrop-blur-sm rounded-xl border border-emerald-200 p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div className="text-xl font-bold text-gray-800">{stat.value}</div>
                    <div className="text-gray-600 text-sm">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}