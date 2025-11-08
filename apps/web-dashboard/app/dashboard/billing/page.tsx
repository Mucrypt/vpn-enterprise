'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { CreditCard, Download, FileText, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BillingPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBillingData();
  }, []);

  async function loadBillingData() {
    try {
      setLoading(true);
      const [subData, invoicesData, plansData] = await Promise.all([
        api.getSubscription().catch(() => ({ subscription: null })),
        api.getInvoices().catch(() => ({ invoices: [] })),
        api.getPlans().catch(() => ({ plans: [] })),
      ]);
      
      setSubscription(subData?.subscription || subData);
      setInvoices(invoicesData?.invoices || invoicesData || []);
      setPlans(plansData?.plans || plansData || []);
    } catch (error: any) {
      toast.error('Failed to load billing data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing & Subscriptions</h1>
        <p className="text-gray-600 mt-1">Manage your subscription and payment methods</p>
      </div>

      {/* Current Subscription */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-gray-900">Current Plan</CardTitle>
          <CardDescription>Your active subscription details</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-20 animate-pulse rounded bg-gray-200" />
          ) : subscription ? (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{subscription.plan_type || 'Free'}</h3>
                <p className="text-gray-600 mt-1">
                  Status: <span className="font-semibold text-green-600">{subscription.status || 'Active'}</span>
                </p>
                {subscription.current_period_end && (
                  <p className="text-sm text-gray-500 mt-2">
                    Renews on {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Button>Upgrade Plan</Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No active subscription</p>
              <Button>Choose a Plan</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Plans</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={plan.popular ? 'border-blue-500 border-2 relative' : ''}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-gray-900">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-2 text-gray-700">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {subscription?.plan_type === plan.name ? 'Current Plan' : 'Select Plan'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-900">Billing History</CardTitle>
              <CardDescription>Your recent invoices and payments</CardDescription>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Invoice #</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Description</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i} className="border-b">
                      <td colSpan={6} className="py-4">
                        <div className="h-8 animate-pulse rounded bg-gray-200" />
                      </td>
                    </tr>
                  ))
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p>No invoices yet</p>
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice, idx) => (
                    <tr key={invoice.id || idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm text-gray-900">
                        #{invoice.number || `INV-${idx + 1}`}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {invoice.date ? new Date(invoice.date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-gray-700">{invoice.description || 'Subscription'}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        ${invoice.amount || '0.00'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                          invoice.status === 'paid' 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {invoice.status || 'Paid'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Payment Method</CardTitle>
          <CardDescription>Manage your payment information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">•••• •••• •••• 4242</p>
                <p className="text-sm text-gray-500">Expires 12/25</p>
              </div>
            </div>
            <Button variant="outline">Update</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
