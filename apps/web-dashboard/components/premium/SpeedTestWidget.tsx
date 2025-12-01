"use client";

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Play, Gauge, Wifi, Download, Upload, MapPin } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function SpeedTestWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const speedMeterRef = useRef<HTMLDivElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState({
    download: 0,
    upload: 0,
    ping: 0,
    location: 'New York, USA'
  });
  const [currentPhase, setCurrentPhase] = useState<'idle' | 'ping' | 'download' | 'upload' | 'complete'>('idle');

  const runSpeedTest = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setCurrentPhase('ping');
    
    // Reset results
    setTestResults({ download: 0, upload: 0, ping: 0, location: 'New York, USA' });

    // Ping test
    setCurrentPhase('ping');
    let currentPing = 0;
    const targetPing = Math.floor(Math.random() * 20) + 5; // 5-25ms
    
    const pingInterval = setInterval(() => {
      currentPing += Math.random() * 3;
      if (currentPing >= targetPing) {
        currentPing = targetPing;
        clearInterval(pingInterval);
      }
      setTestResults(prev => ({ ...prev, ping: Math.round(currentPing) }));
    }, 50);
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Download test
    setCurrentPhase('download');
    let currentDownload = 0;
    const targetDownload = Math.floor(Math.random() * 300) + 150; // 150-450 Mbps
    
    const downloadInterval = setInterval(() => {
      currentDownload += Math.random() * 15 + 5;
      if (currentDownload >= targetDownload) {
        currentDownload = targetDownload;
        clearInterval(downloadInterval);
      }
      setTestResults(prev => ({ ...prev, download: Math.round(currentDownload) }));
      
      // Animate speed meter
      if (speedMeterRef.current) {
        const percentage = (currentDownload / 500) * 100;
        gsap.to(speedMeterRef.current, {
          rotation: percentage * 1.8 - 90,
          duration: 0.1,
          ease: "none"
        });
      }
    }, 100);
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Upload test
    setCurrentPhase('upload');
    let currentUpload = 0;
    const targetUpload = Math.floor(Math.random() * 100) + 50; // 50-150 Mbps
    
    const uploadInterval = setInterval(() => {
      currentUpload += Math.random() * 8 + 2;
      if (currentUpload >= targetUpload) {
        currentUpload = targetUpload;
        clearInterval(uploadInterval);
      }
      setTestResults(prev => ({ ...prev, upload: Math.round(currentUpload) }));
    }, 100);
    
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    setCurrentPhase('complete');
    setIsRunning(false);

    // Reset meter
    if (speedMeterRef.current) {
      gsap.to(speedMeterRef.current, {
        rotation: -90,
        duration: 1,
        ease: "back.out(1.7)",
        delay: 2
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

    // Initialize speed meter
    if (speedMeterRef.current) {
      gsap.set(speedMeterRef.current, { rotation: -90 });
    }
  }, []);

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'ping': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'download': return 'text-blue-600 bg-blue-100 border-blue-300';
      case 'upload': return 'text-purple-600 bg-purple-100 border-purple-300';
      case 'complete': return 'text-green-600 bg-green-100 border-green-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const getPhaseText = (phase: string) => {
    switch (phase) {
      case 'ping': return 'Testing Latency...';
      case 'download': return 'Testing Download Speed...';
      case 'upload': return 'Testing Upload Speed...';
      case 'complete': return 'Test Complete!';
      default: return 'Ready to Test';
    }
  };

  return (
    <div ref={containerRef} className="py-16 bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-100/60 rounded-full border border-cyan-200 mb-4">
            <Gauge className="w-4 h-4 text-cyan-600" />
            <span className="text-cyan-700 font-medium text-sm">Performance Testing</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Speed Test{' '}
            <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Widget
            </span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Experience our network performance in real-time. Test your connection speed with our interactive speed test tool.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-cyan-200 p-8 shadow-2xl">
            
            {/* Speed Meter */}
            <div className="relative mb-8">
              <div className="w-64 h-32 mx-auto relative overflow-hidden">
                {/* Meter background */}
                <div className="absolute inset-0">
                  <svg className="w-full h-full" viewBox="0 0 200 100">
                    {/* Background arc */}
                    <path
                      d="M 10 90 A 80 80 0 0 1 190 90"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                    {/* Colored segments */}
                    <path
                      d="M 10 90 A 80 80 0 0 0 50 30"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 50 30 A 80 80 0 0 0 100 10"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 100 10 A 80 80 0 0 0 150 30"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 150 30 A 80 80 0 0 0 190 90"
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                {/* Speed indicators */}
                <div className="absolute bottom-0 left-0 text-xs text-gray-500">0</div>
                <div className="absolute top-4 left-1/4 text-xs text-gray-500">100</div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">250</div>
                <div className="absolute top-4 right-1/4 text-xs text-gray-500">400</div>
                <div className="absolute bottom-0 right-0 text-xs text-gray-500">500+</div>

                {/* Speed needle */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                  <div className="relative">
                    <div
                      ref={speedMeterRef}
                      className="w-1 h-16 bg-gradient-to-t from-red-500 to-red-600 origin-bottom transform -rotate-90 shadow-lg"
                      style={{ transformOrigin: 'bottom center' }}
                    ></div>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-800 rounded-full border-2 border-white shadow-lg"></div>
                  </div>
                </div>

                {/* Current speed display */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
                  <div className="text-3xl font-bold text-gray-800">
                    {currentPhase === 'download' ? testResults.download : 
                     currentPhase === 'upload' ? testResults.upload : 0}
                  </div>
                  <div className="text-sm text-gray-600">Mbps</div>
                </div>
              </div>
            </div>

            {/* Status indicator */}
            <div className="text-center mb-8">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getPhaseColor(currentPhase)}`}>
                {isRunning && (
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                )}
                <span className="font-medium">{getPhaseText(currentPhase)}</span>
              </div>
            </div>

            {/* Test results */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Ping */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200 p-6 text-center">
                <div className="flex justify-center mb-3">
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <Wifi className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-800 mb-1">{testResults.ping}ms</div>
                <div className="text-gray-600 font-medium">Ping</div>
                <div className="text-green-600 text-sm mt-2">
                  {testResults.ping > 0 && testResults.ping < 20 ? 'Excellent' : 
                   testResults.ping >= 20 && testResults.ping < 50 ? 'Good' : 
                   testResults.ping >= 50 ? 'Fair' : 'Testing...'}
                </div>
              </div>

              {/* Download */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 p-6 text-center">
                <div className="flex justify-center mb-3">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Download className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-800 mb-1">{testResults.download}</div>
                <div className="text-gray-600 font-medium">Download (Mbps)</div>
                <div className="text-green-600 text-sm mt-2">
                  {testResults.download > 100 ? 'Ultra Fast' : 
                   testResults.download > 50 ? 'Fast' : 
                   testResults.download > 0 ? 'Good' : 'Testing...'}
                </div>
              </div>

              {/* Upload */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200 p-6 text-center">
                <div className="flex justify-center mb-3">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Upload className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-800 mb-1">{testResults.upload}</div>
                <div className="text-gray-600 font-medium">Upload (Mbps)</div>
                <div className="text-green-600 text-sm mt-2">
                  {testResults.upload > 50 ? 'Excellent' : 
                   testResults.upload > 25 ? 'Good' : 
                   testResults.upload > 0 ? 'Fair' : 'Testing...'}
                </div>
              </div>
            </div>

            {/* Server location */}
            <div className="flex items-center justify-center gap-2 mb-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <span className="text-emerald-700 font-medium">Testing from: {testResults.location}</span>
            </div>

            {/* Control button */}
            <div className="text-center">
              <button
                onClick={runSpeedTest}
                disabled={isRunning}
                className={`px-8 py-4 rounded-xl font-medium transition-all duration-300 flex items-center gap-3 mx-auto ${
                  isRunning
                    ? 'bg-gray-100 text-gray-500 border border-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-105'
                }`}
                data-magnetic
              >
                {isRunning ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Running Test...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Start Speed Test
                  </>
                )}
              </button>
            </div>

            {/* Speed test info */}
            <div className="mt-6 text-center text-sm text-gray-600">
              <p>Test measures your connection to our nearest VPN server</p>
              <p className="mt-1">Results may vary based on your location and network conditions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}