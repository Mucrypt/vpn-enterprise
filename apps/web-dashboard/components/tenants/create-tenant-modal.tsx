'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Building2, 
  Crown, 
  Zap, 
  Shield, 
  Check, 
  AlertCircle,
  Globe,
  Users,
  Database,
  HardDrive,
  Loader2
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CreateTenantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTenantCreated: (tenant: any) => void;
}

interface PlanLimits {
  maxUsers: number;
  maxStorageGb: number;
  maxDatabases: number;
  features: string[];
  price: string;
}

const plans: Record<string, PlanLimits> = {
  free: {
    maxUsers: 5,
    maxStorageGb: 1,
    maxDatabases: 2,
    features: ['Basic database access', 'Community support', 'Standard SSL'],
    price: 'Free'
  },
  pro: {
    maxUsers: 25,
    maxStorageGb: 10,
    maxDatabases: 10,
    features: ['Advanced analytics', 'Priority support', 'Custom domains', 'API access'],
    price: '$29/month'
  },
  enterprise: {
    maxUsers: 100,
    maxStorageGb: 100,
    maxDatabases: 50,
    features: ['Unlimited features', 'Dedicated support', 'SLA guarantee', 'Custom integrations', 'Advanced security'],
    price: '$199/month'
  }
};

const getPlanIcon = (plan: string) => {
  switch (plan) {
    case 'enterprise': return <Crown className="h-5 w-5 text-purple-600" />;
    case 'pro': return <Zap className="h-5 w-5 text-blue-600" />;
    default: return <Shield className="h-5 w-5 text-gray-600" />;
  }
};

export function CreateTenantModal({ open, onOpenChange, onTenantCreated }: CreateTenantModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    description: '',
    planType: 'free' as keyof typeof plans,
    enableRealtime: false,
    enableAnalytics: true,
    customDomain: '',
    adminEmail: '',
    initialSchema: 'public'
  });

  // Validation state
  const [validation, setValidation] = useState({
    subdomainAvailable: null as boolean | null,
    subdomainChecking: false
  });

  const validateSubdomain = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setValidation(prev => ({ ...prev, subdomainAvailable: false }));
      return;
    }

    setValidation(prev => ({ ...prev, subdomainChecking: true }));
    
    // Simulate subdomain availability check
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock availability check - in real app, call API
    const isAvailable = !['admin', 'api', 'www', 'mail'].includes(subdomain.toLowerCase());
    setValidation(prev => ({ 
      ...prev, 
      subdomainAvailable: isAvailable, 
      subdomainChecking: false 
    }));
  };

  const handleSubdomainChange = (value: string) => {
    // Clean subdomain: lowercase, alphanumeric, hyphens only
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData(prev => ({ ...prev, subdomain: cleaned }));
    
    // Debounce validation
    const timer = setTimeout(() => validateSubdomain(cleaned), 300);
    return () => clearTimeout(timer);
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/tenants/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          subdomain: formData.subdomain,
          plan_type: formData.planType,
          description: formData.description,
          admin_email: formData.adminEmail,
          settings: {
            enable_realtime: formData.enableRealtime,
            enable_analytics: formData.enableAnalytics,
            custom_domain: formData.customDomain,
            initial_schema: formData.initialSchema
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create tenant: ${response.status}`);
      }

      const { tenant } = await response.json();
      onTenantCreated(tenant);
      onOpenChange(false);
      
      // Reset form
      setFormData({
        name: '',
        subdomain: '',
        description: '',
        planType: 'free',
        enableRealtime: false,
        enableAnalytics: true,
        customDomain: '',
        adminEmail: '',
        initialSchema: 'public'
      });
      setStep(1);
      
    } catch (e: any) {
      setError(e?.message || 'Failed to create tenant');
    } finally {
      setLoading(false);
    }
  };

  const canProceedFromStep1 = formData.name && formData.subdomain && validation.subdomainAvailable;
  const canProceedFromStep2 = formData.planType;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1e1e1e] border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Building2 className="h-5 w-5" />
            Create New Tenant
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Step {step} of 3: {step === 1 ? 'Basic Information' : step === 2 ? 'Plan Selection' : 'Configuration & Review'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="bg-red-900/20 border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {/* Progress Indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i < step ? 'bg-emerald-600 text-white' : 
                i === step ? 'bg-emerald-600/20 text-emerald-400 border-2 border-emerald-600' : 
                'bg-gray-700 text-gray-400'
              }`}>
                {i < step ? <Check className="h-4 w-4" /> : i}
              </div>
              {i < 3 && (
                <div className={`w-12 h-0.5 ${
                  i < step ? 'bg-emerald-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-200">Tenant Name *</Label>
                <Input
                  id="name"
                  placeholder="My Organization"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subdomain" className="text-gray-200">Subdomain *</Label>
                <div className="flex">
                  <Input
                    id="subdomain"
                    placeholder="myorg"
                    value={formData.subdomain}
                    onChange={(e) => handleSubdomainChange(e.target.value)}
                    className={`rounded-r-none ${
                      validation.subdomainAvailable === true ? 'border-green-500' :
                      validation.subdomainAvailable === false ? 'border-red-500' : ''
                    }`}
                  />
                  <div className="px-3 py-2 bg-gray-700 border border-l-0 rounded-r-md text-sm text-gray-300 flex items-center">
                    .vpn-enterprise.com
                  </div>
                </div>
                {validation.subdomainChecking && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Checking availability...
                  </div>
                )}
                {validation.subdomainAvailable === true && (
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <Check className="h-3 w-3" />
                    Subdomain is available
                  </div>
                )}
                {validation.subdomainAvailable === false && (
                  <div className="flex items-center gap-2 text-sm text-red-400">
                    <AlertCircle className="h-3 w-3" />
                    Subdomain is not available
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-200">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this tenant's purpose..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminEmail" className="text-gray-200">Administrator Email</Label>
              <Input
                id="adminEmail"
                type="email"
                placeholder="admin@myorg.com"
                value={formData.adminEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
              />
            </div>
          </div>
        )}

        {/* Step 2: Plan Selection */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="grid gap-4">
              {Object.entries(plans).map(([planKey, plan]) => (
                <Card 
                  key={planKey}
                  className={`cursor-pointer transition-all hover:shadow-md bg-[#252525] border-gray-700 ${
                    formData.planType === planKey 
                      ? 'ring-2 ring-emerald-500 border-emerald-500' 
                      : 'hover:border-gray-600'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, planType: planKey as keyof typeof plans }))}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getPlanIcon(planKey)}
                        <div>
                          <CardTitle className="text-lg capitalize text-white">{planKey}</CardTitle>
                          <CardDescription className="text-gray-300">{plan.price}</CardDescription>
                        </div>
                      </div>
                      {formData.planType === planKey && (
                        <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-200">{plan.maxUsers} users</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-200">{plan.maxStorageGb} GB</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-200">{plan.maxDatabases} DBs</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {plan.features.slice(0, 3).map((feature, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {plan.features.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{plan.features.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Configuration */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-white">Features</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="realtime" className="text-gray-200">Real-time Features</Label>
                      <div className="text-xs text-gray-400">Enable live data synchronization</div>
                    </div>
                    <Switch
                      id="realtime"
                      checked={formData.enableRealtime}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableRealtime: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="analytics" className="text-gray-200">Analytics</Label>
                      <div className="text-xs text-gray-400">Track usage and performance</div>
                    </div>
                    <Switch
                      id="analytics"
                      checked={formData.enableAnalytics}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableAnalytics: checked }))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-white">Advanced Settings</h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="customDomain" className="text-gray-200">Custom Domain (Optional)</Label>
                    <Input
                      id="customDomain"
                      placeholder="app.myorg.com"
                      value={formData.customDomain}
                      onChange={(e) => setFormData(prev => ({ ...prev, customDomain: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="initialSchema" className="text-gray-200">Initial Schema</Label>
                    <Select value={formData.initialSchema} onValueChange={(value) => setFormData(prev => ({ ...prev, initialSchema: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">public (default)</SelectItem>
                        <SelectItem value="private">private</SelectItem>
                        <SelectItem value="tenant">tenant-specific</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Review Summary */}
            <Card className="bg-[#252525] border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-white">Review Your Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-gray-200">
                    <strong className="text-white">Name:</strong> {formData.name}
                  </div>
                  <div className="text-gray-200">
                    <strong className="text-white">Subdomain:</strong> {formData.subdomain}.vpn-enterprise.com
                  </div>
                  <div className="text-gray-200">
                    <strong className="text-white">Plan:</strong> {formData.planType} ({plans[formData.planType].price})
                  </div>
                  <div className="text-gray-200">
                    <strong className="text-white">Admin Email:</strong> {formData.adminEmail || 'Not specified'}
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-600">
                  <div className="flex gap-4 text-xs">
                    <span className={formData.enableRealtime ? 'text-green-400' : 'text-gray-400'}>
                      Real-time: {formData.enableRealtime ? 'Enabled' : 'Disabled'}
                    </span>
                    <span className={formData.enableAnalytics ? 'text-green-400' : 'text-gray-400'}>
                      Analytics: {formData.enableAnalytics ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter className="gap-2">
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} disabled={loading}>
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button 
                onClick={handleNext} 
                disabled={step === 1 ? !canProceedFromStep1 : !canProceedFromStep2}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Continue
              </Button>
            ) : (
              <Button 
                onClick={handleCreate} 
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Tenant'
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}