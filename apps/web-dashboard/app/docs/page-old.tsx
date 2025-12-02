"use client";

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Shield, ArrowLeft, Search, Menu, X, 
  BookOpen, Code, Zap, Database, Server,
  Lock, Globe, Settings, Users, FileText,
  ChevronRight, ChevronDown, Home, Rocket,
  Terminal, Key, CloudCog, GitBranch,
  Layers, Network, HardDrive, Monitor,
  Smartphone, Tablet, Eye, Copy, Check,
  ExternalLink, Star, Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Documentation structure
const docStructure = [
  {
    title: "Getting Started",
    icon: Rocket,
    items: [
      { title: "Introduction", href: "/docs", active: true },
      { title: "Quick Start", href: "/docs/quick-start" },
      { title: "Installation", href: "/docs/installation" },
      { title: "Authentication", href: "/docs/authentication" }
    ]
  },
  {
    title: "VPN Services",
    icon: Shield,
    items: [
      { title: "Overview", href: "/docs/vpn" },
      { title: "Connection Setup", href: "/docs/vpn/setup" },
      { title: "Configuration", href: "/docs/vpn/config" },
      { title: "Security Protocols", href: "/docs/vpn/security" },
      { title: "Team Management", href: "/docs/vpn/teams" }
    ]
  },
  {
    title: "Database Services",
    icon: Database,
    items: [
      { title: "Overview", href: "/docs/database" },
      { title: "Creating Databases", href: "/docs/database/create" },
      { title: "Backups & Recovery", href: "/docs/database/backup" },
      { title: "Performance Tuning", href: "/docs/database/performance" },
      { title: "Scaling", href: "/docs/database/scaling" }
    ]
  },
  {
    title: "Cloud Hosting",
    icon: CloudCog,
    items: [
      { title: "Overview", href: "/docs/hosting" },
      { title: "Deployment", href: "/docs/hosting/deploy" },
      { title: "Domain Management", href: "/docs/hosting/domains" },
      { title: "SSL Certificates", href: "/docs/hosting/ssl" },
      { title: "Load Balancing", href: "/docs/hosting/load-balancer" }
    ]
  },
  {
    title: "API Reference",
    icon: Code,
    items: [
      { title: "Overview", href: "/docs/api" },
      { title: "Authentication", href: "/docs/api/auth" },
      { title: "VPN Endpoints", href: "/docs/api/vpn" },
      { title: "Database Endpoints", href: "/docs/api/database" },
      { title: "Hosting Endpoints", href: "/docs/api/hosting" },
      { title: "Webhooks", href: "/docs/api/webhooks" }
    ]
  },
  {
    title: "SDKs & Libraries",
    icon: Terminal,
    items: [
      { title: "JavaScript SDK", href: "/docs/sdk/javascript" },
      { title: "Python SDK", href: "/docs/sdk/python" },
      { title: "Go SDK", href: "/docs/sdk/go" },
      { title: "PHP SDK", href: "/docs/sdk/php" },
      { title: "CLI Tool", href: "/docs/sdk/cli" }
    ]
  },
  {
    title: "Guides & Tutorials",
    icon: BookOpen,
    items: [
      { title: "Best Practices", href: "/docs/guides/best-practices" },
      { title: "Security Guide", href: "/docs/guides/security" },
      { title: "Troubleshooting", href: "/docs/guides/troubleshooting" },
      { title: "Migration Guide", href: "/docs/guides/migration" },
      { title: "Examples", href: "/docs/guides/examples" }
    ]
  }
];

const quickLinks = [
  { title: "Quick Start", href: "/docs/quick-start", icon: Zap },
  { title: "API Reference", href: "/docs/api", icon: Code },
  { title: "Examples", href: "/docs/guides/examples", icon: FileText },
  { title: "Support", href: "/contact", icon: Users }
];

export default function DocsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(["Getting Started"]);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const toggleSection = (title: string) => {
    setExpandedSections(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    // Hero animation
    const tl = gsap.timeline();
    
    tl.from(titleRef.current, {
      duration: 1.2,
      y: 60,
      opacity: 0,
      ease: "power3.out"
    })
    .from(".docs-subtitle", {
      duration: 1,
      y: 40,
      opacity: 0,
      ease: "power2.out"
    }, "-=0.6")
    .from(".quick-link", {
      duration: 0.8,
      y: 30,
      opacity: 0,
      scale: 0.9,
      stagger: 0.1,
      ease: "back.out(1.7)"
    }, "-=0.4");

    // Sidebar animation
    gsap.fromTo(sidebarRef.current, {
      x: -20,
      opacity: 0
    }, {
      x: 0,
      opacity: 1,
      duration: 1,
      ease: "power2.out",
      delay: 0.3
    });

    // Content animation
    gsap.fromTo(contentRef.current, {
      y: 30,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      duration: 1,
      ease: "power2.out",
      delay: 0.5
    });

    // Floating elements
    gsap.to(".floating-element", {
      y: -20,
      duration: 4,
      ease: "power1.inOut",
      yoyo: true,
      repeat: -1,
      stagger: 0.8
    });

  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-r from-blue-200/30 to-purple-200/30 rounded-full blur-3xl floating-element"></div>
        <div className="absolute bottom-32 left-32 w-80 h-80 bg-gradient-to-r from-emerald-200/20 to-green-200/20 rounded-full blur-3xl floating-element"></div>
        <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-gradient-to-r from-yellow-200/25 to-orange-200/25 rounded-full blur-2xl floating-element"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-white/80 border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 md:gap-4">
            <div className="p-2 md:p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Shield className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg md:text-xl font-black bg-gradient-to-r from-slate-800 via-blue-700 to-purple-700 bg-clip-text text-transparent">
                VPN Enterprise
              </span>
              <span className="text-xs text-slate-600 hidden sm:block">Documentation</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="hidden md:flex relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search docs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 bg-white/50 border-slate-200 focus:border-blue-400 text-sm"
              />
            </div>
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            <Link href="/">
              <Button variant="outline" size="sm" className="hidden sm:flex border-slate-300">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside 
          ref={sidebarRef}
          className={`fixed md:sticky top-16 left-0 h-[calc(100vh-4rem)] w-80 bg-white/90 backdrop-blur-md border-r border-slate-200 shadow-lg transition-transform duration-300 z-40 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="p-6 h-full overflow-y-auto">
            {/* Mobile Search */}
            <div className="md:hidden mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search docs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/50 border-slate-200 focus:border-blue-400 text-sm"
                />
              </div>
            </div>

            {/* Documentation Navigation */}
            <nav className="space-y-1">
              {docStructure.map((section, sectionIndex) => {
                const isExpanded = expandedSections.includes(section.title);
                return (
                  <div key={sectionIndex} className="space-y-1">
                    <button
                      onClick={() => toggleSection(section.title)}
                      className="flex items-center w-full px-3 py-2.5 text-left text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-200 group"
                    >
                      <section.icon className="h-4 w-4 mr-3 text-slate-500 group-hover:text-blue-600 transition-colors" />
                      <span className="font-medium flex-1">{section.title}</span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                    
                    {isExpanded && (
                      <div className="ml-7 space-y-1">
                        {section.items.map((item, itemIndex) => (
                          <Link
                            key={itemIndex}
                            href={item.href}
                            className={`block px-3 py-2 text-sm rounded-md transition-all duration-200 ${
                              item.active
                                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500 font-medium'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                            }`}
                          >
                            {item.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <Separator className="my-6" />

            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Access</h4>
              <div className="space-y-1">
                {quickLinks.map((link, index) => (
                  <Link
                    key={index}
                    href={link.href}
                    className="flex items-center px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-800 rounded-md transition-all duration-200"
                  >
                    <link.icon className="h-4 w-4 mr-3 text-slate-400" />
                    {link.title}
                    <ExternalLink className="h-3 w-3 ml-auto text-slate-300" />
                  </Link>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Community */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Community</h4>
              <div className="space-y-1">
                <a href="#" className="flex items-center px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-800 rounded-md transition-all duration-200">
                  <GitBranch className="h-4 w-4 mr-3 text-slate-400" />
                  GitHub
                  <ExternalLink className="h-3 w-3 ml-auto text-slate-300" />
                </a>
                <a href="#" className="flex items-center px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-800 rounded-md transition-all duration-200">
                  <Users className="h-4 w-4 mr-3 text-slate-400" />
                  Discord
                  <ExternalLink className="h-3 w-3 ml-auto text-slate-300" />
                </a>
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div ref={contentRef} className="max-w-4xl mx-auto px-6 py-12">
            
            {/* Hero Section */}
            <div ref={heroRef} className="mb-16">
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                <Home className="h-4 w-4" />
                <ChevronRight className="h-3 w-3" />
                <span>Documentation</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-blue-600 font-medium">Introduction</span>
              </div>
              
              <h1 
                ref={titleRef}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-800 mb-6 leading-tight"
              >
                VPN Enterprise
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Documentation
                </span>
              </h1>
              
              <p className="docs-subtitle text-xl text-slate-600 mb-8 leading-relaxed max-w-3xl">
                Everything you need to build secure, scalable applications with our enterprise platform. 
                From VPN services to managed databases and cloud hosting.
              </p>
              
              {/* Quick Start Cards */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                {quickLinks.map((link, index) => (
                  <Card key={index} className="quick-link bg-white/60 border-slate-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg group cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg group-hover:scale-110 transition-transform duration-300">
                          <link.icon className="h-4 w-4 text-white" />
                        </div>
                        <CardTitle className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                          {link.title}
                        </CardTitle>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

            {/* Introduction Content */}
            <div className="prose prose-slate max-w-none">
              <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
                <BookOpen className="h-6 w-6 mr-3 text-blue-600" />
                Welcome to VPN Enterprise
              </h2>
              
              <p className="text-lg text-slate-600 leading-relaxed mb-6">
                VPN Enterprise provides a comprehensive suite of infrastructure services designed for modern businesses. 
                Our platform combines enterprise-grade VPN security, managed database services, and scalable cloud hosting 
                into a single, unified solution.
              </p>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mb-8">
                <div className="flex items-start">
                  <Zap className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">Quick Start</h4>
                    <p className="text-blue-700 text-sm">
                      New to VPN Enterprise? Check out our <Link href="/docs/quick-start" className="underline font-medium">Quick Start Guide</Link> 
                      to get up and running in under 5 minutes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Platform Overview */}
              <h3 className="text-xl font-semibold text-slate-800 mb-6">Platform Overview</h3>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {[
                  {
                    icon: Shield,
                    title: "Enterprise VPN",
                    description: "Secure remote access with global servers, team management, and advanced security protocols.",
                    features: ["Zero-trust architecture", "Global server network", "Team management", "Advanced encryption"]
                  },
                  {
                    icon: Database,
                    title: "Managed Databases",
                    description: "Production-ready databases with automated backups, scaling, and performance optimization.",
                    features: ["Auto-scaling", "Automated backups", "Performance monitoring", "Multi-region support"]
                  },
                  {
                    icon: Server,
                    title: "Cloud Hosting",
                    description: "Scalable web hosting with global CDN, SSL certificates, and one-click deployments.",
                    features: ["Global CDN", "SSL certificates", "Auto-scaling", "Git deployments"]
                  }
                ].map((service, index) => (
                  <Card key={index} className="bg-white/60 border-slate-200 hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                          <service.icon className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle className="text-lg">{service.title}</CardTitle>
                      </div>
                      <CardDescription className="text-slate-600 leading-relaxed mb-4">
                        {service.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="space-y-1">
                        {service.features.map((feature, i) => (
                          <li key={i} className="flex items-center text-sm text-slate-600">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 flex-shrink-0"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Getting Started */}
              <h3 className="text-xl font-semibold text-slate-800 mb-6">Getting Started</h3>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4 p-4 bg-white/60 rounded-lg border border-slate-200">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">Create your account</h4>
                    <p className="text-slate-600 text-sm">Sign up for a free VPN Enterprise account and verify your email address.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-white/60 rounded-lg border border-slate-200">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">Choose your services</h4>
                    <p className="text-slate-600 text-sm">Select from VPN, database, or hosting services based on your needs.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-white/60 rounded-lg border border-slate-200">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">Deploy and scale</h4>
                    <p className="text-slate-600 text-sm">Use our dashboard, API, or SDKs to deploy and manage your infrastructure.</p>
                  </div>
                </div>
              </div>

              {/* Code Example */}
              <h3 className="text-xl font-semibold text-slate-800 mb-6">Quick Example</h3>
              
              <div className="relative bg-slate-900 rounded-lg p-6 mb-8 overflow-x-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyCode('curl -X POST "https://api.vpnenterprise.com/v1/vpn/connections" \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d {\n    "name": "my-vpn-connection",\n    "location": "us-east-1",\n    "protocol": "wireguard"\n  }')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <pre className="text-sm text-slate-300 overflow-x-auto">
                  <code>{`curl -X POST "https://api.vpnenterprise.com/v1/vpn/connections" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d {
    "name": "my-vpn-connection",
    "location": "us-east-1", 
    "protocol": "wireguard"
  }`}</code>
                </pre>
              </div>

              {/* Resources */}
              <h3 className="text-xl font-semibold text-slate-800 mb-6">Popular Resources</h3>
              
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {[
                  { title: "API Reference", href: "/docs/api", icon: Code, desc: "Complete API documentation with examples" },
                  { title: "JavaScript SDK", href: "/docs/sdk/javascript", icon: Terminal, desc: "Official JavaScript/Node.js SDK" },
                  { title: "Security Guide", href: "/docs/guides/security", icon: Lock, desc: "Best practices for securing your infrastructure" },
                  { title: "Examples", href: "/docs/guides/examples", icon: FileText, desc: "Real-world implementation examples" }
                ].map((resource, index) => (
                  <Link key={index} href={resource.href}>
                    <Card className="bg-white/60 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg group-hover:scale-110 transition-transform duration-300">
                            <resource.icon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                              {resource.title}
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-500 mt-1">
                              {resource.desc}
                            </CardDescription>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 ml-auto transition-colors" />
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Support */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                    <Heart className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-2">Need Help?</h4>
                    <p className="text-slate-600 text-sm mb-4">
                      Our team is here to help you succeed. Get in touch if you have questions, 
                      need assistance, or want to provide feedback.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Link href="/contact">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          Contact Support
                        </Button>
                      </Link>
                      <a href="#" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Join Discord Community →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}