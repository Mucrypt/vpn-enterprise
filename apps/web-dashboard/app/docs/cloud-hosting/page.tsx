"use client";

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Cloud, 
  Server, 
  Zap, 
  Cpu, 
  HardDrive, 
  Network,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Globe,
  Shield,
  BarChart3,
  Users,
  Lock
} from 'lucide-react';
import Link from 'next/link';
import DocLayout from '@/components/docs/DocLayout';

export default function CloudHostingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const plansRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animation
      gsap.from(heroRef.current?.children || [], {
        duration: 1,
        y: 50,
        opacity: 0,
        stagger: 0.2,
        ease: "power3.out"
      });

      // Stats animation
      gsap.from(statsRef.current?.children || [], {
        duration: 0.8,
        scale: 0.9,
        opacity: 0,
        stagger: 0.1,
        ease: "back.out(1.7)",
        delay: 0.2
      });

      // Plans animation
      gsap.from(plansRef.current?.children || [], {
        duration: 0.8,
        scale: 0.9,
        opacity: 0,
        stagger: 0.1,
        ease: "back.out(1.7)",
        delay: 0.4
      });

      // Features animation
      gsap.from(featuresRef.current?.children || [], {
        duration: 0.6,
        y: 30,
        opacity: 0,
        stagger: 0.15,
        ease: "power2.out",
        delay: 0.6
      });
    });

    return () => ctx.revert();
  }, []);

  const stats = [
    { icon: Users, label: "Active Clients", value: "50,000+", color: "from-blue-500 to-cyan-500" },
    { icon: Globe, label: "Global Servers", value: "100+", color: "from-green-500 to-emerald-500" },
    { icon: Zap, label: "Uptime", value: "99.9%", color: "from-purple-500 to-violet-500" },
    { icon: Shield, label: "Security Level", value: "Military", color: "from-orange-500 to-red-500" }
  ];

  const hostingOptions = [
    {
      title: "Shared Hosting",
      description: "Cost-effective solution for small to medium businesses",
      icon: Globe,
      price: "$29",
      period: "per month",
      popular: false,
      features: [
        "Up to 100 users",
        "Shared resources",
        "Basic monitoring", 
        "Email support",
        "SSL certificates",
        "Daily backups"
      ],
      ideal: "Small businesses, startups",
      href: "/docs/cloud-hosting/shared-hosting"
    },
    {
      title: "VPS Hosting",
      description: "Dedicated virtual resources for better performance",
      icon: Server,
      price: "$99",
      period: "per month",
      popular: true,
      features: [
        "Up to 500 users",
        "Dedicated CPU/RAM",
        "Advanced monitoring",
        "Priority support",
        "Custom SSL",
        "Real-time backups"
      ],
      ideal: "Growing businesses, medium enterprises",
      href: "/docs/cloud-hosting/vps-hosting"
    },
    {
      title: "Dedicated Hosting",
      description: "Full server resources for maximum performance",
      icon: Cpu,
      price: "$299",
      period: "per month",
      popular: false,
      features: [
        "Unlimited users",
        "Full server control",
        "Real-time monitoring",
        "24/7 phone support",
        "Custom configuration",
        "Instant backups"
      ],
      ideal: "Large enterprises, high-traffic deployments",
      href: "/docs/cloud-hosting/dedicated-hosting"
    }
  ];

  const features = [
    {
      icon: Zap,
      title: "High Performance",
      description: "Optimized infrastructure with SSD storage and CDN acceleration for lightning-fast VPN connections worldwide.",
      benefits: ["Sub-50ms latency", "Auto-scaling", "Edge optimization"]
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Military-grade encryption, DDoS protection, and compliance with SOC2, HIPAA, and GDPR standards.",
      benefits: ["Zero-trust architecture", "Advanced firewalls", "Audit logging"]
    },
    {
      icon: Network,
      title: "Global Network",
      description: "100+ server locations across 6 continents ensuring optimal performance for your users anywhere.",
      benefits: ["Multi-region deployment", "Load balancing", "Failover protection"]
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Comprehensive dashboards with real-time metrics, usage analytics, and performance insights.",
      benefits: ["Custom reports", "API integration", "Alerting system"]
    }
  ];

  const quickLinks = [
    {
      title: "Storage Solutions",
      description: "Scalable storage options with automated backups and disaster recovery.",
      icon: HardDrive,
      href: "/docs/cloud-hosting/storage",
      features: ["Automated backups", "Point-in-time recovery", "Encryption at rest"]
    },
    {
      title: "Networking",
      description: "Advanced networking features including load balancing and CDN integration.",
      icon: Network,
      href: "/docs/cloud-hosting/networking", 
      features: ["Global CDN", "DDoS protection", "Traffic routing"]
    },
    {
      title: "Migration Guide",
      description: "Seamlessly migrate your existing VPN infrastructure to our cloud platform.",
      icon: ArrowRight,
      href: "/docs/cloud-hosting/migration",
      features: ["Zero downtime", "Data migration", "Configuration transfer"]
    }
  ];

  return (
    <DocLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-green-50/30">
        <div className="container mx-auto px-6 py-12">
          {/* Hero Section */}
          <div ref={heroRef} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-full mb-6">
              <Cloud className="h-5 w-5 text-blue-600" />
              <span className="text-blue-700 dark:text-blue-300 font-medium">Professional Cloud Hosting</span>
            </div>
            
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-green-800 bg-clip-text text-transparent mb-6">
              Cloud Hosting Solutions
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Deploy your VPN Enterprise on our globally distributed cloud infrastructure. 
              Choose from shared, VPS, or dedicated hosting options with enterprise-grade security and support.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-green-600">
                Get Started Today
              </Button>
              <Button size="lg" variant="outline">
                Compare Plans
              </Button>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mb-16">
            <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${stat.color} text-white mb-4`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Hosting Plans */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Choose Your Hosting Plan</h2>
            <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Select the perfect hosting solution for your business needs. All plans include setup, maintenance, and professional support.
            </p>
            <div ref={plansRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {hostingOptions.map((option, index) => (
                <Card 
                  key={index}
                  className={`relative hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm ${
                    option.popular ? 'ring-2 ring-blue-500 scale-105' : ''
                  }`}
                >
                  {option.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className={`p-4 rounded-lg ${option.popular ? 'bg-gradient-to-r from-blue-600 to-green-600' : 'bg-gray-100'} text-white`}>
                        <option.icon className="h-8 w-8" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl">{option.title}</CardTitle>
                    <CardDescription className="text-base">{option.description}</CardDescription>
                    <div className="mt-4">
                      <div className="text-4xl font-bold text-gray-900">{option.price}</div>
                      <div className="text-gray-600">{option.period}</div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold mb-3 text-gray-700">Features included:</h4>
                        <ul className="space-y-2">
                          {option.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-3">
                              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 text-gray-700">Perfect for:</h4>
                        <p className="text-sm text-gray-600">{option.ideal}</p>
                      </div>
                      <Button 
                        asChild 
                        className={`w-full ${option.popular ? 'bg-gradient-to-r from-blue-600 to-green-600' : ''}`}
                        size="lg"
                      >
                        <Link href={option.href}>
                          Choose {option.title}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Key Features */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Why Choose Our Cloud Hosting</h2>
            <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Built for enterprise performance with the reliability and security your business demands.
            </p>
            <div ref={featuresRef} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-green-500 text-white">
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{feature.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {feature.benefits.map((benefit, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Explore Advanced Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {quickLinks.map((link, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-300 group border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-green-500 group-hover:text-white transition-all duration-300">
                        <link.icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg">{link.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm mb-4">{link.description}</p>
                    <div className="space-y-2 mb-4">
                      {link.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-gray-600">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" asChild className="w-full">
                      <Link href={link.href}>
                        Learn More
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Support Notice */}
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-amber-100">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-amber-900 mb-2">Need Help Choosing the Right Plan?</h3>
                  <p className="text-amber-700 mb-6">
                    Our solution architects are here to help you select the perfect hosting solution based on your specific requirements, 
                    traffic patterns, and growth projections. Get personalized recommendations and custom quotes.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button className="bg-amber-600 hover:bg-amber-700">
                      Schedule Free Consultation
                    </Button>
                    <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                      Contact Sales Team
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DocLayout>
  );
}