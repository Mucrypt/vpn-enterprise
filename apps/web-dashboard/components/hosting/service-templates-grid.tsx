"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, ShoppingCart, GamepadIcon, Bot, Check, Zap } from 'lucide-react';
import Link from 'next/link';

type TemplateCategory = 'website' | 'ecommerce' | 'game' | 'bot';

interface ServiceTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  startingPrice: string;
  features: string[];
  category: TemplateCategory;
  popular?: boolean;
}

export interface ServiceTemplatesGridProps {
  onSelectTemplate?: (templateKey: string) => void;
}

const templates: ServiceTemplate[] = [
  {
    id: 'wordpress',
    name: 'WordPress Hosting',
    description: 'One-click WordPress installation with optimized performance',
    icon: Globe,
    startingPrice: '$4.99/mo',
    features: ['Free SSL Certificate', 'Auto-updates', 'Email Accounts', 'Daily Backups'],
    category: 'website',
    popular: true,
  },
  {
    id: 'woocommerce',
    name: 'E-commerce Hosting',
    description: 'WooCommerce & OpenCart ready with payment gateway setup',
    icon: ShoppingCart,
    startingPrice: '$9.99/mo',
    features: ['SSL Certificate', 'Payment Gateway Setup', 'Inventory Management', 'Sales Analytics'],
    category: 'ecommerce',
  },
  {
    id: 'minecraft',
    name: 'Minecraft Server',
    description: 'High-performance Minecraft server with mod support',
    icon: GamepadIcon,
    startingPrice: '$8.99/mo',
    features: ['Auto Backup', 'Mod Support', 'DDoS Protection', '24/7 Uptime'],
    category: 'game',
  },
  {
    id: 'counter-strike',
    name: 'Counter-Strike 2',
    description: 'Dedicated CS2 server with competitive settings',
    icon: GamepadIcon,
    startingPrice: '$12.99/mo',
    features: ['Low Latency', 'Custom Maps', 'Admin Tools', 'Performance Monitoring'],
    category: 'game',
  },
  {
    id: 'discord-bot',
    name: 'Discord Bot Hosting',
    description: 'Reliable hosting for your Discord bots with auto-restart',
    icon: Bot,
    startingPrice: '$3.99/mo',
    features: ['Auto Restart', 'Logs', 'Scaling', 'Health Checks'],
    category: 'bot',
  },
  {
    id: 'nodejs',
    name: 'Node.js Application',
    description: 'Deploy your Node.js applications with ease',
    icon: Zap,
    startingPrice: '$6.99/mo',
    features: ['Git Deployment', 'Environment Variables', 'SSL Support', 'Scale Automatically'],
    category: 'website',
  },
];

function getCategoryColor(category: TemplateCategory) {
  switch (category) {
    case 'website':
      return 'text-blue-600 bg-blue-100';
    case 'ecommerce':
      return 'text-green-600 bg-green-100';
    case 'game':
      return 'text-purple-600 bg-purple-100';
    case 'bot':
      return 'text-orange-600 bg-orange-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

function getCategoryLabel(category: TemplateCategory) {
  switch (category) {
    case 'website':
      return 'Website';
    case 'ecommerce':
      return 'E-commerce';
    case 'game':
      return 'Game Server';
    case 'bot':
      return 'Bot Hosting';
    default:
      return category;
  }
}

export function ServiceTemplatesGrid({ onSelectTemplate }: ServiceTemplatesGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((template) => {
        const IconComponent = template.icon;
        return (
          <Card
            key={template.id}
            className={`relative transition-all hover:shadow-lg ${
              template.popular ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            {template.popular && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-600 text-white px-3 py-1 text-xs">Most Popular</Badge>
              </div>
            )}

            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="h-12 w-12 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <Badge className={getCategoryColor(template.category)}>
                  {getCategoryLabel(template.category)}
                </Badge>
              </div>
              <CardTitle className="text-xl">{template.name}</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                {template.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">{template.startingPrice}</span>
                {onSelectTemplate ? (
                  <Button size="sm" onClick={() => onSelectTemplate(template.id)}>Select</Button>
                ) : (
                  <Link href={`/dashboard/hosting/create?template=${template.id}`}>
                    <Button size="sm">Select</Button>
                  </Link>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900">Features included:</h4>
                <ul className="space-y-1">
                  {template.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500 mr-2 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
