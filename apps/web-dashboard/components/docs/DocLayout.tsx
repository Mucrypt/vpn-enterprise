"use client";

import Link from 'next/link';
import { Shield, Menu, X, Github, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DocSidebar from '@/components/docs/DocSidebar';
import { useState, useEffect } from 'react';

interface DocLayoutProps {
  children: React.ReactNode;
}

export default function DocLayout({ children }: DocLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-white via-green-50/30 to-yellow-50/30">
      
      {/* Top Navigation - Fixed */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-emerald-200 h-16">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Logo + Mobile Menu */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              
              <Link href="/" className="flex items-center gap-3">
                <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="font-bold text-gray-800">VPN Enterprise</span>
                  <span className="ml-2 text-sm text-gray-500">Docs</span>
                </div>
              </Link>
            </div>

            {/* Right: Navigation Links */}
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="hidden sm:block text-sm text-gray-600 hover:text-emerald-600 transition-colors"
              >
                ← Back to Home
              </Link>
              
              <Link
                href="https://github.com/vpn-enterprise"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Github className="h-5 w-5" />
              </Link>
              
              <Link href="/dashboard">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar - Completely Fixed Position */}
      <aside className={`
        fixed top-16 left-0 z-40
        w-80 h-[calc(100vh-4rem)] bg-white border-r border-emerald-100
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        hidden lg:block
      `}>
        <DocSidebar />
      </aside>

      {/* Mobile Sidebar */}
      <aside className={`
        fixed top-16 left-0 z-40
        w-80 h-[calc(100vh-4rem)] bg-white border-r border-emerald-100
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:hidden
      `}>
        <DocSidebar />
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/20 lg:hidden top-16"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content - With Left Margin for Sidebar */}
      <main className="pt-16 lg:pl-80 h-screen overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}