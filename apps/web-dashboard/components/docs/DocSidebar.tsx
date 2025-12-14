"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  BookOpen, Code, Shield, Database, Server, 
  Zap, Users, Settings, Key, Lock, Globe,
  ChevronDown, ChevronRight, Search, FileText,
  Rocket, Terminal, Cpu, Network, Cloud
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  title: string;
  href?: string;
  icon?: any;
  badge?: string;
  children?: NavItem[];
}

const navigationData: NavItem[] = [
  {
    title: "Getting Started",
    icon: Rocket,
    children: [
      { title: "Introduction", href: "/docs" },
      { title: "Quick Start", href: "/docs/quick-start" },
      { title: "Installation", href: "/docs/installation" },
      { title: "Configuration", href: "/docs/configuration" },
      { title: "First Steps", href: "/docs/first-steps" }
    ]
  },
  {
    title: "VPN Service",
    icon: Shield,
    children: [
      { title: "Overview", href: "/docs/vpn/overview" },
      { title: "Connection Setup", href: "/docs/vpn/setup" },
      { title: "Client Configuration", href: "/docs/vpn/client-config" },
      { title: "Server Management", href: "/docs/vpn/server-management" },
      { title: "Security Protocols", href: "/docs/vpn/security" },
      { title: "Troubleshooting", href: "/docs/vpn/troubleshooting" }
    ]
  },
  {
    title: "Database Service",
    icon: Database,
    children: [
      { title: "Overview", href: "/docs/database/overview" },
      { title: "Getting Started", href: "/docs/database/getting-started" },
      { title: "Connection Strings", href: "/docs/database/connection-strings" },
      { title: "Backup & Recovery", href: "/docs/database/backup-recovery" },
      { title: "Scaling", href: "/docs/database/scaling" },
      { title: "Performance", href: "/docs/database/performance" }
    ]
  },
  {
    title: "Cloud Hosting",
    icon: Cloud,
    children: [
      { title: "Overview", href: "/docs/cloud-hosting/overview" },
      { title: "Shared Hosting", href: "/docs/cloud-hosting/shared-hosting" },
      { title: "VPS Hosting", href: "/docs/cloud-hosting/vps-hosting" },
      { title: "Dedicated Hosting", href: "/docs/cloud-hosting/dedicated-hosting" },
      { title: "Storage Solutions", href: "/docs/cloud-hosting/storage" },
      { title: "Networking", href: "/docs/cloud-hosting/networking" },
      { title: "Migration Guide", href: "/docs/cloud-hosting/migration" }
    ]
  },
  {
    title: "API Reference",
    icon: Code,
    badge: "v2.0",
    children: [
      { title: "Overview", href: "/docs/api/overview" },
      { title: "Authentication", href: "/docs/api/authentication" },
      { title: "VPN Endpoints", href: "/docs/api/vpn" },
      { title: "Database Endpoints", href: "/docs/api/database" },
      { title: "Hosting Endpoints", href: "/docs/api/hosting" },
      { title: "User Management", href: "/docs/api/users" },
      { title: "Billing", href: "/docs/api/billing" },
      { title: "Webhooks", href: "/docs/api/webhooks" },
      { title: "Rate Limiting", href: "/docs/api/rate-limiting" }
    ]
  },
  {
    title: "SDKs & Tools",
    icon: Terminal,
    children: [
      { title: "JavaScript SDK", href: "/docs/sdk/javascript" },
      { title: "Python SDK", href: "/docs/sdk/python" },
      { title: "Go SDK", href: "/docs/sdk/go" },
      { title: "CLI Tool", href: "/docs/sdk/cli" },
      { title: "Terraform Provider", href: "/docs/sdk/terraform" }
    ]
  },
  {
    title: "Security",
    icon: Lock,
    children: [
      { title: "Overview", href: "/docs/security/overview" },
      { title: "Encryption", href: "/docs/security/encryption" },
      { title: "Access Control", href: "/docs/security/access-control" },
      { title: "Audit Logs", href: "/docs/security/audit-logs" },
      { title: "Compliance", href: "/docs/security/compliance" },
      { title: "Best Practices", href: "/docs/security/best-practices" }
    ]
  },
  {
    title: "Integrations",
    icon: Network,
    children: [
      { title: "Overview", href: "/docs/integrations/overview" },
      { title: "SSO Providers", href: "/docs/integrations/sso" },
      { title: "Monitoring Tools", href: "/docs/integrations/monitoring" },
      { title: "CI/CD Platforms", href: "/docs/integrations/cicd" },
      { title: "Third-party APIs", href: "/docs/integrations/apis" }
    ]
  },
  {
    title: "Guides & Tutorials",
    icon: BookOpen,
    children: [
      { title: "Team Setup", href: "/docs/guides/team-setup" },
      { title: "Production Deployment", href: "/docs/guides/production" },
      { title: "Multi-region Setup", href: "/docs/guides/multi-region" },
      { title: "Disaster Recovery", href: "/docs/guides/disaster-recovery" },
      { title: "Cost Optimization", href: "/docs/guides/cost-optimization" }
    ]
  },
  {
    title: "Reference",
    icon: FileText,
    children: [
      { title: "Error Codes", href: "/docs/reference/errors" },
      { title: "Status Codes", href: "/docs/reference/status-codes" },
      { title: "Limits & Quotas", href: "/docs/reference/limits" },
      { title: "Changelog", href: "/docs/reference/changelog" },
      { title: "Migration Guide", href: "/docs/reference/migration" }
    ]
  }
];

interface DocSidebarProps {
  className?: string;
}

export default function DocSidebar({ className }: DocSidebarProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "Getting Started", "API Reference" // Default expanded sections
  ]);

  const toggleSection = (title: string) => {
    setExpandedSections(prev =>
      prev.includes(title)
        ? prev.filter(s => s !== title)
        : [...prev, title]
    );
  };

  const isActiveLink = (href: string) => {
    if (href === "/docs") return pathname === "/docs";
    return pathname.startsWith(href);
  };

  const isParentActive = (children?: NavItem[]) => {
    if (!children) return false;
    return children.some(child => child.href && isActiveLink(child.href));
  };

  const filteredNavigation = navigationData.filter(section => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const titleMatch = section.title.toLowerCase().includes(searchLower);
    const childMatch = section.children?.some(child => 
      child.title.toLowerCase().includes(searchLower)
    );
    
    return titleMatch || childMatch;
  });

  return (
    <div className={`flex flex-col h-full ${className || ''}`}>
      {/* Search */}
      <div className="p-4 border-b border-emerald-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/50 border-emerald-200 focus:border-emerald-400"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-2">
          {filteredNavigation.map((section, index) => {
            const isExpanded = expandedSections.includes(section.title);
            const hasActiveChild = isParentActive(section.children);
            const IconComponent = section.icon;

            return (
              <div key={index} className="space-y-1">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.title)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg transition-all duration-200 group ${
                    hasActiveChild 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <IconComponent className={`h-4 w-4 ${
                      hasActiveChild ? 'text-emerald-600' : 'text-gray-500'
                    }`} />
                    <span className="font-medium text-sm">{section.title}</span>
                    {section.badge && (
                      <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                        {section.badge}
                      </Badge>
                    )}
                  </div>
                  {section.children && (
                    <div className={`transition-transform duration-200 ${
                      isExpanded ? 'rotate-90' : ''
                    }`}>
                      <ChevronRight className="h-3 w-3" />
                    </div>
                  )}
                </button>

                {/* Section Links */}
                {section.children && isExpanded && (
                  <div className="ml-6 space-y-1">
                    {section.children.map((item, itemIndex) => (
                      <Link
                        key={itemIndex}
                        href={item.href!}
                        className={`block px-3 py-1.5 text-sm rounded-md transition-all duration-200 ${
                          isActiveLink(item.href!)
                            ? 'bg-emerald-50 text-emerald-700 border-l-2 border-emerald-500 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-emerald-100 bg-gradient-to-r from-emerald-50 to-green-50">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-2">Need help?</p>
          <Link href="/contact" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
            Contact Support →
          </Link>
        </div>
      </div>
    </div>
  );
}