"use client";

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Shield, ArrowLeft, Calendar, User, Clock, 
  ArrowRight, Tag, BookOpen, Zap, Lock,
  Globe, TrendingUp, Award, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function BlogPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const postsRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);

  // Sample blog posts data
  const blogPosts = [
    {
      id: 1,
      title: "The Future of Enterprise VPN Security in 2025",
      excerpt: "Exploring the latest trends and innovations shaping the VPN landscape, including zero-trust architecture and AI-powered threat detection.",
      author: "Sarah Chen",
      date: "December 1, 2025",
      readTime: "5 min read",
      category: "Security",
      featured: true,
      image: "/api/placeholder/600/300"
    },
    {
      id: 2,
      title: "Building Scalable Database Infrastructure",
      excerpt: "Learn how to design and implement database systems that can grow with your business while maintaining performance and reliability.",
      author: "Michael Rodriguez",
      date: "November 28, 2025",
      readTime: "8 min read",
      category: "Infrastructure",
      featured: false,
      image: "/api/placeholder/600/300"
    },
    {
      id: 3,
      title: "Zero-Trust Network Access: A Complete Guide",
      excerpt: "Understanding the principles of zero-trust security and how to implement it in your organization for maximum protection.",
      author: "Emily Johnson",
      date: "November 25, 2025",
      readTime: "6 min read",
      category: "Security",
      featured: false,
      image: "/api/placeholder/600/300"
    },
    {
      id: 4,
      title: "Cloud Hosting vs Traditional Servers: Making the Right Choice",
      excerpt: "A comprehensive comparison of cloud and traditional hosting solutions to help you make informed infrastructure decisions.",
      author: "David Kim",
      date: "November 22, 2025",
      readTime: "7 min read",
      category: "Cloud",
      featured: false,
      image: "/api/placeholder/600/300"
    },
    {
      id: 5,
      title: "Best Practices for Remote Team Security",
      excerpt: "Essential security measures every remote team should implement to protect sensitive data and maintain productivity.",
      author: "Lisa Wang",
      date: "November 19, 2025",
      readTime: "4 min read",
      category: "Remote Work",
      featured: false,
      image: "/api/placeholder/600/300"
    },
    {
      id: 6,
      title: "Automating Your DevOps Pipeline for Better Security",
      excerpt: "How to integrate security checks into your CI/CD pipeline for faster, safer deployments.",
      author: "Alex Thompson",
      date: "November 16, 2025",
      readTime: "9 min read",
      category: "DevOps",
      featured: false,
      image: "/api/placeholder/600/300"
    }
  ];

  const categories = [
    { name: "All", count: blogPosts.length, color: "from-gray-500 to-gray-600" },
    { name: "Security", count: 2, color: "from-red-500 to-red-600" },
    { name: "Infrastructure", count: 1, color: "from-blue-500 to-blue-600" },
    { name: "Cloud", count: 1, color: "from-green-500 to-green-600" },
    { name: "Remote Work", count: 1, color: "from-purple-500 to-purple-600" },
    { name: "DevOps", count: 1, color: "from-yellow-500 to-yellow-600" }
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
    .from(".blog-subtitle", {
      duration: 1,
      y: 40,
      opacity: 0,
      ease: "power2.out"
    }, "-=0.6")
    .from(".blog-search", {
      duration: 0.8,
      y: 30,
      opacity: 0,
      scale: 0.9,
      ease: "back.out(1.7)"
    }, "-=0.4");

    // Categories animation
    gsap.fromTo(".category-card", {
      y: 30,
      opacity: 0,
      scale: 0.9
    }, {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.6,
      stagger: 0.1,
      ease: "back.out(1.7)",
      scrollTrigger: {
        trigger: categoriesRef.current,
        start: "top 80%",
        toggleActions: "play none none none"
      }
    });

    // Blog posts animation
    gsap.fromTo(".blog-post", {
      y: 50,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.2,
      ease: "power2.out",
      scrollTrigger: {
        trigger: postsRef.current,
        start: "top 80%",
        toggleActions: "play none none none"
      }
    });

    // Floating elements
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
      <div className="fixed inset-0 bg-linear-to-br from-white via-green-50 to-yellow-50">
        <div className="absolute inset-0 bg-linear-to-tr from-emerald-100/40 via-transparent to-yellow-100/40"></div>
        <div className="absolute top-20 right-32 w-72 h-72 bg-linear-to-r from-emerald-300/30 to-green-300/30 rounded-full blur-3xl animate-pulse floating-element"></div>
        <div className="absolute bottom-40 left-20 w-64 h-64 bg-linear-to-r from-yellow-300/25 to-amber-300/25 rounded-full blur-3xl animate-pulse floating-element"></div>
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
            Our Blog
          </h1>
          
          <p className="blog-subtitle text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
            Insights, tutorials, and industry trends from our security experts
          </p>
          
          <div className="blog-search max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles..."
                className="w-full pl-10 pr-4 py-3 bg-white/70 backdrop-blur-sm border border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div ref={categoriesRef} className="py-12 relative z-10">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {categories.map((category, index) => (
              <div key={index} className="category-card">
                <Badge 
                  variant="outline" 
                  className={`px-4 py-2 bg-linear-to-r ${category.color} text-white border-0 hover:opacity-80 transition-opacity cursor-pointer`}
                >
                  {category.name} ({category.count})
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Post */}
      <div className="py-12 relative z-10">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Featured Article</h2>
            </div>
            
            {blogPosts.filter(post => post.featured).map((post) => (
              <Card key={post.id} className="blog-post bg-white/70 border-emerald-200 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
                <div className="md:flex">
                  <div className="md:w-1/2">
                    <div className="h-64 md:h-full bg-linear-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-white" />
                    </div>
                  </div>
                  <div className="md:w-1/2 p-8">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className="bg-emerald-500">{post.category}</Badge>
                      <Badge variant="outline">Featured</Badge>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">{post.title}</h3>
                    <p className="text-gray-600 leading-relaxed mb-6">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {post.author}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {post.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {post.readTime}
                        </div>
                      </div>
                      <Button className="bg-emerald-600 hover:bg-emerald-700">
                        Read More <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Posts */}
      <div ref={postsRef} className="py-20 bg-linear-to-b from-green-50/50 to-yellow-50/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Latest Articles</h2>
            <p className="text-xl text-gray-600">Stay up to date with industry insights and best practices</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {blogPosts.filter(post => !post.featured).map((post, index) => (
              <Card key={post.id} className="blog-post bg-white/70 border-emerald-200 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer">
                <div className="h-48 bg-linear-to-br from-emerald-500 to-green-600 flex items-center justify-center group-hover:from-emerald-600 group-hover:to-green-700 transition-all duration-300">
                  {post.category === 'Security' && <Lock className="h-12 w-12 text-white" />}
                  {post.category === 'Infrastructure' && <Globe className="h-12 w-12 text-white" />}
                  {post.category === 'Cloud' && <Zap className="h-12 w-12 text-white" />}
                  {post.category === 'Remote Work' && <User className="h-12 w-12 text-white" />}
                  {post.category === 'DevOps' && <TrendingUp className="h-12 w-12 text-white" />}
                </div>
                <CardHeader className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-emerald-600 border-emerald-600">
                      {post.category}
                    </Badge>
                    <span className="text-sm text-gray-500">{post.readTime}</span>
                  </div>
                  <CardTitle className="text-lg text-gray-800 group-hover:text-emerald-600 transition-colors line-clamp-2">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <CardDescription className="text-gray-600 leading-relaxed mb-4 line-clamp-3">
                    {post.excerpt}
                  </CardDescription>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {post.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <Button size="lg" variant="outline" className="border-emerald-300 text-emerald-600 hover:bg-emerald-50">
              Load More Articles
            </Button>
          </div>
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="py-20 bg-linear-to-r from-emerald-600 to-green-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Stay Updated
          </h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter for the latest security insights and industry updates.
          </p>
          
          <div className="max-w-md mx-auto">
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <Button className="bg-white text-emerald-600 hover:bg-emerald-50 px-6">
                Subscribe
              </Button>
            </div>
            <p className="text-emerald-200 text-sm mt-3">
              No spam. Unsubscribe at any time.
            </p>
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
              © 2025 VPN Enterprise. Sharing knowledge to build a more secure world.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}