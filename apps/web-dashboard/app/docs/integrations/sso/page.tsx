"use client";

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Users, 
  Lock, 
  Key, 
  CheckCircle,
  ArrowRight,
  Copy,
  Settings,
  Globe,
  Building,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import DocLayout from '@/components/docs/DocLayout';

export default function SSOProvidersPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const providersRef = useRef<HTMLDivElement>(null);
  const setupRef = useRef<HTMLDivElement>(null);

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

      // Providers animation
      gsap.from(providersRef.current?.children || [], {
        duration: 0.8,
        scale: 0.9,
        opacity: 0,
        stagger: 0.1,
        ease: "back.out(1.7)",
        delay: 0.3
      });

      // Setup steps animation
      gsap.from(setupRef.current?.children || [], {
        duration: 0.6,
        x: -30,
        opacity: 0,
        stagger: 0.15,
        ease: "power2.out",
        delay: 0.6
      });
    });

    return () => ctx.revert();
  }, []);

  const ssoProviders = [
    {
      name: "Okta",
      description: "Enterprise identity management platform",
      logo: "🔐",
      features: ["SAML 2.0", "OAuth 2.0", "SCIM", "MFA"],
      supported: true,
      setupTime: "10 min",
      color: "from-blue-500 to-cyan-500"
    },
    {
      name: "Azure Active Directory",
      description: "Microsoft's cloud-based identity service",
      logo: "🏢",
      features: ["SAML", "OpenID Connect", "Conditional Access", "Groups"],
      supported: true,
      setupTime: "15 min",
      color: "from-indigo-500 to-blue-500"
    },
    {
      name: "Google Workspace",
      description: "Google's enterprise productivity suite",
      logo: "🔵",
      features: ["OAuth 2.0", "OpenID Connect", "Groups", "Admin Console"],
      supported: true,
      setupTime: "8 min",
      color: "from-green-500 to-emerald-500"
    },
    {
      name: "OneLogin",
      description: "Secure identity platform for the modern enterprise",
      logo: "🎯",
      features: ["SAML 2.0", "OAuth", "Directory Sync", "MFA"],
      supported: true,
      setupTime: "12 min",
      color: "from-purple-500 to-violet-500"
    },
    {
      name: "Auth0",
      description: "Flexible identity platform for developers",
      logo: "🔓",
      features: ["Universal Login", "Social Login", "Rules", "APIs"],
      supported: true,
      setupTime: "5 min",
      color: "from-orange-500 to-red-500"
    },
    {
      name: "PingIdentity",
      description: "Comprehensive identity security platform",
      logo: "🏓",
      features: ["SAML", "OAuth", "Federation", "Risk Analytics"],
      supported: true,
      setupTime: "20 min",
      color: "from-teal-500 to-cyan-500"
    }
  ];

  const setupSteps = [
    {
      step: 1,
      title: "Configure SSO Provider",
      description: "Set up your identity provider with VPN Enterprise details",
      icon: Settings,
      tasks: ["Create new application", "Configure SAML/OAuth settings", "Set redirect URLs", "Add user attributes"]
    },
    {
      step: 2,
      title: "Import Configuration",
      description: "Import SSO configuration into VPN Enterprise",
      icon: Copy,
      tasks: ["Upload metadata file", "Configure attribute mapping", "Set user roles", "Test connection"]
    },
    {
      step: 3,
      title: "User Provisioning",
      description: "Enable automatic user provisioning and synchronization",
      icon: Users,
      tasks: ["Enable SCIM provisioning", "Map user groups", "Set up sync schedules", "Configure deprovisioning"]
    },
    {
      step: 4,
      title: "Testing & Go-Live",
      description: "Test the integration and deploy to production",
      icon: CheckCircle,
      tasks: ["Test user login", "Verify group mapping", "Check MFA flow", "Deploy to users"]
    }
  ];

  const benefits = [
    "Centralized user management",
    "Single sign-on experience",
    "Enhanced security with MFA",
    "Automatic user provisioning",
    "Group-based access control",
    "Compliance and audit trails"
  ];

  return (
    <DocLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-blue-50/30">
        <div className="container mx-auto px-6 py-12">
          {/* Hero Section */}
          <div ref={heroRef} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 px-4 py-2 rounded-full mb-6">
              <Shield className="h-5 w-5 text-purple-600" />
              <span className="text-purple-700 dark:text-purple-300 font-medium">SSO Integration</span>
            </div>
            
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-indigo-800 bg-clip-text text-transparent mb-6">
              Single Sign-On Providers
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Integrate seamlessly with your existing identity provider for centralized authentication, 
              enhanced security, and improved user experience across your VPN infrastructure.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600">
                Start SSO Setup
              </Button>
              <Button size="lg" variant="outline">
                View Documentation
              </Button>
            </div>
          </div>

          {/* Supported Providers */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Supported SSO Providers</h2>
            <div ref={providersRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ssoProviders.map((provider, index) => (
                <Card 
                  key={index}
                  className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm overflow-hidden"
                >
                  <CardHeader className="relative">
                    <div className={`absolute inset-0 bg-gradient-to-r ${provider.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                    <div className="relative flex items-center gap-4">
                      <div className="text-3xl">{provider.logo}</div>
                      <div>
                        <CardTitle className="text-lg">{provider.name}</CardTitle>
                        <CardDescription>{provider.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Supported
                      </Badge>
                      <Badge variant="outline">
                        <Zap className="h-3 w-3 mr-1" />
                        {provider.setupTime}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2 text-gray-700">Features:</h4>
                      <div className="flex flex-wrap gap-1">
                        {provider.features.map((feature, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button className="w-full" variant="outline">
                      Setup Guide
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Setup Process */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">SSO Integration Process</h2>
            <div ref={setupRef} className="space-y-8">
              {setupSteps.map((step, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                          {step.step}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <step.icon className="h-5 w-5 text-purple-600" />
                          <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
                        </div>
                        <p className="text-gray-600 mb-4">{step.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {step.tasks.map((task, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-gray-700">{task}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Configuration Tabs */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Configuration Examples</h2>
            <Tabs defaultValue="saml" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="saml">SAML 2.0</TabsTrigger>
                <TabsTrigger value="oauth">OAuth 2.0</TabsTrigger>
                <TabsTrigger value="oidc">OpenID Connect</TabsTrigger>
              </TabsList>
              
              <TabsContent value="saml">
                <Card>
                  <CardHeader>
                    <CardTitle>SAML 2.0 Configuration</CardTitle>
                    <CardDescription>
                      Configure SAML-based single sign-on with your identity provider
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3">Required Settings:</h4>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                              <Key className="h-4 w-4 text-blue-600" />
                              <strong>Entity ID:</strong> <code>https://vpn.yourcompany.com/saml</code>
                            </li>
                            <li className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-blue-600" />
                              <strong>ACS URL:</strong> <code>https://vpn.yourcompany.com/saml/acs</code>
                            </li>
                            <li className="flex items-center gap-2">
                              <Lock className="h-4 w-4 text-blue-600" />
                              <strong>SLO URL:</strong> <code>https://vpn.yourcompany.com/saml/slo</code>
                            </li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-3">Attribute Mapping:</h4>
                          <ul className="space-y-2 text-sm">
                            <li><strong>Email:</strong> <code>http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress</code></li>
                            <li><strong>First Name:</strong> <code>http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname</code></li>
                            <li><strong>Last Name:</strong> <code>http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname</code></li>
                            <li><strong>Groups:</strong> <code>http://schemas.microsoft.com/ws/2008/06/identity/claims/groups</code></li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="oauth">
                <Card>
                  <CardHeader>
                    <CardTitle>OAuth 2.0 Configuration</CardTitle>
                    <CardDescription>
                      Set up OAuth 2.0 integration for modern authentication flows
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3">OAuth Settings:</h4>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                              <Key className="h-4 w-4 text-green-600" />
                              <strong>Client ID:</strong> <code>vpn-enterprise-client</code>
                            </li>
                            <li className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-green-600" />
                              <strong>Redirect URI:</strong> <code>https://vpn.yourcompany.com/oauth/callback</code>
                            </li>
                            <li className="flex items-center gap-2">
                              <Lock className="h-4 w-4 text-green-600" />
                              <strong>Scopes:</strong> <code>openid profile email groups</code>
                            </li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-3">Token Configuration:</h4>
                          <ul className="space-y-2 text-sm">
                            <li><strong>Access Token Lifetime:</strong> 1 hour</li>
                            <li><strong>Refresh Token Lifetime:</strong> 30 days</li>
                            <li><strong>ID Token Signing:</strong> RS256</li>
                            <li><strong>Token Endpoint:</strong> Client Secret Basic</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="oidc">
                <Card>
                  <CardHeader>
                    <CardTitle>OpenID Connect Configuration</CardTitle>
                    <CardDescription>
                      Configure OpenID Connect for standardized identity integration
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3">OIDC Endpoints:</h4>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-purple-600" />
                              <strong>Discovery:</strong> <code>/.well-known/openid-configuration</code>
                            </li>
                            <li className="flex items-center gap-2">
                              <Key className="h-4 w-4 text-purple-600" />
                              <strong>Authorization:</strong> <code>/oauth/authorize</code>
                            </li>
                            <li className="flex items-center gap-2">
                              <Lock className="h-4 w-4 text-purple-600" />
                              <strong>Token:</strong> <code>/oauth/token</code>
                            </li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-3">Supported Features:</h4>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              ID Token validation
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              UserInfo endpoint
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              Dynamic client registration
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              PKCE support
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Benefits Section */}
          <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white mb-16">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-2xl font-bold mb-4">Benefits of SSO Integration</h2>
                  <ul className="space-y-3">
                    {benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 opacity-90" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-center">
                  <Building className="h-24 w-24 mx-auto mb-4 opacity-80" />
                  <p className="text-lg opacity-90">
                    Seamlessly integrate with your existing identity infrastructure 
                    for enhanced security and user experience.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ready to Setup SSO?</CardTitle>
                <CardDescription>
                  Get started with our step-by-step integration guides
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Start SSO Integration
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Need Custom Integration?</CardTitle>
                <CardDescription>
                  Our team can help with complex SSO requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Contact Integration Team
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DocLayout>
  );
}