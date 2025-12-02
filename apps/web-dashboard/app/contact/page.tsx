"use client";

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Shield, ArrowLeft, Mail, Phone, MapPin, 
  Clock, Send, CheckCircle, MessageCircle,
  Headphones, HelpCircle, Globe, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ContactPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const contactInfoRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: '',
    inquiryType: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Get in touch via email for general inquiries and support",
      contact: "hello@vpnenterprise.com",
      action: "Send Email",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with our team for immediate assistance",
      contact: "Available 24/7",
      action: "Start Chat",
      color: "from-green-500 to-green-600"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak directly with our enterprise support team",
      contact: "+1 (555) 123-4567",
      action: "Call Now",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: HelpCircle,
      title: "Help Center",
      description: "Browse our comprehensive documentation and guides",
      contact: "Available 24/7",
      action: "Visit Center",
      color: "from-yellow-500 to-yellow-600"
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (value: string) => {
    setFormData({ ...formData, inquiryType: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Reset form after success message
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        company: '',
        subject: '',
        message: '',
        inquiryType: ''
      });
    }, 3000);
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
    .from(".contact-subtitle", {
      duration: 1,
      y: 40,
      opacity: 0,
      ease: "power2.out"
    }, "-=0.6")
    .from(".contact-description", {
      duration: 0.8,
      y: 30,
      opacity: 0,
      ease: "back.out(1.7)"
    }, "-=0.4");

    // Contact methods animation
    gsap.fromTo(".contact-method", {
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
        trigger: contactInfoRef.current,
        start: "top 80%",
        toggleActions: "play none none none"
      }
    });

    // Form animation
    gsap.fromTo(formRef.current, {
      x: 50,
      opacity: 0
    }, {
      x: 0,
      opacity: 1,
      duration: 1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: formRef.current,
        start: "top 80%",
        toggleActions: "play none none none"
      }
    });

    // Floating elements
    gsap.to(".floating-element", {
      y: -20,
      duration: 4,
      ease: "power1.inOut",
      yoyo: true,
      repeat: -1,
      stagger: 0.6
    });

  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-white via-green-50 to-yellow-50">
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100/40 via-transparent to-yellow-100/40"></div>
        <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-r from-emerald-300/30 to-green-300/30 rounded-full blur-3xl animate-pulse floating-element"></div>
        <div className="absolute bottom-32 left-32 w-64 h-64 bg-gradient-to-r from-yellow-300/25 to-amber-300/25 rounded-full blur-3xl animate-pulse floating-element"></div>
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
            Contact Us
          </h1>
          
          <p className="contact-subtitle text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
            Get in touch with our team for support, sales, or partnership inquiries
          </p>
          
          <div className="contact-description max-w-2xl mx-auto">
            <p className="text-lg text-gray-600 leading-relaxed">
              We're here to help you succeed with VPN Enterprise. Whether you need technical support, 
              have questions about our services, or want to explore partnership opportunities, we'd love to hear from you.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Methods */}
      <div ref={contactInfoRef} className="py-20 relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">How Can We Help?</h2>
            <p className="text-xl text-gray-600">Choose the best way to reach our team</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {contactMethods.map((method, index) => (
              <Card key={index} className="contact-method bg-white/70 border-emerald-200 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 text-center group cursor-pointer">
                <CardHeader>
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${method.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <method.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl text-gray-800 group-hover:text-emerald-600 transition-colors">
                    {method.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed mb-4">
                    {method.description}
                  </CardDescription>
                  <div className="text-emerald-600 font-semibold mb-4">{method.contact}</div>
                  <Button 
                    variant="outline" 
                    className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 group-hover:border-emerald-500"
                  >
                    {method.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Form & Info */}
      <div className="py-20 bg-gradient-to-b from-green-50/50 to-yellow-50/50">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
            
            {/* Contact Form */}
            <div ref={formRef}>
              <Card className="bg-white/70 border-emerald-200 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-gray-800 text-center">Send us a Message</CardTitle>
                  <CardDescription className="text-center text-gray-600">
                    Fill out the form below and we'll get back to you within 24 hours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!isSubmitted ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="bg-white/50 border-emerald-200 focus:border-emerald-400"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="bg-white/50 border-emerald-200 focus:border-emerald-400"
                          />
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="company">Company</Label>
                          <Input
                            id="company"
                            name="company"
                            value={formData.company}
                            onChange={handleInputChange}
                            className="bg-white/50 border-emerald-200 focus:border-emerald-400"
                          />
                        </div>
                        <div>
                          <Label htmlFor="inquiryType">Inquiry Type</Label>
                          <Select onValueChange={handleSelectChange}>
                            <SelectTrigger className="bg-white/50 border-emerald-200 focus:border-emerald-400">
                              <SelectValue placeholder="Select inquiry type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sales">Sales</SelectItem>
                              <SelectItem value="support">Technical Support</SelectItem>
                              <SelectItem value="partnership">Partnership</SelectItem>
                              <SelectItem value="billing">Billing</SelectItem>
                              <SelectItem value="general">General</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="subject">Subject *</Label>
                        <Input
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          required
                          className="bg-white/50 border-emerald-200 focus:border-emerald-400"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="message">Message *</Label>
                        <Textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          required
                          rows={5}
                          className="bg-white/50 border-emerald-200 focus:border-emerald-400"
                          placeholder="Tell us how we can help you..."
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Sending...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Send className="h-4 w-4" />
                            Send Message
                          </div>
                        )}
                      </Button>
                    </form>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">Message Sent!</h3>
                      <p className="text-gray-600">
                        Thank you for contacting us. We'll get back to you within 24 hours.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h3 className="text-3xl font-bold text-gray-800 mb-6">Get in Touch</h3>
                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                  We're committed to providing exceptional support and service to all our customers. 
                  Choose the contact method that works best for you.
                </p>
              </div>

              <div className="space-y-6">
                <Card className="bg-white/70 border-emerald-200 backdrop-blur-sm shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <Mail className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Email</h4>
                        <p className="text-gray-600">hello@vpnenterprise.com</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/70 border-emerald-200 backdrop-blur-sm shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                        <Phone className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Phone</h4>
                        <p className="text-gray-600">+1 (555) 123-4567</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/70 border-emerald-200 backdrop-blur-sm shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Support Hours</h4>
                        <p className="text-gray-600">24/7 for Enterprise customers</p>
                        <p className="text-gray-600 text-sm">9 AM - 6 PM EST for others</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/70 border-emerald-200 backdrop-blur-sm shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                        <Globe className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Global Presence</h4>
                        <p className="text-gray-600">Serving customers in 50+ countries</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Response Time */}
              <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
                <CardContent className="p-6 text-center">
                  <Zap className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
                  <h4 className="font-bold text-gray-800 mb-2">Lightning Fast Response</h4>
                  <p className="text-gray-600 text-sm">
                    Average response time: 2 hours for Enterprise, 24 hours for all others
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-20 relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Find quick answers to common questions</p>
          </div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
            {[
              {
                question: "What's your average response time?",
                answer: "We respond to enterprise customers within 2 hours and all other inquiries within 24 hours during business days."
              },
              {
                question: "Do you offer phone support?",
                answer: "Yes, phone support is available for Enterprise plan customers 24/7. Other plans have access during business hours."
              },
              {
                question: "Can I schedule a demo?",
                answer: "Absolutely! Contact our sales team to schedule a personalized demo of our platform and features."
              },
              {
                question: "How can I become a partner?",
                answer: "We're always looking for great partners. Contact us with 'Partnership' as your inquiry type to learn more."
              }
            ].map((faq, index) => (
              <Card key={index} className="bg-white/70 border-emerald-200 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-800">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
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
              © 2025 VPN Enterprise. We're here to help you succeed.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}