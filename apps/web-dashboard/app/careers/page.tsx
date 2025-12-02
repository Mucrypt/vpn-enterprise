"use client";

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Shield, ArrowLeft, Users, MapPin, Briefcase, 
  Heart, Coffee, Laptop, Globe, Award,
  TrendingUp, Zap, Code, Database, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function CareersPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);
  const jobsRef = useRef<HTMLDivElement>(null);

  // Sample job openings
  const jobOpenings = [
    {
      id: 1,
      title: "Senior Security Engineer",
      department: "Security",
      location: "Remote / San Francisco",
      type: "Full-time",
      experience: "5+ years",
      description: "Lead the development of next-generation security features and infrastructure. Work with cutting-edge technologies to protect our customers' data.",
      skills: ["Go", "Kubernetes", "AWS", "Security Protocols", "Cryptography"],
      featured: true
    },
    {
      id: 2,
      title: "Frontend Developer",
      department: "Engineering",
      location: "Remote / New York",
      type: "Full-time",
      experience: "3+ years",
      description: "Build beautiful, responsive user interfaces for our dashboard and customer-facing applications using React and modern frontend technologies.",
      skills: ["React", "TypeScript", "Tailwind CSS", "Next.js", "GSAP"],
      featured: false
    },
    {
      id: 3,
      title: "DevOps Engineer",
      department: "Infrastructure",
      location: "Remote / London",
      type: "Full-time",
      experience: "4+ years",
      description: "Design and maintain our global infrastructure, ensuring 99.99% uptime and seamless scaling for our growing customer base.",
      skills: ["Docker", "Kubernetes", "Terraform", "CI/CD", "Monitoring"],
      featured: false
    },
    {
      id: 4,
      title: "Product Manager",
      department: "Product",
      location: "Remote / Austin",
      type: "Full-time",
      experience: "5+ years",
      description: "Drive product strategy and roadmap for our enterprise security platform. Work closely with engineering and design teams.",
      skills: ["Product Strategy", "User Research", "Analytics", "Agile", "B2B SaaS"],
      featured: false
    },
    {
      id: 5,
      title: "Database Administrator",
      department: "Infrastructure",
      location: "Remote / Toronto",
      type: "Full-time",
      experience: "4+ years",
      description: "Manage and optimize our database infrastructure, ensuring high performance and reliability for our managed database services.",
      skills: ["PostgreSQL", "MySQL", "Redis", "Performance Tuning", "Backup & Recovery"],
      featured: false
    },
    {
      id: 6,
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "Remote / Berlin",
      type: "Full-time",
      experience: "3+ years",
      description: "Help our enterprise customers succeed with our platform, providing guidance and ensuring they achieve their security goals.",
      skills: ["Customer Relations", "Technical Support", "SaaS", "Enterprise Sales", "Communication"],
      featured: false
    }
  ];

  const benefits = [
    {
      icon: Heart,
      title: "Health & Wellness",
      description: "Comprehensive health, dental, and vision insurance plus wellness programs and mental health support."
    },
    {
      icon: Coffee,
      title: "Work-Life Balance",
      description: "Flexible hours, unlimited PTO, and a culture that respects your personal time and well-being."
    },
    {
      icon: Laptop,
      title: "Remote-First",
      description: "Work from anywhere with a $2000 home office setup budget and co-working space allowance."
    },
    {
      icon: TrendingUp,
      title: "Growth & Learning",
      description: "$3000 annual learning budget for courses, conferences, and professional development."
    },
    {
      icon: Users,
      title: "Equity & Inclusion",
      description: "Stock options for all employees and a commitment to building a diverse, inclusive team."
    },
    {
      icon: Globe,
      title: "Global Team",
      description: "Work with talented people from around the world on products used by thousands of businesses."
    }
  ];

  useEffect(() => {
    // Hero animation
    const tl = gsap.timeline();
    
    tl.from(titleRef.current, {
      duration: 1.2,
      y: 60,
      opacity: 0,
      ease: "power3.out"
    })
    .from(".careers-subtitle", {
      duration: 1,
      y: 40,
      opacity: 0,
      ease: "power2.out"
    }, "-=0.6")
    .from(".careers-description", {
      duration: 0.8,
      y: 30,
      opacity: 0,
      ease: "back.out(1.7)"
    }, "-=0.4");

    // Benefits animation
    gsap.fromTo(".benefit-card", {
      y: 50,
      opacity: 0,
      scale: 0.9
    }, {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.8,
      stagger: 0.15,
      ease: "back.out(1.7)",
      scrollTrigger: {
        trigger: benefitsRef.current,
        start: "top 80%",
        toggleActions: "play none none none"
      }
    });

    // Job cards animation
    gsap.fromTo(".job-card", {
      y: 50,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.2,
      ease: "power2.out",
      scrollTrigger: {
        trigger: jobsRef.current,
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
      stagger: 0.7
    });

  }, []);

  const getDepartmentIcon = (department: string) => {
    switch (department) {
      case 'Security': return Lock;
      case 'Engineering': return Code;
      case 'Infrastructure': return Database;
      case 'Product': return Briefcase;
      case 'Customer Success': return Heart;
      default: return Users;
    }
  };

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case 'Security': return 'from-red-500 to-red-600';
      case 'Engineering': return 'from-blue-500 to-blue-600';
      case 'Infrastructure': return 'from-green-500 to-green-600';
      case 'Product': return 'from-purple-500 to-purple-600';
      case 'Customer Success': return 'from-pink-500 to-pink-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-white via-green-50 to-yellow-50">
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100/40 via-transparent to-yellow-100/40"></div>
        <div className="absolute top-32 left-20 w-80 h-80 bg-gradient-to-r from-emerald-300/30 to-green-300/30 rounded-full blur-3xl animate-pulse floating-element"></div>
        <div className="absolute bottom-20 right-32 w-72 h-72 bg-gradient-to-r from-yellow-300/25 to-amber-300/25 rounded-full blur-3xl animate-pulse floating-element"></div>
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
            Join Our Team
          </h1>
          
          <p className="careers-subtitle text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
            Help us build the future of enterprise security and infrastructure
          </p>
          
          <div className="careers-description max-w-2xl mx-auto">
            <p className="text-lg text-gray-600 leading-relaxed">
              We're looking for passionate, talented individuals who want to make a real impact. 
              Join our global team and help secure the digital world for businesses everywhere.
            </p>
          </div>
        </div>
      </div>

      {/* Company Culture Stats */}
      <div className="py-12 relative z-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { number: "50+", label: "Team Members", icon: Users },
              { number: "15+", label: "Countries", icon: Globe },
              { number: "4.8/5", label: "Glassdoor Rating", icon: Award },
              { number: "100%", label: "Remote Friendly", icon: Laptop }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-emerald-600">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div ref={benefitsRef} className="py-20 bg-gradient-to-b from-green-50/50 to-yellow-50/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Why Work With Us</h2>
            <p className="text-xl text-gray-600">We believe great benefits help create great work</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card key={index} className="benefit-card bg-white/70 border-emerald-200 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center">
                    <benefit.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl text-gray-800">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-gray-600 leading-relaxed">
                    {benefit.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Open Positions */}
      <div ref={jobsRef} className="py-20 relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Open Positions</h2>
            <p className="text-xl text-gray-600">Find your perfect role and grow with us</p>
          </div>

          {/* Featured Job */}
          <div className="max-w-6xl mx-auto mb-12">
            {jobOpenings.filter(job => job.featured).map((job) => (
              <Card key={job.id} className="job-card bg-gradient-to-br from-white/80 to-emerald-50/80 border-emerald-300 backdrop-blur-sm shadow-xl overflow-hidden">
                <div className="absolute top-4 right-4">
                  <Badge className="bg-emerald-500">Featured</Badge>
                </div>
                <div className="p-8">
                  <div className="flex items-start gap-6">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${getDepartmentColor(job.department)} flex items-center justify-center flex-shrink-0`}>
                      {(() => {
                        const Icon = getDepartmentIcon(job.department);
                        return <Icon className="h-8 w-8 text-white" />;
                      })()}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="outline">{job.department}</Badge>
                        <Badge variant="outline">{job.type}</Badge>
                        <Badge variant="outline">{job.experience}</Badge>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">{job.title}</h3>
                      <div className="flex items-center gap-4 text-gray-600 mb-4">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {job.type}
                        </div>
                      </div>
                      <p className="text-gray-700 leading-relaxed mb-6">{job.description}</p>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {job.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="bg-emerald-100 text-emerald-700">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      <Button className="bg-emerald-600 hover:bg-emerald-700">
                        Apply Now
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Other Jobs */}
          <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {jobOpenings.filter(job => !job.featured).map((job, index) => (
              <Card key={job.id} className="job-card bg-white/70 border-emerald-200 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getDepartmentColor(job.department)} flex items-center justify-center flex-shrink-0`}>
                      {(() => {
                        const Icon = getDepartmentIcon(job.department);
                        return <Icon className="h-6 w-6 text-white" />;
                      })()}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">{job.department}</Badge>
                        <Badge variant="outline" className="text-xs">{job.type}</Badge>
                      </div>
                      <CardTitle className="text-lg text-gray-800">{job.title}</CardTitle>
                      <div className="flex items-center gap-3 text-sm text-gray-600 mt-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </div>
                        <span>•</span>
                        <span>{job.experience}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed mb-4">
                    {job.description.substring(0, 120)}...
                  </CardDescription>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {job.skills.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                        {skill}
                      </Badge>
                    ))}
                    {job.skills.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{job.skills.length - 3} more
                      </Badge>
                    )}
                  </div>
                  <Button variant="outline" className="w-full border-emerald-300 text-emerald-600 hover:bg-emerald-50">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No Perfect Match */}
          <div className="text-center mt-16">
            <Card className="bg-gradient-to-br from-white/70 to-green-50/70 backdrop-blur-sm border-emerald-200 max-w-2xl mx-auto p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Don't See a Perfect Match?</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                We're always looking for exceptional talent. Send us your resume and tell us 
                how you'd like to contribute to our mission.
              </p>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Send General Application
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 bg-gradient-to-r from-emerald-600 to-green-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Make an Impact?
          </h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Join our mission to make enterprise-grade security accessible to businesses worldwide.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50">
              <Users className="h-5 w-5 mr-2" />
              View All Openings
            </Button>
            <Link href="/about">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Learn About Our Culture
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
              © 2025 VPN Enterprise. Building the future together.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}