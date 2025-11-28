// apps/web-dashboard/app/dashboard/hosting/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Check,
  Server,
  Cpu,
  HardDrive,
  Network,
  Shield,
  Database
} from 'lucide-react';
import { ServiceTemplatesGrid } from '@/components/hosting/service-templates-grid';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface HostingPlan {
  id: string;
  name: string;
  type: string;
  price_monthly: number;
  storage_gb: number;
  bandwidth_gb?: number;
  features: string[];
  resources: {
    cpu: number;
    memory: string;
    storage: string;
  };
}

export default function CreateHostingService() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const template = searchParams.get('template');

  const [step, setStep] = useState(template ? 1 : 0);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(template || '');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [plans, setPlans] = useState<HostingPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    description: '',
    // WordPress specific
    adminEmail: '',
    adminPassword: '',
    // Game server specific
    slots: 20,
    gameMode: 'survival',
    // Discord bot specific
    botToken: '',
  });

  useEffect(() => {
    if (template) {
      setSelectedTemplate(template);
      setStep(1);
    }
  }, [template]);

  useEffect(() => {
    const loadPlans = async () => {
      if (!selectedTemplate) {
        setPlans([]);
        return;
      }
      try {
        setPlansLoading(true);
        setPlansError(null);
        const result = await api.getHostingPlans({ type: selectedTemplate });
        // getHostingPlans returns an array of plans
        setPlans(Array.isArray(result) ? result : []);
        // Reset selected plan if it no longer exists in the fetched plans
        if (!(Array.isArray(result) && result.some((p: HostingPlan) => p.id === selectedPlan))) {
          setSelectedPlan('');
        }
      } catch (err: any) {
        console.error('Failed to load plans', err);
        setPlansError(err?.message || 'Failed to load plans');
        setPlans([]);
      } finally {
        setPlansLoading(false);
      }
    };
    loadPlans();
  }, [selectedTemplate]);

  const handleCreateService = async () => {
    if (!selectedTemplate || !selectedPlan || !formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const serviceConfig = {
        type: selectedTemplate,
        ...formData,
      };

      const result = await api.createHostedService({
        plan_id: selectedPlan,
        name: formData.name,
        domain: formData.domain || undefined,
        config: serviceConfig,
      });

      toast.success('Service created successfully! Deploying now...');
      router.push(`/dashboard/hosting/services/${result.service.id}`);
    } catch (error: any) {
      console.error('Failed to create service:', error);
      toast.error(error.message || 'Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  const renderTemplateSpecificFields = () => {
    switch (selectedTemplate) {
      case 'wordpress':
      case 'woocommerce':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email *</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  placeholder="admin@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminPassword">Admin Password *</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={formData.adminPassword}
                  onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                  placeholder="Secure password"
                  required
                />
              </div>
            </div>
          </div>
        );
      
      case 'minecraft':
      case 'counter-strike':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slots">Player Slots</Label>
                <Input
                  id="slots"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.slots}
                  onChange={(e) => setFormData({ ...formData, slots: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gameMode">Game Mode</Label>
                <select
                  id="gameMode"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                  value={formData.gameMode}
                  onChange={(e) => setFormData({ ...formData, gameMode: e.target.value })}
                >
                  <option value="survival">Survival</option>
                  <option value="creative">Creative</option>
                  <option value="adventure">Adventure</option>
                  <option value="competitive">Competitive</option>
                  <option value="casual">Casual</option>
                </select>
              </div>
            </div>
          </div>
        );
      
      case 'discord-bot':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="botToken">Discord Bot Token *</Label>
              <Input
                id="botToken"
                type="password"
                value={formData.botToken}
                onChange={(e) => setFormData({ ...formData, botToken: e.target.value })}
                placeholder="Paste your Discord bot token here"
                required
              />
              <p className="text-sm text-gray-600">
                You can get this from the Discord Developer Portal
              </p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (step === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Hosting Service</h1>
            <p className="text-gray-600 mt-1">Choose a template to get started</p>
          </div>
        </div>
        
        <ServiceTemplatesGrid
          onSelectTemplate={(tpl: string) => {
            setSelectedTemplate(tpl);
            setStep(1);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => setStep(0)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Templates
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configure Your Service</h1>
          <p className="text-gray-600 mt-1">Set up your {selectedTemplate} hosting</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Configuration</CardTitle>
              <CardDescription>
                Basic information about your new service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Awesome Website"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="domain">Domain (Optional)</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="example.com"
                />
                <p className="text-sm text-gray-600">
                  Leave blank to use a subdomain. You can add a custom domain later.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this service will be used for..."
                  rows={3}
                />
              </div>

              {renderTemplateSpecificFields()}
            </CardContent>
          </Card>
        </div>

        {/* Plan Selection & Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Choose a Plan</CardTitle>
              <CardDescription>Select the resources you need</CardDescription>
            </CardHeader>
            <CardContent>
              {plansLoading && (
                <div className="space-y-3">
                  {[1,2,3].map((i) => (
                    <div key={i} className="flex items-center space-x-3 animate-pulse">
                      <div className="h-4 w-4 rounded-full bg-gray-200" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3" />
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="h-3 bg-gray-200 rounded w-16" />
                          <div className="h-3 bg-gray-200 rounded w-16" />
                          <div className="h-3 bg-gray-200 rounded w-16" />
                        </div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-16" />
                    </div>
                  ))}
                </div>
              )}
              {plansError && (
                <div className="text-sm text-red-600">{plansError}</div>
              )}
              {!plansLoading && !plansError && (
                <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan} className="space-y-3">
                  {plans.map((plan) => (
                    <div key={plan.id} className="flex items-center space-x-3">
                      <RadioGroupItem value={plan.id} id={plan.id} />
                      <Label htmlFor={plan.id} className="flex-1 cursor-pointer">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">{plan.name}</span>
                          <span className="text-lg font-bold text-blue-600">
                            ${plan.price_monthly}/mo
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Cpu className="h-3 w-3" />
                              <span>{plan.resources.cpu} CPU</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Server className="h-3 w-3" />
                              <span>{plan.resources.memory}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <HardDrive className="h-3 w-3" />
                              <span>{plan.storage_gb}GB</span>
                            </div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                  {plans.length === 0 && (
                    <div className="text-sm text-gray-600">No plans available for this template.</div>
                  )}
                </RadioGroup>
              )}
            </CardContent>
          </Card>

          {/* Order Summary */}
          {selectedPlan && (
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-semibold">
                    {plans.find(p => p.id === selectedPlan)?.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Price</span>
                  <span className="text-xl font-bold text-blue-600">
                    ${plans.find(p => p.id === selectedPlan)?.price_monthly}/mo
                  </span>
                </div>
                
                <div className="pt-4 border-t">
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleCreateService}
                    disabled={loading || !formData.name}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Service...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Create Service
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}