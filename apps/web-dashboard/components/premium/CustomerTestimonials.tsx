"use client";

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Star, Quote, Building, ChevronLeft, ChevronRight } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
  quote: string;
  companyLogo: React.ReactNode;
  metrics: {
    label: string;
    value: string;
    improvement: string;
  };
}

export default function CustomerTestimonials() {
  const containerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Sarah Chen",
      role: "CTO",
      company: "TechCorp Global",
      avatar: "SC",
      rating: 5,
      quote: "VPN Enterprise transformed our remote work infrastructure. The speed and security improvements have been remarkable, and our team productivity increased by 40%.",
      companyLogo: (
        <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Building className="w-6 h-6 text-white" />
        </div>
      ),
      metrics: {
        label: "Productivity Increase",
        value: "40%",
        improvement: "+40%"
      }
    },
    {
      id: 2,
      name: "Michael Rodriguez",
      role: "Security Director",
      company: "FinanceSecure Inc",
      avatar: "MR",
      rating: 5,
      quote: "The enterprise-grade security features are outstanding. We've had zero security incidents since implementing VPN Enterprise, and compliance audits are now a breeze.",
      companyLogo: (
        <div className="w-12 h-12 bg-linear-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
          <Building className="w-6 h-6 text-white" />
        </div>
      ),
      metrics: {
        label: "Security Incidents",
        value: "0",
        improvement: "-100%"
      }
    },
    {
      id: 3,
      name: "Emma Thompson",
      role: "Operations Manager",
      company: "CloudScale Solutions",
      avatar: "ET",
      rating: 5,
      quote: "Scalability and reliability are exactly what we needed. Our infrastructure costs decreased by 35% while performance improved dramatically across all global offices.",
      companyLogo: (
        <div className="w-12 h-12 bg-linear-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
          <Building className="w-6 h-6 text-white" />
        </div>
      ),
      metrics: {
        label: "Cost Reduction",
        value: "35%",
        improvement: "-35%"
      }
    },
    {
      id: 4,
      name: "David Kim",
      role: "IT Director",
      company: "DataFlow Systems",
      avatar: "DK",
      rating: 5,
      quote: "The deployment was seamless, and the ongoing support has been exceptional. Our network latency improved by 60%, making our global collaboration effortless.",
      companyLogo: (
        <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
          <Building className="w-6 h-6 text-white" />
        </div>
      ),
      metrics: {
        label: "Latency Improvement",
        value: "60%",
        improvement: "-60%"
      }
    }
  ];

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    if (!containerRef.current || !carouselRef.current) return;

    // Animate container entrance
    gsap.fromTo(containerRef.current, {
      opacity: 0,
      y: 50
    }, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 80%",
        toggleActions: "play none none reverse"
      }
    });

    // Auto-rotate testimonials
    const interval = setInterval(() => {
      nextTestimonial();
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!carouselRef.current) return;

    // Animate testimonial change
    gsap.fromTo(carouselRef.current, {
      opacity: 0,
      x: 50
    }, {
      opacity: 1,
      x: 0,
      duration: 0.8,
      ease: "power3.out"
    });
  }, [currentIndex]);

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div ref={containerRef} className="py-16 bg-linear-to-br from-white via-purple-50/30 to-pink-50/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100/60 rounded-full border border-purple-200 mb-4">
            <Star className="w-4 h-4 text-purple-600" />
            <span className="text-purple-700 font-medium text-sm">Customer Success Stories</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            What Our{' '}
            <span className="bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Customers Say
            </span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Discover how enterprises worldwide have transformed their infrastructure with VPN Enterprise Platform.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Main testimonial */}
          <div ref={carouselRef} className="bg-white/60 backdrop-blur-sm rounded-3xl border border-purple-200 p-8 shadow-2xl mb-8">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Testimonial content */}
              <div className="space-y-6">
                {/* Quote */}
                <div className="relative">
                  <Quote className="w-12 h-12 text-purple-300 absolute -top-2 -left-2" />
                  <blockquote className="text-xl text-gray-700 leading-relaxed pl-8 italic">
                    "{currentTestimonial.quote}"
                  </blockquote>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < currentTestimonial.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-gray-600 font-medium ml-2">
                    {currentTestimonial.rating}.0 / 5.0
                  </span>
                </div>

                {/* Author info */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-linear-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {currentTestimonial.avatar}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-800">
                      {currentTestimonial.name}
                    </h4>
                    <p className="text-gray-600">
                      {currentTestimonial.role} at {currentTestimonial.company}
                    </p>
                  </div>
                  <div className="ml-auto">
                    {currentTestimonial.companyLogo}
                  </div>
                </div>
              </div>

              {/* Metrics showcase */}
              <div className="space-y-6">
                <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200 p-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 text-center">
                    Business Impact
                  </h4>
                  
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600 mb-2">
                      {currentTestimonial.metrics.value}
                    </div>
                    <div className="text-gray-600 font-medium mb-2">
                      {currentTestimonial.metrics.label}
                    </div>
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-700 text-sm font-medium">
                        {currentTestimonial.metrics.improvement} improvement
                      </span>
                    </div>
                  </div>
                </div>

                {/* Key benefits */}
                <div className="space-y-3">
                  {[
                    "Enterprise-grade security",
                    "99.99% uptime guarantee",
                    "24/7 priority support",
                    "Global network coverage"
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-purple-100">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-700 font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation and indicators */}
          <div className="flex items-center justify-between">
            {/* Previous button */}
            <button
              onClick={prevTestimonial}
              className="p-3 bg-white/60 backdrop-blur-sm rounded-full border border-purple-200 hover:border-purple-300 transition-all duration-300 hover:shadow-lg group"
              data-magnetic
            >
              <ChevronLeft className="w-6 h-6 text-purple-600 group-hover:scale-110 transition-transform" />
            </button>

            {/* Indicators */}
            <div className="flex items-center gap-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'bg-purple-500 scale-110'
                      : 'bg-purple-200 hover:bg-purple-300'
                  }`}
                  data-magnetic
                />
              ))}
            </div>

            {/* Next button */}
            <button
              onClick={nextTestimonial}
              className="p-3 bg-white/60 backdrop-blur-sm rounded-full border border-purple-200 hover:border-purple-300 transition-all duration-300 hover:shadow-lg group"
              data-magnetic
            >
              <ChevronRight className="w-6 h-6 text-purple-600 group-hover:scale-110 transition-transform" />
            </button>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { value: "500+", label: "Enterprise Clients", icon: Building },
              { value: "99.99%", label: "Uptime SLA", icon: Star },
              { value: "150+", label: "Countries Served", icon: Building },
              { value: "24/7", label: "Support Available", icon: Star }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-purple-200">
                  <div className="flex justify-center mb-2">
                    <Icon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                  <div className="text-gray-600 text-sm">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}