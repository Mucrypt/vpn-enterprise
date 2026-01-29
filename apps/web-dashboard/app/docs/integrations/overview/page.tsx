"use client";

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Network, 
  Shield, 
  Activity, 
  GitBranch, 
  Code, 
  ArrowRight,
  CheckCircle,
  Zap,
  Users,
  Settings,
  Lock,
  Globe
} from 'lucide-react';
import Link from 'next/link';
import DocLayout from '@/components/docs/DocLayout';

export default function IntegrationsOverviewPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

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

      // Cards animation
      gsap.from(cardsRef.current?.children || [], {
        duration: 0.8,
        y: 30,
        opacity: 0,
        stagger: 0.15,
        ease: "power2.out",
        delay: 0.3
      });

      // Features animation
      gsap.from(featuresRef.current?.children || [], {
        duration: 0.6,
        x: -30,
        opacity: 0,
        stagger: 0.1,
        ease: "power2.out",
        delay: 0.6
      });
    });

    return () => ctx.revert();
  }, []);

  const integrationTypes = [
    {
      title: "SSO Providers",
      description: "Seamlessly integrate with enterprise identity providers",
      icon: Shield,
      features: ["Active Directory", "SAML 2.0", "OAuth 2.0", "OpenID Connect"],
      color: "from-blue-500 to-cyan-500",
      href: "/docs/integrations/sso"
    },
    {
      title: "Monitoring Tools",
      description: "Connect with your existing monitoring and observability stack",
      icon: Activity,
      features: ["Prometheus", "Grafana", "DataDog", "New Relic"],
      color: "from-green-500 to-emerald-500",
      href: "/docs/integrations/monitoring"
    },
    {
      title: "CI/CD Platforms",
      description: "Automate deployments with your development workflow",
      icon: GitBranch,
      features: ["GitHub Actions", "Jenkins", "GitLab CI", "Azure DevOps"],
      color: "from-purple-500 to-violet-500",
      href: "/docs/integrations/cicd"
    },
    {
      title: "Third-party APIs",
      description: "Extend functionality with external service integrations",
      icon: Code,
      features: ["Webhooks", "REST APIs", "GraphQL", "Message Queues"],
      color: "from-orange-500 to-red-500",
      href: "/docs/integrations/apis"
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Faster Implementation",
      description: "Pre-built connectors and SDKs reduce integration time by 80%"
    },
    {
      icon: Lock,
      title: "Enterprise Security",
      description: "All integrations maintain enterprise-grade security standards"
    },
    {
      icon: Users,
      title: "Unified Experience",
      description: "Single pane of glass for all your VPN and infrastructure needs"
    },
    {
      icon: Settings,
      title: "Easy Configuration",
      description: "Simple setup wizards and comprehensive documentation"
    }
  ];

  const stats = [
    { label: "Available Integrations", value: "50+" },
    { label: "Setup Time", value: "<15 min" },
    { label: "API Uptime", value: "99.9%" },
    { label: "Enterprise Customers", value: "500+" }
  ];

  return (
    <DocLayout>
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
        <div className="container mx-auto px-6 py-12">
          {/* Hero Section */}
          <div ref={heroRef} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-full mb-6">
              <Network className="h-5 w-5 text-blue-600" />
              <span className="text-blue-700 dark:text-blue-300 font-medium">Enterprise Integrations</span>
            </div>
            
            <h1 className="text-5xl font-bold bg-linear-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-6">
              Connect Everything
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Seamlessly integrate VPN Enterprise with your existing infrastructure, identity providers, 
              monitoring tools, and development workflows. Over 50 pre-built integrations available.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Integration Categories */}
          <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {integrationTypes.map((integration, index) => (
              <Card 
                key={index}
                className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm overflow-hidden"
              >
                <CardHeader className="relative">
                  <div className={`absolute inset-0 bg-linear-to-r ${integration.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                  <div className="relative flex items-center gap-4">
                    <div className={`p-3 rounded-lg bg-linear-to-r ${integration.color} text-white`}>
                      <integration.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{integration.title}</CardTitle>
                      <CardDescription className="text-gray-600">
                        {integration.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="mb-6">
                    <h4 className="font-semibold mb-3 text-gray-700">Popular Integrations:</h4>
                    <div className="flex flex-wrap gap-2">
                      {integration.features.map((feature, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-gray-100 hover:bg-gray-200">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button asChild className="w-full group-hover:bg-gray-900 transition-colors">
                    <Link href={integration.href}>
                      Explore Integration
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Benefits Section */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Our Integrations?</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Built with enterprise needs in mind, our integrations are secure, reliable, and easy to implement.
              </p>
            </div>

            <div ref={featuresRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 bg-linear-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <benefit.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                    <p className="text-sm text-gray-600">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Start Section */}
          <Card className="bg-linear-to-r from-indigo-500 to-purple-600 text-white">
            <CardContent className="p-8 text-center">
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-90" />
              <h2 className="text-2xl font-bold mb-4">Ready to Connect?</h2>
              <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
                Get started with our integration guides and connect your VPN Enterprise 
                deployment with your existing tools in minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary">
                  View All Integrations
                </Button>
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-indigo-600">
                  Contact Integration Team
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Popular Integrations Preview */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Popular Integrations</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {[
                { name: "Okta", logo: "🔐" },
                { name: "Azure AD", logo: "🏢" },
                { name: "Prometheus", logo: "📊" },
                { name: "Grafana", logo: "📈" },
                { name: "GitHub", logo: "🐙" },
                { name: "Jenkins", logo: "🔧" }
              ].map((integration, index) => (
                <Card key={index} className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
                  <div className="text-3xl mb-2">{integration.logo}</div>
                  <div className="font-medium text-gray-700">{integration.name}</div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DocLayout>
  );
}