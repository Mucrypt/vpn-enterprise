'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Zap, Globe, Lock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'disconnecting' | 'error';

interface Server {
  id: string;
  name: string;
  country: string;
  country_code: string;
  city: string;
  load: number;
  is_active: boolean;
}

export default function ConnectPage() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionTime, setConnectionTime] = useState(0);
  const [stats, setStats] = useState({
    uploadSpeed: 0,
    downloadSpeed: 0,
    latency: 0,
  });

  useEffect(() => {
    loadServers();
  }, []);

  // Connection timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'connected') {
      interval = setInterval(() => {
        setConnectionTime((prev) => prev + 1);
        // Simulate speed metrics (in real app, this comes from VPN client)
        setStats({
          uploadSpeed: Math.random() * 10 + 5,
          downloadSpeed: Math.random() * 50 + 20,
          latency: Math.random() * 20 + 10,
        });
      }, 1000);
    } else {
      setConnectionTime(0);
    }
    return () => clearInterval(interval);
  }, [status]);

  async function loadServers() {
    try {
      const data = await api.getServers();
      const activeServers = (data.servers || []).filter((s: Server) => s.is_active);
      setServers(activeServers);
      // Auto-select best server (lowest load)
      if (activeServers.length > 0) {
        const bestServer = activeServers.reduce((best: Server, current: Server) => 
          current.load < best.load ? current : best
        );
        setSelectedServer(bestServer);
      }
    } catch (error) {
      console.error('Failed to load servers:', error);
      toast.error('Failed to load servers');
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    if (!selectedServer) {
      toast.error('Please select a server first');
      return;
    }

    setStatus('connecting');
    
    try {
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setStatus('connected');
      toast.success(`Connected to ${selectedServer.name}`);
      
      // In a real app, you would:
      // 1. Request VPN configuration from API
      // 2. Initialize WireGuard connection
      // 3. Track connection status
    } catch (error) {
      setStatus('error');
      toast.error('Connection failed');
      console.error('Connection error:', error);
    }
  }

  async function handleDisconnect() {
    setStatus('disconnecting');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStatus('disconnected');
      toast.success('Disconnected from VPN');
    } catch (error) {
      setStatus('error');
      toast.error('Disconnection failed');
    }
  }

  function formatTime(seconds: number) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function getStatusColor() {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50 border-green-200';
      case 'connecting': case 'disconnecting': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }

  function getStatusIcon() {
    switch (status) {
      case 'connected': return <CheckCircle className="h-5 w-5" />;
      case 'connecting': case 'disconnecting': return <Loader2 className="h-5 w-5 animate-spin" />;
      case 'error': return <XCircle className="h-5 w-5" />;
      default: return <Shield className="h-5 w-5" />;
    }
  }

  function getStatusText() {
    switch (status) {
      case 'connected': return 'Protected';
      case 'connecting': return 'Connecting...';
      case 'disconnecting': return 'Disconnecting...';
      case 'error': return 'Connection Error';
      default: return 'Not Protected';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">VPN Connection</h1>
        <p className="text-gray-600 mt-1">Connect to secure VPN servers worldwide</p>
      </div>

      {/* Status Banner */}
      <Card className={`border-2 ${getStatusColor()}`}>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getStatusIcon()}
              <div>
                <h3 className="text-lg font-semibold">{getStatusText()}</h3>
                {status === 'connected' && selectedServer && (
                  <p className="text-sm">Connected to {selectedServer.name}</p>
                )}
              </div>
            </div>
            {status === 'connected' && (
              <div className="text-right">
                <p className="text-sm font-medium">Duration</p>
                <p className="text-2xl font-mono font-bold">{formatTime(connectionTime)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection Control */}
        <div className="lg:col-span-2 space-y-6">
          {/* Server Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Select Server
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {servers.map((server) => (
                  <button
                    key={server.id}
                    onClick={() => setSelectedServer(server)}
                    disabled={status === 'connected' || status === 'connecting'}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedServer?.id === server.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{server.name}</h4>
                      <span className="text-2xl">{server.country_code === 'US' ? '🇺🇸' : server.country_code === 'UK' ? '🇬🇧' : server.country_code === 'DE' ? '🇩🇪' : server.country_code === 'JP' ? '🇯🇵' : '🌐'}</span>
                    </div>
                    <p className="text-sm text-gray-600">{server.city}, {server.country}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            server.load < 30 ? 'bg-green-500' :
                            server.load < 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${server.load}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{server.load}%</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Connect Button */}
              <div className="pt-4">
                {status === 'connected' || status === 'disconnecting' ? (
                  <Button
                    onClick={handleDisconnect}
                    variant="destructive"
                    className="w-full h-12 text-lg"
                    disabled={status === 'disconnecting'}
                  >
                    {status === 'disconnecting' ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Disconnecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 mr-2" />
                        Disconnect
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleConnect}
                    className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                    disabled={!selectedServer || status === 'connecting'}
                  >
                    {status === 'connecting' ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Shield className="h-5 w-5 mr-2" />
                        Connect to VPN
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Connection Stats */}
        <div className="space-y-6">
          {status === 'connected' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Connection Speed
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Download</span>
                      <span className="text-sm font-mono font-semibold text-green-600">
                        ↓ {stats.downloadSpeed.toFixed(1)} Mbps
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${Math.min(stats.downloadSpeed * 1.5, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Upload</span>
                      <span className="text-sm font-mono font-semibold text-blue-600">
                        ↑ {stats.uploadSpeed.toFixed(1)} Mbps
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${Math.min(stats.uploadSpeed * 8, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Latency</span>
                      <span className="text-sm font-mono font-semibold text-yellow-600">
                        {stats.latency.toFixed(0)} ms
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Security Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-gray-700">Kill Switch Active</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-gray-700">DNS Leak Protection</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-gray-700">AES-256 Encryption</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-gray-700">IPv6 Leak Protection</span>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {status === 'disconnected' && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="py-6">
                <Shield className="h-12 w-12 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Stay Protected</h3>
                <p className="text-sm text-gray-700">
                  Connect to a VPN server to encrypt your traffic and protect your privacy online.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
