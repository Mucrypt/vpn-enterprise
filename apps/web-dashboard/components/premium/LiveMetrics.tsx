"use client";

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Activity, Users, Shield, Zap, Globe, TrendingUp,
  Server, Database, Wifi, Clock
} from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface MetricData {
  icon: React.ComponentType<any>;
  label: string;
  value: number;
  suffix: string;
  prefix?: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export default function LiveMetrics() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState<MetricData[]>([
    {
      icon: Users,
      label: "Active Users",
      value: 15420,
      suffix: "+",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200"
    },
    {
      icon: Shield,
      label: "Data Protected",
      value: 2847,
      suffix: " TB",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      icon: Globe,
      label: "Server Locations",
      value: 87,
      suffix: " Countries",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200"
    },
    {
      icon: Zap,
      label: "Uptime",
      value: 99.98,
      suffix: "%",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      icon: Activity,
      label: "Avg Speed",
      value: 847,
      suffix: " Mbps",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200"
    },
    {
      icon: Database,
      label: "Requests/sec",
      value: 12450,
      suffix: "",
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      borderColor: "border-rose-200"
    }
  ]);

  // Animate numbers
  const animateNumber = (element: HTMLElement, start: number, end: number, duration: number = 2) => {
    gsap.fromTo(element, 
      { textContent: start },
      {
        textContent: end,
        duration,
        ease: "power2.out",
        snap: { textContent: 1 },
        onUpdate: function() {
          const value = Math.round(parseFloat(this.targets()[0].textContent));
          const metric = metrics.find(m => m.value === end);
          if (metric) {
            element.textContent = value.toLocaleString();
          }
        }
      }
    );
  };

  // Live updates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: metric.label === "Active Users" 
          ? metric.value + Math.floor(Math.random() * 10) - 5
          : metric.label === "Data Protected"
          ? metric.value + Math.floor(Math.random() * 5)
          : metric.label === "Requests/sec"
          ? metric.value + Math.floor(Math.random() * 100) - 50
          : metric.value
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const cards = containerRef.current.querySelectorAll('.metric-card');
    
    gsap.fromTo(cards, {
      y: 50,
      opacity: 0,
      scale: 0.9
    }, {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.8,
      ease: "back.out(1.7)",
      stagger: 0.1,
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 80%",
        toggleActions: "play none none reverse"
      }
    });

    // Animate metric numbers
    cards.forEach((card, index) => {
      const numberEl = card.querySelector('.metric-number') as HTMLElement;
      if (numberEl) {
        ScrollTrigger.create({
          trigger: card,
          start: "top 85%",
          onEnter: () => {
            animateNumber(numberEl, 0, metrics[index].value);
          }
        });
      }
    });

  }, [metrics]);

  return (
    <div ref={containerRef} className="py-16 bg-gradient-to-br from-white via-green-50/30 to-yellow-50/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100/60 rounded-full border border-emerald-200 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-700 font-medium text-sm">Live Performance Metrics</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Real-Time Business{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              Intelligence
            </span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Watch our platform's performance in real-time. These metrics update live to show our commitment to excellence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={index}
                className={`metric-card relative p-6 bg-white/80 backdrop-blur-sm rounded-2xl border ${metric.borderColor} shadow-lg hover:shadow-xl transition-all duration-500 group overflow-hidden`}
              >
                {/* Animated background gradient */}
                <div className={`absolute inset-0 ${metric.bgColor} opacity-0 group-hover:opacity-50 transition-opacity duration-500`}></div>
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer"></div>
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 ${metric.bgColor} rounded-xl border ${metric.borderColor} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-6 h-6 ${metric.color}`} />
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-600 text-xs font-medium">LIVE</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-baseline gap-1">
                      <span className={`metric-number text-3xl font-bold ${metric.color}`}>
                        {metric.value.toLocaleString()}
                      </span>
                      <span className="text-gray-500 text-sm">{metric.suffix}</span>
                    </div>
                    <p className="text-gray-600 font-medium">{metric.label}</p>
                  </div>

                  {/* Growth indicator */}
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                      <TrendingUp className="w-3 h-3 text-green-600" />
                      <span className="text-green-700 text-xs font-medium">
                        +{[12, 8, 15, 7, 11, 9][index] || 10}%
                      </span>
                    </div>
                    <span className="text-gray-500 text-xs">vs last month</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Real-time activity feed */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-gray-800">Live Activity Feed</h3>
              <div className="flex items-center gap-1 ml-auto">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-600 text-sm font-medium">Real-time</span>
              </div>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {[
                "New user connected from Tokyo, Japan",
                "Server cluster expanded in Frankfurt, Germany", 
                "99.99% uptime maintained for 247 days",
                "1.2TB of data encrypted in the last hour",
                "Security scan completed: All systems secure"
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50/50 to-transparent rounded-lg border-l-2 border-emerald-300">
                  <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-gray-700 text-sm">{activity}</span>
                  <span className="text-gray-500 text-xs ml-auto">just now</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}