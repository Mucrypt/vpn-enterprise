"use client";

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Shield, Search, CheckCircle, AlertTriangle, XCircle, 
  Lock, Eye, Globe, Wifi, Server, Database, Key
} from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface SecurityCheck {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  status: 'pending' | 'scanning' | 'secure' | 'warning' | 'vulnerable';
  description: string;
  details: string;
}

export default function SecurityScanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentScan, setCurrentScan] = useState(0);
  
  const [securityChecks, setSecurityChecks] = useState<SecurityCheck[]>([
    {
      id: 'encryption',
      name: 'Encryption Protocol',
      icon: Lock,
      status: 'pending',
      description: 'Checking encryption strength',
      details: 'Verifying AES-256 encryption implementation'
    },
    {
      id: 'dns',
      name: 'DNS Leak Protection',
      icon: Globe,
      status: 'pending',
      description: 'Testing DNS leak prevention',
      details: 'Ensuring DNS queries are routed through VPN'
    },
    {
      id: 'killswitch',
      name: 'Kill Switch',
      icon: Shield,
      status: 'pending',
      description: 'Verifying kill switch functionality',
      details: 'Testing automatic connection termination'
    },
    {
      id: 'ipv6',
      name: 'IPv6 Protection',
      icon: Wifi,
      status: 'pending',
      description: 'Checking IPv6 leak protection',
      details: 'Ensuring IPv6 traffic is secured'
    },
    {
      id: 'logs',
      name: 'Zero-Log Policy',
      icon: Eye,
      status: 'pending',
      description: 'Verifying no-log implementation',
      details: 'Confirming data retention policies'
    },
    {
      id: 'server',
      name: 'Server Security',
      icon: Server,
      status: 'pending',
      description: 'Analyzing server hardening',
      details: 'Checking server configuration security'
    },
    {
      id: 'auth',
      name: 'Authentication',
      icon: Key,
      status: 'pending',
      description: 'Testing authentication security',
      details: 'Verifying multi-factor authentication'
    },
    {
      id: 'data',
      name: 'Data Integrity',
      icon: Database,
      status: 'pending',
      description: 'Checking data integrity',
      details: 'Ensuring data transmission integrity'
    }
  ]);

  const runSecurityScan = async () => {
    if (isScanning) return;
    
    setIsScanning(true);
    setScanProgress(0);
    setCurrentScan(0);
    
    // Reset all checks
    setSecurityChecks(prev => prev.map(check => ({ ...check, status: 'pending' as const })));

    // Run scans
    for (let i = 0; i < securityChecks.length; i++) {
      setCurrentScan(i);
      
      // Update current check to scanning
      setSecurityChecks(prev => prev.map((check, index) => ({
        ...check,
        status: index === i ? 'scanning' : index < i ? getRandomResult() : 'pending'
      })));

      // Simulate scan time
      const scanTime = Math.random() * 1500 + 800; // 0.8-2.3 seconds
      
      // Animate progress
      const progressInterval = setInterval(() => {
        setScanProgress(prev => {
          const target = ((i + 1) / securityChecks.length) * 100;
          const newProgress = prev + (target - prev) * 0.1;
          if (newProgress >= target - 1) {
            clearInterval(progressInterval);
            return target;
          }
          return newProgress;
        });
      }, 50);

      await new Promise(resolve => setTimeout(resolve, scanTime));
      
      // Complete current scan
      setSecurityChecks(prev => prev.map((check, index) => ({
        ...check,
        status: index === i ? getRandomResult() : check.status
      })));
    }

    setIsScanning(false);
    setScanProgress(100);
  };

  const getRandomResult = (): 'secure' | 'warning' | 'vulnerable' => {
    const rand = Math.random();
    if (rand < 0.7) return 'secure';
    if (rand < 0.9) return 'warning';
    return 'vulnerable';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'secure': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'vulnerable': return 'text-red-600 bg-red-50 border-red-200';
      case 'scanning': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'secure': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'vulnerable': return XCircle;
      case 'scanning': return Search;
      default: return Shield;
    }
  };

  const getOverallSecurity = () => {
    const completed = securityChecks.filter(check => ['secure', 'warning', 'vulnerable'].includes(check.status));
    if (completed.length === 0) return { score: 0, level: 'Unknown', color: 'text-gray-600' };
    
    const secure = completed.filter(check => check.status === 'secure').length;
    const warning = completed.filter(check => check.status === 'warning').length;
    
    const score = Math.round(((secure * 100 + warning * 60) / completed.length));
    
    if (score >= 90) return { score, level: 'Excellent', color: 'text-green-600' };
    if (score >= 75) return { score, level: 'Good', color: 'text-yellow-600' };
    if (score >= 50) return { score, level: 'Fair', color: 'text-orange-600' };
    return { score, level: 'Poor', color: 'text-red-600' };
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

  const overallSecurity = getOverallSecurity();

  return (
    <div
      ref={containerRef}
      className='py-16 bg-linear-to-br from-white via-red-50/30 to-orange-50/20'
    >
      <div className='container mx-auto px-4'>
        <div className='text-center mb-12'>
          <div className='inline-flex items-center gap-2 px-4 py-2 bg-red-100/60 rounded-full border border-red-200 mb-4'>
            <Shield className='w-4 h-4 text-red-600' />
            <span className='text-red-700 font-medium text-sm'>
              Security Analysis
            </span>
          </div>
          <h2 className='text-4xl font-bold text-gray-800 mb-4'>
            Security{' '}
            <span className='bg-linear-to-br from-red-600 to-orange-600 bg-clip-text text-transparent'>
              Scanner
            </span>
          </h2>
          <p className='text-gray-600 max-w-2xl mx-auto text-lg'>
            Run a comprehensive security audit of your VPN connection. Our
            scanner checks multiple security vectors in real-time.
          </p>
        </div>

        <div className='max-w-6xl mx-auto'>
          {/* Security overview */}
          <div className='bg-white/60 backdrop-blur-sm rounded-3xl border border-red-200 p-8 shadow-2xl mb-8'>
            <div className='grid lg:grid-cols-3 gap-8 items-center'>
              {/* Security score */}
              <div className='text-center'>
                <div className='relative w-32 h-32 mx-auto mb-4'>
                  {/* Circular progress */}
                  <svg
                    className='w-32 h-32 transform -rotate-90'
                    viewBox='0 0 120 120'
                  >
                    <circle
                      cx='60'
                      cy='60'
                      r='50'
                      fill='none'
                      stroke='#e5e7eb'
                      strokeWidth='8'
                    />
                    <circle
                      cx='60'
                      cy='60'
                      r='50'
                      fill='none'
                      stroke='url(#securityGradient)'
                      strokeWidth='8'
                      strokeLinecap='round'
                      strokeDasharray={`${(overallSecurity.score / 100) * 314} 314`}
                      className='transition-all duration-1000'
                    />
                    <defs>
                      <linearGradient
                        id='securityGradient'
                        x1='0%'
                        y1='0%'
                        x2='100%'
                        y2='0%'
                      >
                        <stop offset='0%' stopColor='#ef4444' />
                        <stop offset='50%' stopColor='#f59e0b' />
                        <stop offset='100%' stopColor='#10b981' />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <div className='text-center'>
                      <div
                        className={`text-2xl font-bold ${overallSecurity.color}`}
                      >
                        {overallSecurity.score}
                      </div>
                      <div className='text-gray-500 text-sm'>Score</div>
                    </div>
                  </div>
                </div>
                <h3 className={`text-xl font-bold ${overallSecurity.color}`}>
                  {overallSecurity.level}
                </h3>
                <p className='text-gray-600'>Security Level</p>
              </div>

              {/* Scan progress */}
              <div className='space-y-4'>
                <div className='text-center'>
                  <h3 className='text-lg font-bold text-gray-800 mb-2'>
                    {isScanning ? 'Scanning...' : 'Security Scan'}
                  </h3>
                  <div className='w-full bg-gray-200 rounded-full h-3 mb-2'>
                    <div
                      className='bg-linear-to-br from-red-500 to-orange-500 h-3 rounded-full transition-all duration-300'
                      style={{ width: `${scanProgress}%` }}
                    ></div>
                  </div>
                  <p className='text-gray-600 text-sm'>
                    {isScanning
                      ? `Checking ${securityChecks[currentScan]?.name || 'Security'}...`
                      : `${Math.round(scanProgress)}% Complete`}
                  </p>
                </div>

                <button
                  onClick={runSecurityScan}
                  disabled={isScanning}
                  className={`w-full px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                    isScanning
                      ? 'bg-gray-100 text-gray-500 border border-gray-300 cursor-not-allowed'
                      : 'bg-linear-to-br from-red-500 to-orange-600 text-white shadow-lg hover:shadow-xl hover:scale-105'
                  }`}
                  data-magnetic
                >
                  {isScanning ? (
                    <>
                      <div className='w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin'></div>
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Search className='w-5 h-5' />
                      Start Security Scan
                    </>
                  )}
                </button>
              </div>

              {/* Quick stats */}
              <div className='space-y-4'>
                {[
                  {
                    label: 'Checks Completed',
                    value: securityChecks.filter((c) =>
                      ['secure', 'warning', 'vulnerable'].includes(c.status),
                    ).length,
                    total: securityChecks.length,
                    color: 'text-blue-600',
                  },
                  {
                    label: 'Secure Items',
                    value: securityChecks.filter((c) => c.status === 'secure')
                      .length,
                    total: securityChecks.length,
                    color: 'text-green-600',
                  },
                  {
                    label: 'Warnings',
                    value: securityChecks.filter((c) => c.status === 'warning')
                      .length,
                    total: securityChecks.length,
                    color: 'text-yellow-600',
                  },
                  {
                    label: 'Vulnerabilities',
                    value: securityChecks.filter(
                      (c) => c.status === 'vulnerable',
                    ).length,
                    total: securityChecks.length,
                    color: 'text-red-600',
                  },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between p-3 bg-white/40 rounded-lg border border-red-200'
                  >
                    <span className='text-gray-700 font-medium'>
                      {stat.label}
                    </span>
                    <span className={`font-bold ${stat.color}`}>
                      {stat.value}/{stat.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Security checks grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {securityChecks.map((check) => {
              const Icon = check.icon
              const StatusIcon = getStatusIcon(check.status)

              return (
                <div
                  key={check.id}
                  className={`p-6 rounded-2xl border transition-all duration-500 ${getStatusColor(check.status)}`}
                >
                  <div className='flex items-start justify-between mb-4'>
                    <div className='flex items-center gap-3'>
                      <div className='p-2 rounded-lg bg-white/60'>
                        <Icon className='w-5 h-5 text-current' />
                      </div>
                      <div>
                        <h4 className='font-bold text-current'>{check.name}</h4>
                        <p className='text-sm opacity-80'>
                          {check.description}
                        </p>
                      </div>
                    </div>

                    <div className='flex items-center gap-2'>
                      {check.status === 'scanning' ? (
                        <div className='w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin'></div>
                      ) : (
                        <StatusIcon className='w-5 h-5 text-current' />
                      )}
                    </div>
                  </div>

                  <p className='text-sm opacity-75 mb-3'>{check.details}</p>

                  {check.status !== 'pending' &&
                    check.status !== 'scanning' && (
                      <div
                        className={`text-xs px-3 py-1 rounded-full inline-block ${
                          check.status === 'secure'
                            ? 'bg-green-100 text-green-800'
                            : check.status === 'warning'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {check.status === 'secure'
                          ? '✓ Secure'
                          : check.status === 'warning'
                            ? '⚠ Needs Attention'
                            : '✗ Vulnerable'}
                      </div>
                    )}
                </div>
              )
            })}
          </div>

          {/* Security recommendations */}
          {!isScanning && overallSecurity.score > 0 && (
            <div className='mt-8 bg-linear-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 p-6'>
              <h3 className='text-lg font-bold text-gray-800 mb-4 flex items-center gap-2'>
                <Shield className='w-5 h-5 text-blue-600' />
                Security Recommendations
              </h3>
              <div className='grid md:grid-cols-2 gap-4'>
                {[
                  'Enable kill switch for maximum protection',
                  'Use DNS leak protection at all times',
                  'Regularly update your VPN client',
                  'Monitor connection logs for anomalies',
                ].map((recommendation, index) => (
                  <div
                    key={index}
                    className='flex items-center gap-3 p-3 bg-white/60 rounded-lg'
                  >
                    <CheckCircle className='w-4 h-4 text-green-600 shrink-0' />
                    <span className='text-gray-700 text-sm'>
                      {recommendation}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}