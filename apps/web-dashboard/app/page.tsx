"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';
import { SplitText } from 'gsap/SplitText';
import { 
  Shield, Lock, Zap, Globe, Users, BarChart, Loader2, Database, 
  Cloud, Server, Webhook, Code, CreditCard, Building, 
  MonitorSpeaker, Activity, Layers, Network, Wifi, 
  HardDrive, Gauge, TrendingUp, Star, ArrowRight, 
  CheckCircle, Sparkles, Rocket, Eye, Cpu, Terminal,
  Layers3, GitBranch, Boxes, Fingerprint, Key, Settings,
  ShieldCheck, EyeOff, LockKeyhole, DatabaseZap, ServerCog,
  GlobeLock, UsersRound, Building2, Cctv, Satellite, 
  ArrowUpRight, Download, Upload, WifiOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/store';
import HydrationStatus from '@/components/debug/hydration-status';

// Premium components
import LiveMetrics from '@/components/premium/LiveMetrics';
import InteractiveNetworkMap from '@/components/premium/InteractiveNetworkMap';
import CustomerTestimonials from '@/components/premium/CustomerTestimonials';
import VPNConnectionSimulator from '@/components/premium/VPNConnectionSimulator';
import SpeedTestWidget from '@/components/premium/SpeedTestWidget';
import SecurityScanner from '@/components/premium/SecurityScanner';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, TextPlugin, SplitText);
}

export default function Home() {
  const { isAuthenticated, hasHydrated, isLoading } = useAuthStore();
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Refs for animations
  const heroRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const backgroundGridRef = useRef<HTMLDivElement>(null);
  const floatingIconsRef = useRef<HTMLDivElement>(null);
  const vpnVisualizationRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const brandsRef = useRef<HTMLDivElement>(null);

  const handleDashboardClick = useCallback(() => {
    if (!hasHydrated) return;
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/auth/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  const dashboardButtonDisabled = !hasHydrated || isLoading;

  useEffect(() => {
    const state = useAuthStore.getState();
    if (!state.hasHydrated) {
      state.setHydrated(true);
      state.setLoading(false);
      console.debug('[Home] Immediate mount hydration applied');
    } else if (state.isLoading) {
      state.setLoading(false);
    }
  }, []);

  // 🚀 ENTERPRISE-GRADE GSAP ANIMATIONS
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;

    // Create master timeline
    const masterTL = gsap.timeline();

    // 1. SECURITY GRID BACKGROUND
    const gridCells = backgroundGridRef.current?.children;
    if (gridCells) {
      gsap.set(gridCells, {
        opacity: 0.05,
        scale: 0.8
      });

      // Staggered pulse effect for security grid
      gsap.to(gridCells, {
        duration: 3,
        opacity: "random(0.1, 0.3)",
        scale: "random(0.9, 1.1)",
        ease: "sine.inOut",
        stagger: {
          amount: 3,
          grid: [10, 10],
          from: "random"
        },
        repeat: -1,
        yoyo: true
      });
    }

    // 2. FLOATING SECURITY ICONS
    const icons = floatingIconsRef.current?.children;
    if (icons) {
      Array.from(icons).forEach((icon, i) => {
        const duration = 10 + i * 0.5;
        gsap.to(icon, {
          duration: duration,
          x: `random(-150, 150)`,
          y: `random(-100, 100)`,
          rotation: "random(-45, 45)",
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: i * 0.3
        });

        // Security glow pulse
        gsap.to(icon, {
          duration: 2,
          scale: 1.2,
          opacity: 0.8,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: i * 0.7
        });
      });
    }

    // 3. VPN VISUALIZATION ANIMATION
    const vpnNodes = vpnVisualizationRef.current?.querySelectorAll('.vpn-node');
    const vpnConnections = vpnVisualizationRef.current?.querySelectorAll('.vpn-connection');
    
    if (vpnNodes && vpnConnections) {
      // Animate VPN nodes
      gsap.set(vpnNodes, {
        scale: 0,
        opacity: 0
      });

      gsap.to(vpnNodes, {
        duration: 1.5,
        scale: 1,
        opacity: 1,
        stagger: 0.3,
        ease: "elastic.out(1, 0.5)",
        repeat: -1,
        yoyo: true,
        repeatDelay: 2
      });

      // Animate VPN connections (data flow)
      gsap.set(vpnConnections, {
        strokeDasharray: "1000",
        strokeDashoffset: "1000"
      });

      gsap.to(vpnConnections, {
        duration: 4,
        strokeDashoffset: "0",
        ease: "power2.inOut",
        stagger: 0.5,
        repeat: -1,
        repeatDelay: 1
      });
    }

    // 4. HERO ENTRANCE - ENTERPRISE SEQUENCE
    const heroTL = gsap.timeline();
    
    // Logo security seal animation
    heroTL.fromTo(logoRef.current, 
      {
        scale: 0,
        rotation: 180,
        opacity: 0,
        filter: "blur(10px)"
      },
      {
        duration: 1.5,
        scale: 1,
        rotation: 0,
        opacity: 1,
        filter: "blur(0px)",
        ease: "back.out(1.7)"
      }
    );

    // 🏆 WORLD-CLASS TITLE MASTERPIECE ANIMATION
    if (titleRef.current) {
      // 1. PREMIUM BACKGROUND ORBS
      const bgOrbs = titleRef.current.querySelectorAll('.title-bg-orb');
      gsap.set(bgOrbs, { scale: 0, opacity: 0 });
      
      heroTL.to(bgOrbs, {
        scale: 1,
        opacity: 1,
        duration: 2,
        stagger: 0.3,
        ease: "elastic.out(1, 0.5)"
      }, "titleStart");

      // 2. LETTER-BY-LETTER SPECTACULAR ENTRANCE
      const letters = titleRef.current.querySelectorAll('.title-letter');
      gsap.set(letters, {
        opacity: 0,
        y: 100,
        rotationX: -90,
        scale: 0.3,
        filter: "blur(10px)"
      });

      heroTL.to(letters, {
        opacity: 1,
        y: 0,
        rotationX: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 1.5,
        stagger: {
          amount: 1.2,
          from: "start",
          ease: "power2.out"
        },
        ease: "back.out(2)"
      }, "titleStart+=0.5");

      // 3. SECOND LINE MORPHING ENTRANCE
      const titleLine2 = titleRef.current.querySelector('.title-line-2');
      const titleWords = titleRef.current.querySelectorAll('.title-word');
      const titleSeparator = titleRef.current.querySelector('.title-separator');
      
      gsap.set([titleWords, titleSeparator], {
        opacity: 0,
        y: 80,
        scale: 0.8,
        rotationY: 45
      });

      heroTL.to(titleWords, {
        opacity: 1,
        y: 0,
        scale: 1,
        rotationY: 0,
        duration: 1.2,
        stagger: 0.2,
        ease: "power3.out"
      }, "titleStart+=1.8");

      heroTL.to(titleSeparator, {
        opacity: 1,
        y: 0,
        scale: 1.5,
        rotationY: 0,
        duration: 0.8,
        ease: "elastic.out(1, 0.8)"
      }, "titleStart+=2.0");

      // 4. ANIMATED UNDERLINE DRAW
      const underline = titleRef.current.querySelector('.title-underline');
      gsap.set(underline, { scaleX: 0 });
      
      heroTL.to(underline, {
        scaleX: 1,
        duration: 1.5,
        ease: "power2.inOut"
      }, "titleStart+=2.5");

      // 5. FLOATING PARTICLES MAGIC
      const particles = titleRef.current.querySelectorAll('.title-particle');
      gsap.set(particles, { opacity: 0, scale: 0 });
      
      heroTL.to(particles, {
        opacity: 0.8,
        scale: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: "back.out(3)"
      }, "titleStart+=3");

      // Continuous particle floating
      particles.forEach((particle, i) => {
        gsap.to(particle, {
          y: "random(-20, 20)",
          x: "random(-15, 15)",
          rotation: "random(-45, 45)",
          duration: "random(2, 4)",
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.2
        });
      });

      // 6. HOLOGRAPHIC SWEEP
      const holo = titleRef.current.querySelector('.title-holo');
      gsap.set(holo, { x: "-100%", opacity: 0 });
      
      heroTL.to(holo, {
        x: "100%",
        opacity: 0.6,
        duration: 1.5,
        ease: "power2.inOut"
      }, "titleStart+=2.8");

      // 7. PREMIUM AWARD BADGE
      const badge = titleRef.current.querySelector('.title-badge');
      gsap.set(badge, { scale: 0, rotation: 45, opacity: 0 });
      
      heroTL.to(badge, {
        scale: 1,
        rotation: 12,
        opacity: 1,
        duration: 1,
        ease: "elastic.out(1.2, 0.5)"
      }, "titleStart+=4");

      // Badge pulse animation
      gsap.to(badge, {
        scale: 1.05,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      // 8. DECORATIVE CROWN & SPARKLE
      const crown = titleRef.current.querySelector('.title-crown');
      const sparkle = titleRef.current.querySelector('.title-sparkle');
      
      heroTL.to([crown, sparkle], {
        opacity: 1,
        scale: 1.2,
        duration: 0.6,
        stagger: 0.1,
        ease: "back.out(3)"
      }, "titleStart+=4.5");

      // Continuous crown bobbing
      gsap.to(crown, {
        y: -5,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      // Sparkle twinkle
      gsap.to(sparkle, {
        rotation: 180,
        scale: 1.5,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut"
      });

      // 9. SUBTITLE ENHANCEMENT
      const subtitle = titleRef.current.querySelector('.title-subtitle');
      gsap.set(subtitle, { opacity: 0, y: 20, filter: "blur(5px)" });
      
      heroTL.to(subtitle, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1,
        ease: "power3.out"
      }, "titleStart+=5");
      
      // 10. CONTINUOUS LETTER HOVER EFFECTS
      letters.forEach((letter, i) => {
        letter.addEventListener('mouseenter', () => {
          gsap.to(letter, {
            y: -10,
            scale: 1.2,
            color: "#10b981",
            textShadow: "0 0 20px rgba(16, 185, 129, 0.8)",
            duration: 0.3,
            ease: "back.out(3)"
          });
        });

        letter.addEventListener('mouseleave', () => {
          gsap.to(letter, {
            y: 0,
            scale: 1,
            color: "#1f2937",
            textShadow: "none",
            duration: 0.3,
            ease: "power2.out"
          });
        });
      });

      // 11. BACKGROUND ORBS FLOATING
      bgOrbs.forEach((orb, i) => {
        gsap.to(orb, {
          x: "random(-30, 30)",
          y: "random(-20, 20)",
          rotation: 360,
          duration: "random(8, 12)",
          repeat: -1,
          ease: "none"
        });
      });
    }

    // Subtitle reveal
    heroTL.fromTo(subtitleRef.current,
      {
        opacity: 0,
        y: 30,
        filter: "blur(10px)"
      },
      {
        duration: 1,
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        ease: "power3.out"
      },
      "-=0.3"
    );

    // Feature badges entrance
    const pills = document.querySelectorAll('.feature-badge');
    heroTL.fromTo(pills,
      {
        opacity: 0,
        scale: 0,
        y: 20
      },
      {
        duration: 0.8,
        opacity: 1,
        scale: 1,
        y: 0,
        stagger: 0.15,
        ease: "back.out(1.7)"
      },
      "-=0.2"
    );

    // CTA buttons encryption animation
    heroTL.fromTo(ctaRef.current,
      {
        opacity: 0,
        scale: 0.8,
        y: 30
      },
      {
        duration: 0.8,
        opacity: 1,
        scale: 1,
        y: 0,
        ease: "elastic.out(1.2, 0.5)"
      },
      "-=0.1"
    );

    masterTL.add(heroTL);

    // 5. DATA FLOW ANIMATION (For VPN/Server visualization)
    const dataPackets = document.querySelectorAll('.data-packet');
    if (dataPackets) {
      Array.from(dataPackets).forEach((packet, i) => {
        gsap.set(packet, {
          opacity: 0,
          scale: 0
        });

        gsap.to(packet, {
          duration: 2,
          opacity: 1,
          scale: 1,
          ease: "power2.out",
          delay: i * 0.2,
          repeat: -1,
          repeatDelay: 3
        });
      });
    }

    // 6. SCROLL-TRIGGERED SERVICE REVEALS
    const serviceCards = servicesRef.current?.querySelectorAll('.service-card');
    if (serviceCards) {
      serviceCards.forEach((card, i) => {
        ScrollTrigger.create({
          trigger: card,
          start: "top 85%",
          end: "bottom 20%",
          onEnter: () => {
            gsap.fromTo(card,
              {
                opacity: 0,
                y: 80,
                rotationX: -15
              },
              {
                duration: 1.2,
                opacity: 1,
                y: 0,
                rotationX: 0,
                ease: "power3.out",
                delay: i * 0.15
              }
            );
          }
        });
      });
    }

    // 7. ENTERPRISE TIMELINE ANIMATION
    const timelineItems = timelineContainerRef.current?.children;
    if (timelineItems) {
      Array.from(timelineItems).forEach((item, i) => {
        ScrollTrigger.create({
          trigger: item,
          start: "top 90%",
          onEnter: () => {
            gsap.fromTo(item,
              {
                opacity: 0,
                x: i % 2 === 0 ? -50 : 50,
                scale: 0.9
              },
              {
                duration: 0.8,
                opacity: 1,
                x: 0,
                scale: 1,
                ease: "power3.out"
              }
            );
          }
        });
      });
    }

    // 8. REAL-TIME METRICS COUNTERS
    const metricNumbers = document.querySelectorAll('.metric-number');
    metricNumbers.forEach(number => {
      const target = parseInt(number.textContent?.replace(/[^0-9]/g, '') || '0');
      gsap.to(number, {
        duration: 2,
        innerText: target,
        snap: { innerText: 1 },
        ease: "power2.out",
        scrollTrigger: {
          trigger: number,
          start: "top 80%",
          toggleActions: "play none none none"
        }
      });
    });

    // 9. SECURITY SEAL ROTATION
    const securitySeals = document.querySelectorAll('.security-seal');
    securitySeals.forEach(seal => {
      gsap.to(seal, {
        duration: 20,
        rotation: 360,
        ease: "none",
        repeat: -1
      });
    });

    // 10. TRUSTED BRANDS ANIMATION
    const brandLogos = brandsRef.current?.querySelectorAll('.brand-logo');
    if (brandLogos) {
      // Set initial state
      gsap.set(brandLogos, {
        opacity: 0,
        y: 30,
        scale: 0.8
      });

      // Animate brands on scroll
      ScrollTrigger.create({
        trigger: brandsRef.current,
        start: "top 80%",
        onEnter: () => {
          gsap.to(brandLogos, {
            duration: 1,
            opacity: 1,
            y: 0,
            scale: 1,
            stagger: 0.1,
            ease: "power3.out"
          });
        }
      });

      // Continuous floating animation
      Array.from(brandLogos).forEach((logo, i) => {
        gsap.to(logo, {
          duration: 3 + i * 0.3,
          y: "random(-10, 10)",
          rotation: "random(-2, 2)",
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: i * 0.2
        });
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      masterTL.kill();
    };
  }, [isLoaded]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className='min-h-screen relative overflow-hidden'>
      <HydrationStatus />

      {/* 🌟 BRIGHT LUXURY BACKGROUND */}
      <div className='fixed inset-0 bg-linear-to-br from-white via-green-50 to-yellow-50'>
        {/* Bright luxury gradient overlays */}
        <div className='absolute inset-0 bg-linear-to-br from-emerald-100/40 via-transparent to-yellow-100/40'></div>
        <div className='absolute inset-0 bg-linear-to-bl from-green-100/30 via-transparent to-amber-100/30'></div>

        {/* Bright animated orbs */}
        <div className='absolute top-20 left-20 w-96 h-96 bg-linear-to-br from-emerald-300/40 to-green-300/40 rounded-full blur-3xl animate-pulse'></div>
        <div
          className='absolute top-40 right-32 w-80 h-80 bg-linear-to-br from-yellow-300/35 to-amber-300/35 rounded-full blur-3xl animate-pulse'
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className='absolute bottom-32 left-32 w-72 h-72 bg-linear-to-br from-lime-300/30 to-emerald-300/30 rounded-full blur-3xl animate-pulse'
          style={{ animationDelay: '4s' }}
        ></div>
        <div
          className='absolute bottom-20 right-20 w-64 h-64 bg-linear-to-br from-gold/25 to-yellow-400/25 rounded-full blur-3xl animate-pulse'
          style={{ animationDelay: '6s' }}
        ></div>

        {/* Bright luxury mesh pattern */}
        <div
          className='absolute inset-0 opacity-[0.08]'
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #10b981 2px, transparent 2px),
                           radial-gradient(circle at 75% 75%, #f59e0b 2px, transparent 2px)`,
            backgroundSize: '100px 100px',
          }}
        ></div>

        {/* Bright premium grid overlay */}
        <div
          className='absolute inset-0 opacity-[0.12]'
          style={{
            backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(245, 158, 11, 0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        ></div>

        {/* Bright gold shimmer effect */}
        <div className='absolute inset-0 bg-linear-to-br from-transparent via-yellow-300/15 to-transparent transform -skew-x-12 animate-shimmer'></div>
      </div>

      {/* 🔐 ENHANCED SECURITY GRID */}
      <div
        ref={backgroundGridRef}
        className='fixed inset-0 pointer-events-none opacity-20'
      >
        {/* Animated security grid cells */}
        {[...Array(150)].map((_, i) => (
          <div
            key={i}
            className='absolute w-[38px] h-[38px] border border-blue-500/10 rounded'
            style={{
              left: `${(i % 15) * 40}px`,
              top: `${Math.floor(i / 15) * 40}px`,
            }}
          />
        ))}
      </div>

      {/* 🔒 FLOATING SECURITY ICONS */}
      <div ref={floatingIconsRef} className='fixed inset-0 pointer-events-none'>
        {[
          {
            icon: Shield,
            color: 'text-blue-400',
            size: 'w-8 h-8',
            left: '10%',
            top: '20%',
          },
          {
            icon: Lock,
            color: 'text-green-400',
            size: 'w-6 h-6',
            left: '85%',
            top: '30%',
          },
          {
            icon: Database,
            color: 'text-purple-400',
            size: 'w-10 h-10',
            left: '15%',
            top: '70%',
          },
          {
            icon: Server,
            color: 'text-cyan-400',
            size: 'w-8 h-8',
            left: '75%',
            top: '60%',
          },
          {
            icon: Globe,
            color: 'text-yellow-400',
            size: 'w-7 h-7',
            left: '50%',
            top: '15%',
          },
          {
            icon: Key,
            color: 'text-pink-400',
            size: 'w-5 h-5',
            left: '25%',
            top: '40%',
          },
          {
            icon: ShieldCheck,
            color: 'text-emerald-400',
            size: 'w-9 h-9',
            left: '90%',
            top: '80%',
          },
          {
            icon: EyeOff,
            color: 'text-red-400',
            size: 'w-6 h-6',
            left: '40%',
            top: '85%',
          },
        ].map((item, index) => (
          <div
            key={index}
            className={`absolute opacity-20 ${item.color}`}
            style={{
              left: item.left,
              top: item.top,
            }}
          >
            <item.icon className={item.size} />
          </div>
        ))}
      </div>

      {/* 🌐 VPN NETWORK VISUALIZATION */}
      <div
        ref={vpnVisualizationRef}
        className='fixed inset-0 pointer-events-none'
      >
        <svg className='absolute inset-0 w-full h-full opacity-20'>
          {/* VPN Connections */}
          <path
            className='vpn-connection'
            d='M100,200 Q400,100 700,300'
            stroke='url(#vpn-gradient1)'
            strokeWidth='1'
            fill='none'
          />
          <path
            className='vpn-connection'
            d='M150,400 Q450,300 750,500'
            stroke='url(#vpn-gradient2)'
            strokeWidth='1'
            fill='none'
          />
          <path
            className='vpn-connection'
            d='M200,600 Q500,500 800,700'
            stroke='url(#vpn-gradient3)'
            strokeWidth='1'
            fill='none'
          />

          <defs>
            <linearGradient
              id='vpn-gradient1'
              x1='0%'
              y1='0%'
              x2='100%'
              y2='0%'
            >
              <stop offset='0%' stopColor='#3b82f6' stopOpacity='0' />
              <stop offset='50%' stopColor='#3b82f6' stopOpacity='0.3' />
              <stop offset='100%' stopColor='#3b82f6' stopOpacity='0' />
            </linearGradient>
            <linearGradient
              id='vpn-gradient2'
              x1='0%'
              y1='0%'
              x2='100%'
              y2='0%'
            >
              <stop offset='0%' stopColor='#8b5cf6' stopOpacity='0' />
              <stop offset='50%' stopColor='#8b5cf6' stopOpacity='0.3' />
              <stop offset='100%' stopColor='#8b5cf6' stopOpacity='0' />
            </linearGradient>
            <linearGradient
              id='vpn-gradient3'
              x1='0%'
              y1='0%'
              x2='100%'
              y2='0%'
            >
              <stop offset='0%' stopColor='#06b6d4' stopOpacity='0' />
              <stop offset='50%' stopColor='#06b6d4' stopOpacity='0.3' />
              <stop offset='100%' stopColor='#06b6d4' stopOpacity='0' />
            </linearGradient>
          </defs>
        </svg>

        {/* VPN Nodes */}
        {[
          { left: '10%', top: '20%', color: 'bg-blue-500' },
          { left: '30%', top: '40%', color: 'bg-purple-500' },
          { left: '50%', top: '25%', color: 'bg-cyan-500' },
          { left: '70%', top: '35%', color: 'bg-indigo-500' },
          { left: '90%', top: '20%', color: 'bg-violet-500' },
          { left: '20%', top: '60%', color: 'bg-blue-500' },
          { left: '40%', top: '75%', color: 'bg-purple-500' },
          { left: '60%', top: '65%', color: 'bg-cyan-500' },
          { left: '80%', top: '55%', color: 'bg-indigo-500' },
        ].map((node, index) => (
          <div
            key={index}
            className='vpn-node absolute w-3 h-3 rounded-full'
            style={{
              left: node.left,
              top: node.top,
            }}
          >
            <div
              className={`absolute w-4 h-4 rounded-full ${node.color} opacity-30 animate-ping`}
            ></div>
            <div
              className={`relative w-3 h-3 rounded-full ${node.color}`}
            ></div>
          </div>
        ))}
      </div>

      {/* 💎 BRIGHT LUXURY NAVIGATION */}
      <nav className='fixed top-0 w-full z-50 backdrop-blur-lg bg-white/60 border-b border-emerald-200/50 shadow-lg'>
        <div className='container mx-auto px-4 md:px-6 py-3 md:py-4 flex justify-between items-center'>
          <div className='flex items-center gap-2 md:gap-4'>
            <div ref={logoRef} className='relative group security-seal'>
              <div className='absolute -inset-2 bg-linear-to-br from-emerald-400/40 via-yellow-400/40 to-green-400/40 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700'></div>
              <div className='relative p-2 md:p-3 bg-linear-to-br from-emerald-50/90 to-green-50/90 rounded-xl border border-emerald-300/30 group-hover:border-emerald-400/50 transition-all duration-500 backdrop-blur-sm shadow-lg'>
                <div className='absolute inset-0 bg-linear-to-br from-emerald-200/20 to-yellow-200/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>
                <Shield className='h-5 w-5 md:h-7 md:w-7 text-emerald-700 relative z-10' />
              </div>
            </div>
            <div className='flex flex-col'>
              <span className='text-lg md:text-2xl font-black bg-linear-to-br from-gray-800 via-emerald-700 to-yellow-600 bg-clip-text text-transparent'>
                VPN Enterprise
              </span>
              <span className='text-xs font-medium bg-linear-to-br from-emerald-600 to-yellow-600 bg-clip-text text-transparent hidden sm:block'>
                ✨ Luxury Cloud Infrastructure
              </span>
            </div>
          </div>

          <Button
            className='group relative overflow-hidden bg-linear-to-br from-emerald-600 via-green-600 to-yellow-600 hover:from-emerald-500 hover:via-green-500 hover:to-yellow-500 shadow-2xl shadow-emerald-500/25 border border-emerald-300/30 backdrop-blur-sm'
            onClick={handleDashboardClick}
            disabled={dashboardButtonDisabled}
            data-magnetic
          >
            <div className='absolute inset-0 bg-linear-to-br from-white/30 via-yellow-100/20 to-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>
            <div className='absolute -inset-1 bg-linear-to-br from-emerald-400 via-green-400 to-yellow-400 rounded-lg blur opacity-0 group-hover:opacity-40 transition-opacity duration-500'></div>
            <div className='relative z-10 flex items-center px-4 md:px-8 py-1'>
              {dashboardButtonDisabled ? (
                <Loader2 className='h-5 w-5 animate-spin mr-2' />
              ) : isAuthenticated ? (
                <>
                  <span className='font-bold'>Enter Platform</span>
                  <Sparkles className='h-4 w-4 ml-2' />
                </>
              ) : (
                <>
                  <span className='font-bold'>Begin Journey</span>
                  <ArrowUpRight className='h-4 w-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300' />
                </>
              )}
            </div>
          </Button>
        </div>
      </nav>

      {/* 🚀 HERO SECTION - ENTERPRISE VPN PLATFORM */}
      <div className='relative pt-24 md:pt-32 pb-16 md:pb-24' ref={heroRef}>
        <div className='container mx-auto px-4 md:px-6'>
          <div className='text-center max-w-6xl mx-auto'>
            {/* 🏆 WORLD-CLASS ENTERPRISE TITLE */}
            <div ref={titleRef} className='mb-8 relative overflow-hidden'>
              {/* Dynamic background elements */}
              <div className='absolute inset-0 -z-10'>
                <div className='title-bg-orb absolute top-0 left-0 w-32 h-32 bg-linear-to-br from-emerald-300/20 to-green-300/20 rounded-full blur-3xl'></div>
                <div className='title-bg-orb absolute top-4 right-0 w-24 h-24 bg-linear-to-br from-yellow-300/20 to-amber-300/20 rounded-full blur-2xl'></div>
                <div className='title-bg-orb absolute bottom-0 left-1/3 w-28 h-28 bg-linear-to-br from-green-300/20 to-emerald-300/20 rounded-full blur-2xl'></div>
              </div>

              <h1 className='text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold leading-tight relative'>
                {/* First line - VPN-Enterprise with individual letter animations */}
                <span className='block text-gray-800 relative overflow-hidden'>
                  <span className='title-line-1 inline-block relative'>
                    {/* Individual letters for advanced animations */}
                    <span
                      className='title-letter inline-block transform'
                      data-letter='V'
                    >
                      V
                    </span>
                    <span
                      className='title-letter inline-block transform'
                      data-letter='P'
                    >
                      P
                    </span>
                    <span
                      className='title-letter inline-block transform'
                      data-letter='N'
                    >
                      N
                    </span>
                    <span
                      className='title-letter inline-block transform text-emerald-600'
                      data-letter='-'
                    >
                      -
                    </span>
                    <span
                      className='title-letter inline-block transform'
                      data-letter='E'
                    >
                      E
                    </span>
                    <span
                      className='title-letter inline-block transform'
                      data-letter='n'
                    >
                      n
                    </span>
                    <span
                      className='title-letter inline-block transform'
                      data-letter='t'
                    >
                      t
                    </span>
                    <span
                      className='title-letter inline-block transform'
                      data-letter='e'
                    >
                      e
                    </span>
                    <span
                      className='title-letter inline-block transform'
                      data-letter='r'
                    >
                      r
                    </span>
                    <span
                      className='title-letter inline-block transform'
                      data-letter='p'
                    >
                      p
                    </span>
                    <span
                      className='title-letter inline-block transform'
                      data-letter='r'
                    >
                      r
                    </span>
                    <span
                      className='title-letter inline-block transform'
                      data-letter='i'
                    >
                      i
                    </span>
                    <span
                      className='title-letter inline-block transform'
                      data-letter='s'
                    >
                      s
                    </span>
                    <span
                      className='title-letter inline-block transform'
                      data-letter='e'
                    >
                      e
                    </span>

                    {/* Decorative elements */}
                    <div className='title-crown absolute -top-4 left-0 w-6 h-6 text-yellow-500 opacity-0'>
                      👑
                    </div>
                    <div className='title-sparkle absolute -top-2 right-4 w-4 h-4 text-emerald-500 opacity-0'>
                      ✨
                    </div>
                  </span>
                </span>

                {/* Second line - VPN Platform with morphing gradient */}
                <span className='block relative overflow-hidden mt-2'>
                  <span className='title-line-2 inline-block transform bg-linear-to-br from-emerald-600 via-green-600 to-yellow-600 bg-clip-text text-transparent relative'>
                    <span
                      className='title-word inline-block transform'
                      data-word='VPN'
                    >
                      VPN
                    </span>
                    <span className='title-separator inline-block mx-3 text-green-500 transform scale-150'>
                      ⚡
                    </span>
                    <span
                      className='title-word inline-block transform'
                      data-word='Platform'
                    >
                      Platform
                    </span>

                    {/* Animated underline */}
                    <div className='title-underline absolute -bottom-2 left-0 h-1 bg-linear-to-br from-emerald-500 via-green-500 to-yellow-500 rounded-full transform origin-left scale-x-0'></div>

                    {/* Floating particles */}
                    <div className='title-particle absolute top-0 left-1/4 w-2 h-2 bg-emerald-400 rounded-full opacity-0'></div>
                    <div className='title-particle absolute top-4 right-1/3 w-1 h-1 bg-yellow-400 rounded-full opacity-0'></div>
                    <div className='title-particle absolute -top-2 right-1/4 w-1.5 h-1.5 bg-green-400 rounded-full opacity-0'></div>
                  </span>
                </span>

                {/* Holographic overlay */}
                <div className='title-holo absolute inset-0 bg-linear-to-br from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full opacity-0'></div>

                {/* Premium badge */}
                <div className='title-badge absolute -top-6 -right-2 px-3 py-1 bg-linear-to-br from-yellow-400 to-amber-500 text-gray-800 text-xs font-bold rounded-full transform rotate-12 scale-0 shadow-lg'>
                  AWARD WINNING
                </div>
              </h1>

              {/* Subtitle enhancement */}
              <div className='title-subtitle mt-4 opacity-0 transform translate-y-4'>
                <p className='text-lg md:text-xl text-gray-600 font-medium'>
                  <span className='inline-block bg-linear-to-br from-emerald-600 to-green-600 bg-clip-text text-transparent font-semibold'>
                    Enterprise-Grade
                  </span>{' '}
                  • Security • Performance • Innovation
                </p>
              </div>
            </div>

            {/* Platform Description */}
            <p
              ref={subtitleRef}
              className='text-lg sm:text-xl md:text-2xl text-gray-700 mb-8 max-w-4xl mx-auto leading-relaxed px-4'
            >
              The complete infrastructure platform for businesses that need
              <span className='text-emerald-600 font-semibold'>
                {' '}
                secure VPN
              </span>
              ,
              <span className='text-green-600 font-semibold'>
                {' '}
                reliable databases
              </span>
              , and
              <span className='text-yellow-600 font-semibold'>
                {' '}
                scalable hosting
              </span>
              . All in one enterprise-grade solution.
            </p>

            {/* Enterprise Feature Badges */}
            <div className='flex flex-wrap justify-center gap-4 mb-12'>
              {[
                {
                  icon: ShieldCheck,
                  text: 'Military-Grade Security',
                  color: 'from-emerald-500 to-green-600',
                },
                {
                  icon: Zap,
                  text: 'High Performance',
                  color: 'from-yellow-500 to-amber-600',
                },
                {
                  icon: GlobeLock,
                  text: 'Global Network',
                  color: 'from-green-500 to-emerald-600',
                },
                {
                  icon: DatabaseZap,
                  text: 'Managed Databases',
                  color: 'from-lime-500 to-green-600',
                },
                {
                  icon: ServerCog,
                  text: 'Auto-Scaling Hosting',
                  color: 'from-amber-500 to-yellow-600',
                },
              ].map((item, index) => (
                <div key={index} className='feature-badge group'>
                  <div className='relative flex items-center gap-3 bg-white/70 backdrop-blur-sm border border-emerald-200 rounded-full px-5 py-2.5 group-hover:border-emerald-400/70 transition-all duration-300 shadow-lg'>
                    <div
                      className={`p-1.5 rounded-lg bg-linear-to-br ${item.color} bg-opacity-20`}
                    >
                      <item.icon className='h-4 w-4 text-gray-700' />
                    </div>
                    <span className='text-gray-800 font-medium text-sm'>
                      {item.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div
              ref={ctaRef}
              className='flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center'
            >
              <Button
                size='lg'
                className='group text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-6 bg-linear-to-br from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-xl hover:shadow-emerald-500/25 transition-all duration-300 w-full sm:w-auto'
                onClick={handleDashboardClick}
                disabled={dashboardButtonDisabled}
                data-magnetic
              >
                <div className='flex items-center'>
                  {dashboardButtonDisabled ? (
                    <Loader2 className='h-5 w-5 animate-spin mr-3' />
                  ) : isAuthenticated ? (
                    <>
                      <Server className='h-5 w-5 mr-3' />
                      Go to Dashboard
                    </>
                  ) : (
                    <>
                      <Rocket className='h-5 w-5 mr-3' />
                      Start Free Trial
                    </>
                  )}
                </div>
              </Button>

              <Link href='#services'>
                <Button
                  variant='outline'
                  size='lg'
                  className='text-lg px-12 py-6 bg-white/70 border-2 border-emerald-300 hover:border-emerald-500/70 text-gray-800 backdrop-blur-sm transition-all duration-300 shadow-lg'
                >
                  <Eye className='h-5 w-5 mr-3' />
                  View Services
                </Button>
              </Link>
            </div>

            {/* Enterprise Metrics */}
            <div className='mt-12 md:mt-20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6'>
              {[
                {
                  number: '10,000+',
                  label: 'VPN Connections',
                  icon: UsersRound,
                  color: 'text-emerald-600',
                },
                {
                  number: '99.99%',
                  label: 'Uptime SLA',
                  icon: TrendingUp,
                  color: 'text-green-600',
                },
                {
                  number: '256-bit',
                  label: 'Encryption',
                  icon: LockKeyhole,
                  color: 'text-yellow-600',
                },
                {
                  number: '<20ms',
                  label: 'Avg Latency',
                  icon: Zap,
                  color: 'text-amber-600',
                },
              ].map((stat, index) => (
                <div
                  key={index}
                  className='text-center p-6 bg-white/60 backdrop-blur-sm border border-emerald-200 rounded-xl hover:border-emerald-400/50 transition-all duration-300 shadow-lg'
                >
                  <stat.icon className={`h-8 w-8 mx-auto mb-3 ${stat.color}`} />
                  <div className='metric-number text-3xl font-bold text-gray-800 mb-1'>
                    {stat.number}
                  </div>
                  <div className='text-gray-600 text-sm font-medium'>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 🛡️ SERVICES SECTION */}
      <div id='services' className='relative py-24' ref={servicesRef}>
        <div className='absolute inset-0 bg-linear-to-b from-transparent via-slate-900/20 to-transparent'></div>

        <div className='container mx-auto px-6 relative z-10'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl md:text-5xl font-bold text-gray-800 mb-6'>
              Complete Enterprise Infrastructure
            </h2>
            <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
              Everything your business needs in one platform. Secure, reliable,
              and scalable.
            </p>
          </div>

          {/* VPN Service */}
          <div className='mb-20'>
            <div className='flex items-center gap-4 mb-8'>
              <div className='p-3 bg-linear-to-br from-emerald-400/30 to-green-500/30 rounded-xl border border-emerald-400/40 shadow-lg'>
                <Shield className='h-8 w-8 text-emerald-700' />
              </div>
              <div>
                <h3 className='text-3xl font-bold text-gray-800'>
                  Enterprise VPN
                </h3>
                <p className='text-gray-600'>
                  Secure remote access for your entire organization
                </p>
              </div>
            </div>

            <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6'>
              {[
                {
                  icon: LockKeyhole,
                  title: '256-bit Encryption',
                  desc: 'Military-grade security for all connections',
                },
                {
                  icon: GlobeLock,
                  title: 'Global Servers',
                  desc: '100+ locations worldwide',
                },
                {
                  icon: UsersRound,
                  title: 'Team Management',
                  desc: 'Centralized user & access control',
                },
                {
                  icon: Activity,
                  title: 'Real-time Monitoring',
                  desc: 'Live connection analytics & alerts',
                },
              ].map((feature, index) => (
                <Card
                  key={index}
                  className='service-card bg-white/60 border-emerald-200 backdrop-blur-sm shadow-lg'
                >
                  <CardHeader className='p-6'>
                    <feature.icon className='h-10 w-10 text-emerald-600 mb-4' />
                    <CardTitle className='text-gray-800 text-lg'>
                      {feature.title}
                    </CardTitle>
                    <CardDescription className='text-gray-600'>
                      {feature.desc}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* Database Service */}
          <div className='mb-20'>
            <div className='flex items-center gap-4 mb-8'>
              <div className='p-3 bg-linear-to-br from-green-400/30 to-emerald-500/30 rounded-xl border border-green-400/40 shadow-lg'>
                <Database className='h-8 w-8 text-green-700' />
              </div>
              <div>
                <h3 className='text-3xl font-bold text-gray-800'>
                  Managed Databases
                </h3>
                <p className='text-gray-600'>
                  Production-ready databases with automated management
                </p>
              </div>
            </div>

            <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6'>
              {[
                {
                  icon: DatabaseZap,
                  title: 'Auto-scaling',
                  desc: 'Automatically scales with your workload',
                },
                {
                  icon: ShieldCheck,
                  title: 'Daily Backups',
                  desc: 'Automatic backups & point-in-time recovery',
                },
                {
                  icon: Zap,
                  title: 'High Performance',
                  desc: 'SSD storage & optimized queries',
                },
                {
                  icon: Settings,
                  title: 'Managed Updates',
                  desc: 'Automatic security & performance updates',
                },
              ].map((feature, index) => (
                <Card
                  key={index}
                  className='service-card bg-white/60 border-green-200 backdrop-blur-sm shadow-lg'
                >
                  <CardHeader className='p-6'>
                    <feature.icon className='h-10 w-10 text-green-600 mb-4' />
                    <CardTitle className='text-gray-800 text-lg'>
                      {feature.title}
                    </CardTitle>
                    <CardDescription className='text-gray-600'>
                      {feature.desc}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* Hosting Service */}
          <div className='mb-20'>
            <div className='flex items-center gap-4 mb-8'>
              <div className='p-3 bg-linear-to-br from-yellow-400/30 to-amber-500/30 rounded-xl border border-yellow-400/40 shadow-lg'>
                <Server className='h-8 w-8 text-yellow-700' />
              </div>
              <div>
                <h3 className='text-3xl font-bold text-gray-800'>
                  Cloud Hosting
                </h3>
                <p className='text-gray-600'>
                  Scalable web hosting with enterprise reliability
                </p>
              </div>
            </div>

            <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6'>
              {[
                {
                  icon: ServerCog,
                  title: 'Auto-scaling',
                  desc: 'Scale resources based on traffic',
                },
                {
                  icon: Globe,
                  title: 'Global CDN',
                  desc: 'Content delivery network included',
                },
                {
                  icon: Shield,
                  title: 'DDoS Protection',
                  desc: 'Enterprise-grade attack mitigation',
                },
                {
                  icon: Terminal,
                  title: 'One-click Deploy',
                  desc: 'Deploy from Git in seconds',
                },
              ].map((feature, index) => (
                <Card
                  key={index}
                  className='service-card bg-white/60 border-yellow-200 backdrop-blur-sm shadow-lg'
                >
                  <CardHeader className='p-6'>
                    <feature.icon className='h-10 w-10 text-yellow-600 mb-4' />
                    <CardTitle className='text-gray-800 text-lg'>
                      {feature.title}
                    </CardTitle>
                    <CardDescription className='text-gray-600'>
                      {feature.desc}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 💰 PRICING SECTION - FIXED & CENTERED */}
      <div className='py-24 bg-linear-to-b from-green-50/50 to-yellow-50/50'>
        <div className='container mx-auto px-6'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl md:text-5xl font-bold text-gray-800 mb-6'>
              Simple, Transparent Pricing
            </h2>
            <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
              Everything you need. No hidden fees. Scale as you grow.
            </p>
          </div>

          <div className='grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto'>
            {/* Starter Plan */}
            <div className='service-card group'>
              <Card className='relative bg-white/70 backdrop-blur-sm border border-emerald-200 group-hover:border-emerald-400/70 transition-all duration-500 h-full shadow-lg'>
                <CardHeader className='p-8'>
                  <CardTitle className='text-gray-800 text-2xl font-bold mb-2'>
                    Starter
                  </CardTitle>
                  <div className='text-3xl font-bold text-emerald-600 mb-6'>
                    $9<span className='text-lg text-gray-600'>/month</span>
                  </div>
                  <p className='text-gray-600 mb-6'>
                    Perfect for small teams and projects
                  </p>
                  <ul className='space-y-3 text-gray-700 text-sm'>
                    <li className='flex items-center gap-2'>
                      <CheckCircle className='h-4 w-4 text-emerald-600' />
                      <span>3 VPN connections</span>
                    </li>
                    <li className='flex items-center gap-2'>
                      <CheckCircle className='h-4 w-4 text-emerald-600' />
                      <span>1GB database storage</span>
                    </li>
                    <li className='flex items-center gap-2'>
                      <CheckCircle className='h-4 w-4 text-emerald-600' />
                      <span>10GB object storage</span>
                    </li>
                    <li className='flex items-center gap-2'>
                      <CheckCircle className='h-4 w-4 text-emerald-600' />
                      <span>Basic web hosting</span>
                    </li>
                  </ul>
                </CardHeader>
                <div className='p-8 pt-0'>
                  <Button className='w-full bg-linear-to-br from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700'>
                    Get Started
                  </Button>
                </div>
              </Card>
            </div>

            {/* Professional Plan - CENTERED & HIGHLIGHTED */}
            <div
              className='service-card group lg:scale-105 lg:-translate-y-2 z-10'
              data-magnetic
            >
              <div className='absolute -inset-1 bg-linear-to-br from-emerald-500 to-green-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500'></div>
              <Card className='relative bg-white/80 backdrop-blur-sm border-2 border-emerald-500 group-hover:border-green-500 transition-all duration-500 h-full shadow-xl'>
                <div className='absolute -top-3 left-1/2 transform -translate-x-1/2'>
                  <Badge className='bg-linear-to-br from-emerald-500 to-green-500 text-white border-0'>
                    Most Popular
                  </Badge>
                </div>
                <CardHeader className='p-8'>
                  <CardTitle className='text-gray-800 text-2xl font-bold mb-2'>
                    Professional
                  </CardTitle>
                  <div className='text-4xl font-bold bg-linear-to-br from-emerald-600 to-green-600 bg-clip-text text-transparent mb-6'>
                    $29<span className='text-xl text-gray-600'>/month</span>
                  </div>
                  <p className='text-gray-600 mb-6'>
                    Ideal for growing businesses
                  </p>
                  <ul className='space-y-3 text-gray-700 text-sm'>
                    <li className='flex items-center gap-2'>
                      <Sparkles className='h-4 w-4 text-green-600' />
                      <span className='font-semibold'>10 VPN connections</span>
                    </li>
                    <li className='flex items-center gap-2'>
                      <Sparkles className='h-4 w-4 text-green-600' />
                      <span className='font-semibold'>
                        10GB database storage
                      </span>
                    </li>
                    <li className='flex items-center gap-2'>
                      <Sparkles className='h-4 w-4 text-green-600' />
                      <span className='font-semibold'>
                        100GB object storage
                      </span>
                    </li>
                    <li className='flex items-center gap-2'>
                      <Sparkles className='h-4 w-4 text-green-600' />
                      <span className='font-semibold'>
                        Advanced hosting features
                      </span>
                    </li>
                    <li className='flex items-center gap-2'>
                      <Sparkles className='h-4 w-4 text-green-600' />
                      <span className='font-semibold'>Priority support</span>
                    </li>
                  </ul>
                </CardHeader>
                <div className='p-8 pt-0'>
                  <Button
                    className='w-full bg-linear-to-br from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg'
                    onClick={handleDashboardClick}
                  >
                    <Rocket className='h-4 w-4 mr-2' />
                    Start Free Trial
                  </Button>
                </div>
              </Card>
            </div>

            {/* Enterprise Plan */}
            <div className='service-card group'>
              <Card className='relative bg-white/70 backdrop-blur-sm border border-yellow-200 group-hover:border-yellow-400/70 transition-all duration-500 h-full shadow-lg'>
                <CardHeader className='p-8'>
                  <CardTitle className='text-gray-800 text-2xl font-bold mb-2'>
                    Enterprise
                  </CardTitle>
                  <div className='text-3xl font-bold text-yellow-600 mb-6'>
                    $99<span className='text-lg text-gray-600'>/month</span>
                  </div>
                  <p className='text-gray-600 mb-6'>For large organizations</p>
                  <ul className='space-y-3 text-gray-700 text-sm'>
                    <li className='flex items-center gap-2'>
                      <CheckCircle className='h-4 w-4 text-yellow-600' />
                      <span>Unlimited VPN connections</span>
                    </li>
                    <li className='flex items-center gap-2'>
                      <CheckCircle className='h-4 w-4 text-yellow-600' />
                      <span>100GB database storage</span>
                    </li>
                    <li className='flex items-center gap-2'>
                      <CheckCircle className='h-4 w-4 text-yellow-600' />
                      <span>1TB object storage</span>
                    </li>
                    <li className='flex items-center gap-2'>
                      <CheckCircle className='h-4 w-4 text-yellow-600' />
                      <span>Dedicated support manager</span>
                    </li>
                  </ul>
                </CardHeader>
                <div className='p-8 pt-0'>
                  <Button className='w-full bg-linear-to-br from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700'>
                    Contact Sales
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* Data Flow Visualization */}
          <div className='mt-16 relative h-32 overflow-hidden rounded-xl border border-emerald-300 bg-white/30 shadow-lg'>
            {/* Data packets animation */}
            <div className='absolute inset-0'>
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className='data-packet absolute w-3 h-2 bg-linear-to-br from-emerald-500 to-green-500 rounded'
                  style={{
                    left: `${i * 8}%`,
                    top: `${30 + Math.sin(i) * 20}%`,
                    animationDelay: `${i * 0.5}s`,
                  }}
                />
              ))}
            </div>
            <div className='absolute inset-0 flex items-center justify-center'>
              <div className='text-center'>
                <div className='flex items-center justify-center gap-2 mb-2'>
                  <Download className='h-4 w-4 text-emerald-600' />
                  <span className='text-gray-700 text-sm'>
                    Encrypted Data Flow
                  </span>
                  <Upload className='h-4 w-4 text-green-600' />
                </div>
                <p className='text-gray-600 text-sm'>
                  All plans include end-to-end encryption
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📈 ENTERPRISE TIMELINE */}
      <div ref={timelineContainerRef} className='py-24'>
        <div className='container mx-auto px-6'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl font-bold text-gray-800 mb-6'>
              Trusted by Growing Businesses
            </h2>
            <p className='text-xl text-gray-600'>
              Join thousands of companies that trust our platform
            </p>
          </div>

          <div className='relative max-w-4xl mx-auto'>
            <div className='absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-linear-to-b from-emerald-500 via-green-500 to-transparent'></div>

            {[
              {
                year: 'Startups',
                title: 'Launch Quickly',
                description:
                  'Get your secure infrastructure running in minutes, not weeks',
                icon: Rocket,
                side: 'left',
                stats: '500+ startups launched',
              },
              {
                year: 'Scale-ups',
                title: 'Grow Without Limits',
                description:
                  'Automatically scale VPN, databases, and hosting as you grow',
                icon: TrendingUp,
                side: 'right',
                stats: '99.99% uptime guarantee',
              },
              {
                year: 'Enterprise',
                title: 'Enterprise Security',
                description:
                  'Military-grade encryption and compliance for large organizations',
                icon: ShieldCheck,
                side: 'left',
                stats: 'SOC 2 Type II compliant',
              },
            ].map((item, index) => (
              <div
                key={index}
                className={`relative mb-12 ${item.side === 'left' ? 'pr-[55%]' : 'pl-[55%]'} ${item.side === 'left' ? 'text-right' : ''}`}
              >
                <div
                  className={`absolute top-0 ${item.side === 'left' ? 'right-0' : 'left-0'} transform ${item.side === 'left' ? 'translate-x-1/2' : '-translate-x-1/2'}`}
                >
                  <div className='w-8 h-8 bg-linear-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center'>
                    <item.icon className='h-4 w-4 text-white' />
                  </div>
                </div>
                <div
                  className={`bg-white/70 backdrop-blur-sm border border-emerald-200 rounded-xl p-6 shadow-lg ${item.side === 'left' ? 'mr-8' : 'ml-8'}`}
                >
                  <div className='text-emerald-600 font-bold text-sm mb-1'>
                    {item.year}
                  </div>
                  <h3 className='text-gray-800 text-xl font-bold mb-2'>
                    {item.title}
                  </h3>
                  <p className='text-gray-600 mb-3'>{item.description}</p>
                  <div className='text-green-600 text-sm font-medium'>
                    {item.stats}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🏢 TECH STACK */}
      <div className='py-24 bg-linear-to-b from-yellow-50/50 to-green-50/50'>
        <div className='container mx-auto px-6'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl font-bold text-gray-800 mb-6'>
              Enterprise Technology Stack
            </h2>
            <p className='text-xl text-gray-600'>
              Built with proven technologies for maximum reliability
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8'>
            {[
              {
                icon: Shield,
                title: 'Security Core',
                items: [
                  'WireGuard Protocol',
                  '256-bit Encryption',
                  'Zero Trust Network',
                  'Audit Logging',
                ],
                color: 'from-blue-500 to-cyan-500',
              },
              {
                icon: Database,
                title: 'Database Engine',
                items: [
                  'PostgreSQL',
                  'Automatic Backups',
                  'Read Replicas',
                  'Query Optimization',
                ],
                color: 'from-purple-500 to-violet-500',
              },
              {
                icon: Server,
                title: 'Hosting Platform',
                items: [
                  'Docker Containers',
                  'Global CDN',
                  'Auto-scaling',
                  'Load Balancing',
                ],
                color: 'from-cyan-500 to-blue-500',
              },
              {
                icon: Settings,
                title: 'Management',
                items: [
                  'Centralized Dashboard',
                  'Team Collaboration',
                  'API Access',
                  'Monitoring',
                ],
                color: 'from-green-500 to-emerald-500',
              },
            ].map((stack, index) => (
              <Card
                key={index}
                className='bg-white/70 border-emerald-200 backdrop-blur-sm shadow-lg'
              >
                <CardHeader className='p-6'>
                  <div
                    className={`p-3 bg-linear-to-br ${stack.color} bg-opacity-20 rounded-xl w-fit mb-4`}
                  >
                    <stack.icon className='h-8 w-8 text-gray-700' />
                  </div>
                  <CardTitle className='text-gray-800 text-lg mb-4'>
                    {stack.title}
                  </CardTitle>
                  <CardContent className='p-0 space-y-2'>
                    {stack.items.map((item, i) => (
                      <div key={i} className='flex items-center gap-2'>
                        <div className='w-1.5 h-1.5 rounded-full bg-emerald-500'></div>
                        <p className='text-gray-600 text-sm'>{item}</p>
                      </div>
                    ))}
                  </CardContent>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* 🚀 FINAL CTA */}
      <div className='py-24'>
        <div className='container mx-auto px-6'>
          <div className='max-w-4xl mx-auto'>
            <div className='text-center bg-linear-to-br from-white/70 to-green-50/70 backdrop-blur-sm rounded-2xl p-12 border border-emerald-200 shadow-xl'>
              <h2 className='text-4xl md:text-5xl font-bold text-gray-800 mb-6'>
                Ready to Secure Your Infrastructure?
              </h2>
              <p className='text-xl text-gray-700 mb-8 max-w-2xl mx-auto'>
                Join thousands of businesses that trust VPN Enterprise for their
                critical infrastructure needs.
              </p>

              <div className='flex flex-col sm:flex-row gap-6 justify-center items-center'>
                <Button
                  size='lg'
                  className='text-lg px-12 py-6 bg-linear-to-br from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-xl hover:shadow-emerald-500/25'
                  onClick={handleDashboardClick}
                  disabled={dashboardButtonDisabled}
                >
                  {dashboardButtonDisabled ? (
                    <span className='flex items-center gap-2'>
                      <Loader2 className='h-5 w-5 animate-spin' /> Loading...
                    </span>
                  ) : (
                    <span className='flex items-center gap-3'>
                      <Rocket className='h-5 w-5' />
                      {isAuthenticated ? 'Go to Dashboard' : 'Start Free Trial'}
                    </span>
                  )}
                </Button>

                <div className='text-center'>
                  <p className='text-gray-600 text-lg'>
                    No credit card required
                  </p>
                  <p className='text-gray-500 text-sm'>
                    Free 14-day trial • Cancel anytime
                  </p>
                </div>
              </div>

              <div className='grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-12 opacity-80'>
                <div className='text-center'>
                  <ShieldCheck className='h-8 w-8 text-emerald-600 mx-auto mb-2' />
                  <p className='text-gray-600 text-sm'>Enterprise Security</p>
                </div>
                <div className='text-center'>
                  <Zap className='h-8 w-8 text-yellow-600 mx-auto mb-2' />
                  <p className='text-gray-600 text-sm'>High Performance</p>
                </div>
                <div className='text-center'>
                  <Globe className='h-8 w-8 text-green-600 mx-auto mb-2' />
                  <p className='text-gray-600 text-sm'>Global Network</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✨ PREMIUM INTERACTIVE FEATURES */}
      <LiveMetrics />
      <InteractiveNetworkMap />
      <CustomerTestimonials />
      <VPNConnectionSimulator />
      <SpeedTestWidget />
      <SecurityScanner />

      {/* 🤝 TRUSTED BY ENTERPRISES */}
      <div
        ref={brandsRef}
        className='py-16 bg-linear-to-b from-white via-green-50/30 to-yellow-50/30'
      >
        <div className='container mx-auto px-6'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl md:text-4xl font-bold text-gray-800 mb-4'>
              Trusted by Leading Enterprises
            </h2>
            <p className='text-xl text-gray-600 font-medium mb-2'>
              Join thousands of companies worldwide
            </p>
            <div className='w-24 h-1 bg-linear-to-br from-emerald-500 to-green-500 mx-auto rounded-full'></div>
          </div>

          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-8 items-center justify-items-center max-w-6xl mx-auto'>
            {/* Brand Logo 1 - Microsoft */}
            <div className='brand-logo group'>
              <div className='relative p-8 bg-white/80 rounded-2xl border border-emerald-100 shadow-lg hover:shadow-2xl transition-all duration-500 backdrop-blur-sm group-hover:border-emerald-300/50'>
                <div className='absolute inset-0 bg-linear-to-br from-emerald-50/50 to-green-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>
                <div className='relative w-20 h-20 flex items-center justify-center'>
                  <svg viewBox='0 0 23 23' className='w-12 h-12'>
                    <path fill='#f25022' d='M1 1h10v10H1z' />
                    <path fill='#00a4ef' d='M12 1h10v10H12z' />
                    <path fill='#7fba00' d='M1 12h10v10H1z' />
                    <path fill='#ffb900' d='M12 12h10v10H12z' />
                  </svg>
                </div>
              </div>
            </div>

            {/* Brand Logo 2 - Amazon */}
            <div className='brand-logo group'>
              <div className='relative p-8 bg-white/80 rounded-2xl border border-green-100 shadow-lg hover:shadow-2xl transition-all duration-500 backdrop-blur-sm group-hover:border-green-300/50'>
                <div className='absolute inset-0 bg-linear-to-br from-green-50/50 to-yellow-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>
                <div className='relative w-20 h-20 flex items-center justify-center'>
                  <svg viewBox='0 0 200 60' className='w-16 h-8'>
                    <path
                      fill='#ff9900'
                      d='M20.1 35.4c-6.3 4.7-15.4 7.2-23.2 7.2-11 0-20.9-4.1-28.4-10.9-.6-.5-.1-1.3.7-.9 8.8 5.1 19.6 8.2 30.8 8.2 7.5 0 15.8-1.6 23.4-4.8 1.1-.5 2.1.8.9 1.6z'
                    />
                    <path
                      fill='#ff9900'
                      d='M22.6 32.7c-.8-1-5.3-.5-7.3-.2-.6.1-.7-.4-.2-.8 3.6-2.5 9.4-1.8 10.1-.9.7.8-.2 6.7-3.5 9.5-.5.4-1-.2-.8-.7.8-1.9 2.5-6.1 1.7-6.9z'
                    />
                    <text
                      x='50'
                      y='25'
                      fill='#232F3E'
                      fontSize='18'
                      fontFamily='Arial'
                      fontWeight='bold'
                    >
                      amazon
                    </text>
                  </svg>
                </div>
              </div>
            </div>

            {/* Brand Logo 3 - Google */}
            <div className='brand-logo group'>
              <div className='relative p-8 bg-white/80 rounded-2xl border border-yellow-100 shadow-lg hover:shadow-2xl transition-all duration-500 backdrop-blur-sm group-hover:border-yellow-300/50'>
                <div className='absolute inset-0 bg-linear-to-br from-yellow-50/50 to-amber-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>
                <div className='relative w-20 h-20 flex items-center justify-center'>
                  <svg viewBox='0 0 24 24' className='w-12 h-12'>
                    <path
                      fill='#4285f4'
                      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                    />
                    <path
                      fill='#34a853'
                      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                    />
                    <path
                      fill='#fbbc05'
                      d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                    />
                    <path
                      fill='#ea4335'
                      d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Brand Logo 4 - Apple */}
            <div className='brand-logo group'>
              <div className='relative p-8 bg-white/80 rounded-2xl border border-emerald-100 shadow-lg hover:shadow-2xl transition-all duration-500 backdrop-blur-sm group-hover:border-emerald-300/50'>
                <div className='absolute inset-0 bg-linear-to-br from-emerald-50/50 to-green-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>
                <div className='relative w-20 h-20 flex items-center justify-center'>
                  <svg viewBox='0 0 24 24' className='w-12 h-12'>
                    <path
                      fill='#000000'
                      d='M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z'
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Brand Logo 5 - Netflix */}
            <div className='brand-logo group'>
              <div className='relative p-8 bg-white/80 rounded-2xl border border-red-100 shadow-lg hover:shadow-2xl transition-all duration-500 backdrop-blur-sm group-hover:border-red-300/50'>
                <div className='absolute inset-0 bg-linear-to-br from-red-50/50 to-rose-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>
                <div className='relative w-20 h-20 flex items-center justify-center'>
                  <svg viewBox='0 0 1024 276.742' className='w-16 h-8'>
                    <path
                      fill='#e50914'
                      d='M140.803 258.904c-15.404 2.705-31.079 3.516-47.294 5.676l-49.458-144.856v151.073c-15.404 1.621-29.457 3.783-44.051 5.945v-276.742h41.08l56.212 157.021v-157.021h43.511v258.904zm85.131-157.558c16.757 0 42.431-.811 57.835-.811v43.24c-19.189 0-41.619 0-57.835.811v64.322c25.405-1.621 50.809-3.785 76.482-4.596v41.617l-119.724 9.461v-255.39h119.724v43.241h-76.482v58.105zm237.284-58.104h-44.862v198.908c-14.594 0-29.188 0-43.239.539v-199.447h-44.862v-43.242h132.965l-.002 43.242zm70.266 55.132h59.187v43.24h-59.187v98.104h-42.433v-239.718h120.808v43.241h-78.375v55.133zm148.641 103.507c24.594.539 49.456 2.434 73.51 3.783v42.701c-38.646-2.434-77.293-4.863-116.75-5.676v-242.689h43.24v201.881zm109.994 49.457c13.783.812 28.377 1.623 42.43 3.242v-254.58h-42.43v251.338zm231.881-251.338l-54.863 131.615 54.863 145.127c-16.217-2.162-32.432-5.135-48.648-7.838l-31.078-79.994-31.617 73.51c-15.678-2.705-30.812-3.516-46.484-5.678l55.672-126.75-50.269-129.992h46.482l28.377 72.699 30.27-72.699h47.295z'
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Brand Logo 6 - Tesla */}
            <div className='brand-logo group'>
              <div className='relative p-8 bg-white/80 rounded-2xl border border-red-100 shadow-lg hover:shadow-2xl transition-all duration-500 backdrop-blur-sm group-hover:border-red-300/50'>
                <div className='absolute inset-0 bg-linear-to-br from-red-50/50 to-rose-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>
                <div className='relative w-20 h-20 flex items-center justify-center'>
                  <svg viewBox='0 0 342 35' className='w-16 h-6'>
                    <path
                      fill='#cc0000'
                      d='M0 .1a9.7 9.7 0 0 0 7 7h11l.5.1v27.6h6.8V7.3L26 7h11a9.8 9.8 0 0 0 7-7H0zm238.6 0h-6.8v34.8H238.6a9.7 9.7 0 0 0 8.7-6.2 9.8 9.8 0 0 0-8.7-6.2v-1.6h11.5v-6.8h-11.5zm-52.3 6.8c3.6-1 6.6-3.8 7.4-6.9l-38.1.1v20.6h31.1v7.2h-24.4a13.6 13.6 0 0 0-8.7 7h39.9v-21h-31.2v-7zm116.2 28h6.7v-14h24.6v14h6.7v-21h-37.9v21zM85.3 7h26a9.6 9.6 0 0 0 7.1-7H78.3a9.6 9.6 0 0 0 7 7zm0 13.8h26a9.6 9.6 0 0 0 7.1-7H78.3a9.6 9.6 0 0 0 7 7zm0 14.1h26a9.6 9.6 0 0 0 7.1-7H78.3a9.6 9.6 0 0 0 7 7zM308.5 7h26a9.6 9.6 0 0 0 7-7h-40.1a9.6 9.6 0 0 0 7.1 7z'
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Elegant decorative line */}
          <div className='flex items-center justify-center mt-12'>
            <div className='flex-1 h-px bg-linear-to-br from-transparent via-emerald-200 to-transparent max-w-md'></div>
            <div className='px-6'>
              <div className='w-2 h-2 rounded-full bg-linear-to-br from-emerald-400 to-green-400'></div>
            </div>
            <div className='flex-1 h-px bg-linear-to-br from-transparent via-emerald-200 to-transparent max-w-md'></div>
          </div>
        </div>
      </div>

      {/* 🏢 ENTERPRISE FOOTER */}
      <footer className='border-t border-emerald-200 bg-green-50/50 backdrop-blur-sm'>
        <div className='container mx-auto px-4 py-12'>
          <div className='grid md:grid-cols-5 gap-8 mb-8'>
            <div>
              <div className='flex items-center gap-3 mb-4'>
                <div className='p-2 bg-linear-to-br from-emerald-500 to-green-600 rounded-lg'>
                  <Shield className='h-6 w-6 text-white' />
                </div>
                <div>
                  <span className='text-xl font-bold text-gray-800'>
                    VPN Enterprise
                  </span>
                  <p className='text-gray-600 text-sm'>
                    Enterprise Infrastructure Platform
                  </p>
                </div>
              </div>
              <p className='text-gray-600'>
                Secure VPN, managed databases, and scalable hosting for
                businesses.
              </p>
              {/* Newsletter */}

              <div>
                <p className='text-gray-800 font-bold text-sm mt-5 mb-3'>
                  Subscribe to our newsletter
                </p>
                <div className='flex flex-col gap-2'>
                  <input
                    type='email'
                    placeholder='Your email address'
                    className='px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent'
                  />
                  <Button className='bg-emerald-600 hover:bg-emerald-700 text-white text-sm'>
                    Subscribe
                  </Button>
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className='text-gray-800 font-semibold mb-4'>Services</h4>
              <ul className='space-y-2 text-gray-600'>
                <li>
                  <Link
                    href='#services'
                    className='hover:text-emerald-600 transition-colors'
                  >
                    Enterprise VPN
                  </Link>
                </li>
                <li>
                  <Link
                    href='#services'
                    className='hover:text-emerald-600 transition-colors'
                  >
                    Managed Databases
                  </Link>
                </li>
                <li>
                  <Link
                    href='#services'
                    className='hover:text-emerald-600 transition-colors'
                  >
                    Cloud Hosting
                  </Link>
                </li>
                <li>
                  <Link
                    href='#services'
                    className='hover:text-emerald-600 transition-colors'
                  >
                    Object Storage
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className='text-gray-800 font-semibold mb-4'>Resources</h4>
              <ul className='space-y-2 text-gray-600'>
                <li>
                  <Link
                    href='/blog'
                    className='hover:text-emerald-600 transition-colors'
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href='/docs'
                    className='hover:text-emerald-600 transition-colors'
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    href='/docs/api/overview'
                    className='hover:text-emerald-600 transition-colors'
                  >
                    API Reference
                  </Link>
                </li>
                <li>
                  <Link
                    href='/contact'
                    className='hover:text-emerald-600 transition-colors'
                  >
                    Support
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className='text-gray-800 font-semibold mb-4'>Company</h4>
              <ul className='space-y-2 text-gray-600'>
                <li>
                  <Link
                    href='/about'
                    className='hover:text-emerald-600 transition-colors'
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href='/company'
                    className='hover:text-emerald-600 transition-colors'
                  >
                    Our Story
                  </Link>
                </li>
                <li>
                  <Link
                    href='/careers'
                    className='hover:text-emerald-600 transition-colors'
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href='/contact'
                    className='hover:text-emerald-600 transition-colors'
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Ifo */}
            <div>
              <h4 className='text-gray-800 font-semibold mb-4'>Contact Info</h4>

              {/* Contact Info */}
              <div className='space-y-3 text-gray-600 text-sm mb-6'>
                <div>
                  <p className='font-medium'>123 Fashion Street</p>
                  <p>Milan, Italy 20100</p>
                </div>
                <div>
                  <p className='font-medium'>+39 (333) 219-000-6</p>
                </div>
                <div>
                  <p className='font-medium'>info@mukulah.com</p>
                </div>
              </div>

              {/* Social Icons */}
              <div className='flex gap-3 mb-6 bg-green-700/70 p-2 rounded-lg shadow-sm '>
                <a
                  href='#'
                  className='p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all hover:bg-emerald-50 group'
                >
                  <svg
                    className='w-5 h-5 text-gray-600 group-hover:text-emerald-600'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path d='M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z' />
                  </svg>
                </a>
                <a
                  href='#'
                  className='p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all hover:bg-emerald-50 group'
                >
                  <svg
                    className='w-5 h-5 text-gray-600 group-hover:text-emerald-600'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' />
                  </svg>
                </a>
                <a
                  href='#'
                  className='p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all hover:bg-emerald-50 group'
                >
                  <svg
                    className='w-5 h-5 text-gray-600 group-hover:text-emerald-600'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' />
                  </svg>
                </a>
                <a
                  href='#'
                  className='p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all hover:bg-emerald-50 group'
                >
                  <svg
                    className='w-5 h-5 text-gray-600 group-hover:text-emerald-600'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path d='M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.11.222.081.343-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001.001 12.017z' />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className='border-t border-emerald-200 pt-8 flex flex-col md:flex-row justify-between items-center'>
            <p className='text-gray-600 text-center md:text-left'>
              VPN Enterprise Platform © 2025 | Built with Next.js, WireGuard &
              Enterprise Security
            </p>
            <div className='flex gap-6 mt-4 md:mt-0'>
              <Link
                href='#'
                className='text-gray-600 hover:text-emerald-600 transition-colors'
              >
                Privacy
              </Link>
              <Link
                href='#'
                className='text-gray-600 hover:text-emerald-600 transition-colors'
              >
                Terms
              </Link>
              <Link
                href='#'
                className='text-gray-600 hover:text-emerald-600 transition-colors'
              >
                Security
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}