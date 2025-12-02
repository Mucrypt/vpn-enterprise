"use client";

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Shield, Users, Globe, Award, TrendingUp, 
  ArrowLeft, Building, Target, Heart, Zap,
  CheckCircle, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function CompanyPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const valuesRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hero animation
    const tl = gsap.timeline();
    
    tl.from(titleRef.current, {
      duration: 1.2,
      y: 60,
      opacity: 0,
      ease: "power3.out"
    })
    .from(".company-subtitle", {
      duration: 1,
      y: 40,
      opacity: 0,
      ease: "power2.out"
    }, "-=0.6")
    .from(".company-description", {
      duration: 0.8,
      y: 30,
      opacity: 0,
      ease: "back.out(1.7)"
    }, "-=0.4");

    // Values cards animation
    gsap.fromTo(".value-card", {
      y: 50,
      opacity: 0,
      scale: 0.9
    }, {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.8,
      stagger: 0.2,
      ease: "back.out(1.7)",
      scrollTrigger: {
        trigger: valuesRef.current,
        start: "top 80%",
        toggleActions: "play none none none"
      }
    });

    // Stats counter animation
    gsap.fromTo(".stat-number", {
      textContent: "0",
      opacity: 0
    }, {
      textContent: (i: number, target: Element) => target.getAttribute('data-value'),
      opacity: 1,
      duration: 2,
      ease: "power2.out",
      snap: { textContent: 1 },
      stagger: 0.3,
      scrollTrigger: {
        trigger: statsRef.current,
        start: "top 80%",
        toggleActions: "play none none none"
      }
    });

    // Floating background elements
    gsap.to(".floating-element", {
      y: -20,
      duration: 3,
      ease: "power1.inOut",
      yoyo: true,
      repeat: -1,
      stagger: 0.5
    });

  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-white via-green-50 to-yellow-50">
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100/40 via-transparent to-yellow-100/40"></div>
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-emerald-300/40 to-green-300/40 rounded-full blur-3xl animate-pulse floating-element"></div>
        <div className="absolute bottom-32 right-32 w-80 h-80 bg-gradient-to-r from-yellow-300/35 to-amber-300/35 rounded-full blur-3xl animate-pulse floating-element"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-lg bg-white/60 border-b border-emerald-200/50">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 md:gap-4">
            <div className="p-2 md:p-3 bg-gradient-to-br from-emerald-50/90 to-green-50/90 rounded-xl border border-emerald-300/30">
              <Shield className="h-5 w-5 md:h-7 md:w-7 text-emerald-700" />
            </div>
            <span className="text-lg md:text-2xl font-black bg-gradient-to-r from-gray-800 via-emerald-700 to-yellow-600 bg-clip-text text-transparent">
              VPN Enterprise
            </span>
          </Link>
          
          <Link href="/">
            <Button variant="outline" className="border-emerald-300/30">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back Home
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div ref={heroRef} className="relative pt-32 pb-20 px-6">
        <div className="container mx-auto text-center max-w-4xl relative z-10">
          
          <h1 
            ref={titleRef}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-800 mb-6 leading-tight"
          >
            Our Company
          </h1>
          
          <p className="company-subtitle text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
            Building the future of enterprise security and infrastructure
          </p>
          
          <div className="company-description max-w-2xl mx-auto">
            <p className="text-lg text-gray-600 leading-relaxed">
              Founded with a vision to democratize enterprise-grade security, VPN Enterprise has grown 
              from a small team of passionate engineers to a global leader in secure infrastructure solutions.
            </p>
          </div>
        </div>
      </div>

      {/* Company Values */}
      <div ref={valuesRef} className="py-20 relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600">The principles that guide everything we do</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Shield,
                title: "Security First",
                description: "We prioritize security in every decision, ensuring our customers' data and privacy are always protected.",
                color: "from-blue-500 to-blue-600"
              },
              {
                icon: Heart,
                title: "Customer Obsession",
                description: "Our customers' success is our success. We listen, adapt, and continuously improve based on their needs.",
                color: "from-red-500 to-pink-600"
              },
              {
                icon: Zap,
                title: "Innovation",
                description: "We embrace cutting-edge technology and creative solutions to solve complex infrastructure challenges.",
                color: "from-yellow-500 to-orange-600"
              },
              {
                icon: Users,
                title: "Team Excellence",
                description: "We believe diverse, talented teams create the best products. Every voice matters in our mission.",
                color: "from-green-500 to-emerald-600"
              },
              {
                icon: Target,
                title: "Reliability",
                description: "We build systems that work when they matter most. Our infrastructure is designed for 99.99% uptime.",
                color: "from-purple-500 to-violet-600"
              },
              {
                icon: Globe,
                title: "Global Impact",
                description: "We're building technology that serves businesses worldwide, breaking down barriers to security.",
                color: "from-cyan-500 to-blue-600"
              }
            ].map((value, index) => (
              <Card key={index} className="value-card bg-white/70 border-emerald-200 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${value.color} flex items-center justify-center`}>
                    <value.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl text-gray-800">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-gray-600 leading-relaxed">
                    {value.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Company Stats */}
      <div ref={statsRef} className="py-20 bg-gradient-to-b from-green-50/50 to-yellow-50/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">By the Numbers</h2>
            <p className="text-xl text-gray-600">Our growth and impact</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { number: "50000", label: "Happy Customers", suffix: "+" },
              { number: "99", label: "Uptime SLA", suffix: ".9%" },
              { number: "100", label: "Global Locations", suffix: "+" },
              { number: "24", label: "Support Hours", suffix: "/7" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-emerald-600 mb-2">
                  <span className="stat-number" data-value={stat.number}>0</span>{stat.suffix}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission Statement */}
      <div className="py-20 relative z-10">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-800 mb-8">Our Mission</h2>
            <div className="bg-gradient-to-br from-white/70 to-green-50/70 backdrop-blur-sm rounded-2xl p-12 border border-emerald-200 shadow-xl">
              <blockquote className="text-2xl md:text-3xl text-gray-700 leading-relaxed italic mb-8">
                "To democratize enterprise-grade security and infrastructure, making it accessible 
                to businesses of all sizes while maintaining the highest standards of performance and reliability."
              </blockquote>
              <div className="flex items-center justify-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
                  <Building className="h-8 w-8 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-800">VPN Enterprise Team</div>
                  <div className="text-gray-600">Founded 2020</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Awards & Recognition */}
      <div className="py-20 bg-gradient-to-b from-white via-green-50/30 to-yellow-50/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Recognition</h2>
            <p className="text-xl text-gray-600">Industry awards and achievements</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                award: "Best Enterprise Security Solution",
                year: "2024",
                organization: "Tech Innovation Awards",
                icon: Award
              },
              {
                award: "Fastest Growing SaaS Company",
                year: "2023",
                organization: "Business Excellence Awards",
                icon: TrendingUp
              },
              {
                award: "Customer Choice Award",
                year: "2023",
                organization: "Enterprise Software Review",
                icon: Star
              }
            ].map((recognition, index) => (
              <Card key={index} className="bg-white/70 border-emerald-200 backdrop-blur-sm shadow-lg text-center">
                <CardHeader>
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
                    <recognition.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-lg text-gray-800">{recognition.award}</CardTitle>
                  <CardDescription className="text-emerald-600 font-semibold">{recognition.year}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{recognition.organization}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 bg-gradient-to-r from-emerald-600 to-green-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Join Our Journey
          </h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Be part of building the future of enterprise security and infrastructure.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/careers">
              <Button size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50">
                <Users className="h-5 w-5 mr-2" />
                View Careers
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Get in Touch
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-emerald-200 bg-green-50/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-800">VPN Enterprise</span>
            </Link>
            <p className="text-gray-600 mt-4">
              © 2025 VPN Enterprise. Building secure infrastructure for tomorrow.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
