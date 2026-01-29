"use client";

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Shield, ArrowLeft, Users, Globe, Heart, 
  Target, Lightbulb, Rocket, Award, 
  CheckCircle, Star, Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function AboutPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hero animation
    const tl = gsap.timeline();
    
    tl.from(titleRef.current, {
      duration: 1.2,
      y: 60,
      opacity: 0,
      ease: "power3.out"
    })
    .from(".about-subtitle", {
      duration: 1,
      y: 40,
      opacity: 0,
      ease: "power2.out"
    }, "-=0.6")
    .from(".about-description", {
      duration: 0.8,
      y: 30,
      opacity: 0,
      ease: "back.out(1.7)"
    }, "-=0.4");

    // Story section animation
    gsap.fromTo(".story-content", {
      y: 50,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      duration: 1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: storyRef.current,
        start: "top 80%",
        toggleActions: "play none none none"
      }
    });

    // Timeline animation
    gsap.fromTo(".timeline-item", {
      x: -50,
      opacity: 0
    }, {
      x: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.3,
      ease: "back.out(1.7)",
      scrollTrigger: {
        trigger: timelineRef.current,
        start: "top 80%",
        toggleActions: "play none none none"
      }
    });

    // Floating elements
    gsap.to(".floating-element", {
      y: -15,
      duration: 4,
      ease: "power1.inOut",
      yoyo: true,
      repeat: -1,
      stagger: 0.8
    });

  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      
      {/* Background */}
      <div className="fixed inset-0 bg-linear-to-br from-white via-green-50 to-yellow-50">
        <div className="absolute inset-0 bg-linear-to-tr from-emerald-100/40 via-transparent to-yellow-100/40"></div>
        <div className="absolute top-32 right-20 w-64 h-64 bg-linear-to-r from-emerald-300/30 to-green-300/30 rounded-full blur-3xl animate-pulse floating-element"></div>
        <div className="absolute bottom-40 left-32 w-80 h-80 bg-linear-to-r from-yellow-300/25 to-amber-300/25 rounded-full blur-3xl animate-pulse floating-element"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-lg bg-white/60 border-b border-emerald-200/50">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 md:gap-4">
            <div className="p-2 md:p-3 bg-linear-to-br from-emerald-50/90 to-green-50/90 rounded-xl border border-emerald-300/30">
              <Shield className="h-5 w-5 md:h-7 md:w-7 text-emerald-700" />
            </div>
            <span className="text-lg md:text-2xl font-black bg-linear-to-r from-gray-800 via-emerald-700 to-yellow-600 bg-clip-text text-transparent">
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
            About Us
          </h1>
          
          <p className="about-subtitle text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
            Pioneering the future of enterprise security and digital infrastructure
          </p>
          
          <div className="about-description max-w-2xl mx-auto">
            <p className="text-lg text-gray-600 leading-relaxed">
              We're not just another tech company. We're innovators, dreamers, and builders 
              creating solutions that make the digital world safer for everyone.
            </p>
          </div>
        </div>
      </div>

      {/* Our Story */}
      <div ref={storyRef} className="py-20 relative z-10">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">Our Story</h2>
              <p className="text-xl text-gray-600">From a small idea to global impact</p>
            </div>

            <div className="story-content bg-linear-to-br from-white/70 to-green-50/70 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-emerald-200 shadow-xl">
              <div className="prose prose-lg max-w-none text-gray-700">
                <p className="text-xl leading-relaxed mb-6">
                  It all started in 2020 when our founders, a group of cybersecurity experts and infrastructure engineers, 
                  witnessed firsthand how complex and expensive enterprise-grade security solutions had become.
                </p>
                
                <p className="text-lg leading-relaxed mb-6">
                  Small and medium businesses were left behind, forced to choose between security and affordability. 
                  We believed this was fundamentally wrong. Security shouldn't be a luxury - it should be accessible to all.
                </p>
                
                <p className="text-lg leading-relaxed mb-6">
                  Our mission became clear: democratize enterprise-grade security and infrastructure. 
                  We set out to build a platform that would deliver Fortune 500-level security and reliability 
                  at a price point that growing businesses could afford.
                </p>
                
                <p className="text-lg leading-relaxed">
                  Today, we're proud to serve thousands of businesses worldwide, from startups to enterprises, 
                  helping them secure their digital assets and scale their infrastructure with confidence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div ref={timelineRef} className="py-20 bg-linear-to-b from-green-50/50 to-yellow-50/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Our Journey</h2>
            <p className="text-xl text-gray-600">Key milestones in our growth</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-linear-to-b from-emerald-500 to-green-500"></div>
              
              {[
                {
                  year: "2020",
                  title: "Company Founded",
                  description: "VPN Enterprise was founded by a team of security experts with a vision to democratize enterprise security.",
                  icon: Rocket
                },
                {
                  year: "2021",
                  title: "First 1,000 Customers",
                  description: "Reached our first major milestone with 1,000 businesses trusting our platform for their security needs.",
                  icon: Users
                },
                {
                  year: "2022",
                  title: "Global Expansion",
                  description: "Launched in 50+ countries with dedicated servers worldwide, ensuring low latency for all customers.",
                  icon: Globe
                },
                {
                  year: "2023",
                  title: "Enterprise Features",
                  description: "Introduced advanced enterprise features including SSO, team management, and custom integrations.",
                  icon: Building
                },
                {
                  year: "2024",
                  title: "Industry Recognition",
                  description: "Won 'Best Enterprise Security Solution' and reached 50,000+ happy customers worldwide.",
                  icon: Award
                },
                {
                  year: "2025",
                  title: "AI-Powered Security",
                  description: "Launched next-generation AI-powered threat detection and automated security responses.",
                  icon: Lightbulb
                }
              ].map((milestone, index) => (
                <div key={index} className="timeline-item relative flex items-start mb-12">
                  <div className="absolute left-0 w-16 h-16 bg-linear-to-r from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                    <milestone.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="ml-24">
                    <div className="bg-white/70 backdrop-blur-sm border border-emerald-200 rounded-xl p-6 shadow-lg">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl font-bold text-emerald-600 mr-4">{milestone.year}</span>
                        <h3 className="text-xl font-bold text-gray-800">{milestone.title}</h3>
                      </div>
                      <p className="text-gray-600 leading-relaxed">{milestone.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Team Philosophy */}
      <div className="py-20 relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Our Philosophy</h2>
            <p className="text-xl text-gray-600">The beliefs that drive our innovation</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Heart,
                title: "People First",
                description: "Technology should serve people, not the other way around. We design with empathy and human needs at the center."
              },
              {
                icon: Target,
                title: "Simplicity",
                description: "Complex problems deserve elegant solutions. We believe in making powerful technology simple and accessible."
              },
              {
                icon: Shield,
                title: "Trust & Transparency",
                description: "Security requires trust. We're transparent about our practices, open about our challenges, and honest in our communications."
              }
            ].map((philosophy, index) => (
              <Card key={index} className="bg-white/70 border-emerald-200 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-linear-to-r from-emerald-500 to-green-600 flex items-center justify-center">
                    <philosophy.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl text-gray-800">{philosophy.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-gray-600 leading-relaxed">
                    {philosophy.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 bg-linear-to-r from-emerald-600 to-green-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Experience the Difference?
          </h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses who trust VPN Enterprise with their security needs.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50">
                <Rocket className="h-5 w-5 mr-2" />
                Start Free Trial
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
              <div className="p-2 bg-linear-to-br from-emerald-500 to-green-600 rounded-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-800">VPN Enterprise</span>
            </Link>
            <p className="text-gray-600 mt-4">
              © 2025 VPN Enterprise. Securing the digital world, one business at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
