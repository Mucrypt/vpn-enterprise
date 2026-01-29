"use client";

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Play, Pause, Shield, Lock, Zap, CheckCircle, AlertTriangle } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function VPNConnectionSimulator() {
  const containerRef = useRef<HTMLDivElement>(null);
  const tunnelRef = useRef<HTMLDivElement>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStep, setConnectionStep] = useState(0);

  const connectionSteps = [
    { label: "Initializing secure tunnel", icon: Shield, status: "pending" },
    { label: "Authenticating credentials", icon: Lock, status: "pending" },
    { label: "Encrypting data stream", icon: Zap, status: "pending" },
    { label: "Establishing connection", icon: CheckCircle, status: "pending" }
  ];

  const [steps, setSteps] = useState(connectionSteps);

  const simulateConnection = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    setIsConnected(false);
    setConnectionStep(0);
    
    // Reset all steps
    setSteps(connectionSteps.map(step => ({ ...step, status: "pending" })));

    // Animate tunnel activation
    if (tunnelRef.current) {
      gsap.to(tunnelRef.current, {
        opacity: 1,
        scale: 1.1,
        duration: 0.5,
        ease: "power2.out"
      });
    }

    // Process each step
    for (let i = 0; i < connectionSteps.length; i++) {
      setConnectionStep(i);
      
      // Update step status
      setSteps(prev => prev.map((step, index) => ({
        ...step,
        status: index === i ? "processing" : index < i ? "completed" : "pending"
      })));

      // Wait for step completion
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Mark step as completed
      setSteps(prev => prev.map((step, index) => ({
        ...step,
        status: index <= i ? "completed" : "pending"
      })));
    }

    setIsConnected(true);
    setIsConnecting(false);
    
    // Animate successful connection
    if (tunnelRef.current) {
      gsap.to(tunnelRef.current, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionStep(0);
    setSteps(connectionSteps.map(step => ({ ...step, status: "pending" })));
    
    if (tunnelRef.current) {
      gsap.to(tunnelRef.current, {
        opacity: 0.3,
        scale: 1,
        duration: 0.5,
        ease: "power2.out"
      });
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

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
  }, []);

  return (
    <div ref={containerRef} className="py-16 bg-linear-to-br from-white via-blue-50/30 to-cyan-50/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100/60 rounded-full border border-blue-200 mb-4">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="text-blue-700 font-medium text-sm">VPN Connection Demo</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            VPN Connection{' '}
            <span className="bg-linear-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Simulator
            </span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Experience how our enterprise VPN creates secure, encrypted tunnels. Watch the connection process in real-time.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-blue-200 p-8 shadow-2xl">
            
            {/* Connection visualization */}
            <div className="relative mb-8">
              <div className="flex items-center justify-between mb-8">
                {/* User device */}
                <div className="text-center">
                  <div className="w-20 h-20 bg-linear-to-br from-gray-100 to-gray-200 rounded-2xl border border-gray-300 flex items-center justify-center mb-3 shadow-lg">
                    <div className="w-12 h-8 bg-gray-800 rounded-sm flex items-center justify-center">
                      <div className="w-8 h-5 bg-blue-500 rounded-sm"></div>
                    </div>
                  </div>
                  <p className="text-gray-700 font-medium">Your Device</p>
                  <p className="text-gray-500 text-sm">Unprotected</p>
                </div>

                {/* VPN tunnel */}
                <div ref={tunnelRef} className="flex-1 mx-8 relative opacity-30">
                  <div className="relative">
                    {/* Tunnel visualization */}
                    <div className="h-16 bg-linear-to-r from-blue-200 via-blue-300 to-blue-200 rounded-full relative overflow-hidden border-2 border-blue-400">
                      {/* Animated data flow */}
                      <div className="absolute inset-0">
                        {Array.from({ length: 5 }, (_, i) => (
                          <div
                            key={i}
                            className={`absolute w-4 h-4 bg-blue-500 rounded-full animate-pulse ${
                              isConnected || isConnecting ? 'opacity-100' : 'opacity-0'
                            }`}
                            style={{
                              left: `${i * 20}%`,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              animationDelay: `${i * 0.2}s`
                            }}
                          />
                        ))}
                      </div>
                      
                      {/* Encryption indicators */}
                      <div className="absolute inset-0 flex items-center justify-center gap-2">
                        <Lock className="w-6 h-6 text-blue-700" />
                        <span className="text-blue-800 font-bold text-sm">AES-256</span>
                      </div>
                    </div>

                    {/* Security labels */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                      <div className="px-3 py-1 bg-blue-100 rounded-full border border-blue-300">
                        <span className="text-blue-700 text-xs font-medium">Encrypted Tunnel</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Server */}
                <div className="text-center">
                  <div className="w-20 h-20 bg-linear-to-br from-green-100 to-emerald-200 rounded-2xl border border-green-300 flex items-center justify-center mb-3 shadow-lg">
                    <Shield className="w-10 h-10 text-green-600" />
                  </div>
                  <p className="text-gray-700 font-medium">VPN Server</p>
                  <p className="text-green-600 text-sm">Secured</p>
                </div>
              </div>

              {/* Connection status */}
              <div className="text-center mb-6">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${
                  isConnected 
                    ? 'bg-green-100 border-green-300 text-green-700'
                    : isConnecting
                    ? 'bg-yellow-100 border-yellow-300 text-yellow-700'
                    : 'bg-gray-100 border-gray-300 text-gray-700'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : isConnecting ? 'bg-yellow-500 animate-pulse' : 'bg-gray-400'
                  }`}></div>
                  <span className="font-medium">
                    {isConnected ? 'Securely Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>

            {/* Connection steps */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Connection Process</h3>
              <div className="space-y-3">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-500 ${
                        step.status === 'completed'
                          ? 'bg-green-50 border-green-200'
                          : step.status === 'processing'
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        step.status === 'completed'
                          ? 'bg-green-100'
                          : step.status === 'processing'
                          ? 'bg-blue-100'
                          : 'bg-gray-100'
                      }`}>
                        {step.status === 'processing' ? (
                          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Icon className={`w-5 h-5 ${
                            step.status === 'completed'
                              ? 'text-green-600'
                              : step.status === 'processing'
                              ? 'text-blue-600'
                              : 'text-gray-500'
                          }`} />
                        )}
                      </div>
                      
                      <span className={`font-medium ${
                        step.status === 'completed'
                          ? 'text-green-800'
                          : step.status === 'processing'
                          ? 'text-blue-800'
                          : 'text-gray-600'
                      }`}>
                        {step.label}
                      </span>

                      {step.status === 'completed' && (
                        <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Control buttons */}
            <div className="flex justify-center gap-4">
              {!isConnected ? (
                <button
                  onClick={simulateConnection}
                  disabled={isConnecting}
                  className={`px-8 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                    isConnecting
                      ? 'bg-yellow-100 text-yellow-700 border border-yellow-300 cursor-not-allowed'
                      : 'bg-linear-to-r from-blue-500 to-cyan-600 text-white shadow-lg hover:shadow-xl hover:scale-105'
                  }`}
                  data-magnetic
                >
                  <Play className="w-5 h-5" />
                  {isConnecting ? 'Connecting...' : 'Start Connection'}
                </button>
              ) : (
                <button
                  onClick={disconnect}
                  className="px-8 py-3 bg-linear-to-r from-red-500 to-pink-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
                  data-magnetic
                >
                  <Pause className="w-5 h-5" />
                  Disconnect
                </button>
              )}
            </div>

            {/* Security features */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: Lock, label: "AES-256 Encryption", desc: "Military-grade security" },
                { icon: Shield, label: "Zero-Log Policy", desc: "Complete privacy protection" },
                { icon: Zap, label: "Lightning Fast", desc: "Optimized for speed" }
              ].map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="text-center p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-blue-200">
                    <div className="flex justify-center mb-2">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-800">{feature.label}</h4>
                    <p className="text-gray-600 text-sm">{feature.desc}</p>
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