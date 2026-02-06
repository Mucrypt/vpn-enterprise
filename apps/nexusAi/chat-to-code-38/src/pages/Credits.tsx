import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Coins,
  Sparkles,
  TrendingUp,
  Calendar,
  ArrowLeft,
  CreditCard,
  Zap,
  Crown,
  Check,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { authService } from '@/services/authService'
import { useCredits } from '@/contexts/CreditsContext'
import { useToast } from '@/hooks/use-toast'
import Navbar from '@/components/Navbar'

interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
  popular?: boolean
  bonus?: number
  stripePriceId: string
}

// Same credit packages as web-dashboard for consistency
const creditPackages: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 100,
    price: 10,
    stripePriceId: 'price_1SxB6QKQ56fnaANW8CEtay6X', // TEST MODE
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    credits: 500,
    price: 45,
    popular: true,
    bonus: 50,
    stripePriceId: 'price_1SxB6SKQ56fnaANWc74bMAho', // TEST MODE
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    credits: 1000,
    price: 80,
    bonus: 200,
    stripePriceId: 'price_1SxB6UKQ56fnaANWSEP2BtYh', // TEST MODE
  },
  {
    id: 'enterprise',
    name: 'Enterprise Pack',
    credits: 5000,
    price: 350,
    bonus: 1500,
    stripePriceId: 'price_1SxB6WKQ56fnaANW7DD6cDO2', // TEST MODE
  },
]

const Credits = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const {
    credits: creditsRemaining,
    user,
    refreshCredits,
    loading: contextLoading,
  } = useCredits()
  const [loading, setLoading] = useState(false)
  const subscription = user?.subscription

  useEffect(() => {
    // Ensure we have latest data
    refreshCredits()
  }, [refreshCredits])

  // Get total available credits (what user actually has)
  const totalAvailableCredits = creditsRemaining
  
  // For display purposes: free plan has 100 monthly credits
  // Pro/Enterprise plans show actual total credits
  const monthlyCreditLimit = subscription?.plan === 'free' ? 100 : 1000
  const displayTotal = totalAvailableCredits > monthlyCreditLimit ? totalAvailableCredits : monthlyCreditLimit
  const creditsUsed = Math.max(0, displayTotal - totalAvailableCredits)
  const usagePercent = displayTotal > 0 ? (creditsUsed / displayTotal) * 100 : 0

  const handleBuyCredits = async (pkg: CreditPackage) => {
    try {
      setLoading(true)
      toast({
        title: 'Redirecting to payment...',
        description: 'Please wait while we prepare your checkout',
      })

      // Use the same API endpoint as web-dashboard
      const response = await fetch(
        'https://chatbuilds.com/api/v1/billing/create-checkout-session',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies for authentication
          body: JSON.stringify({
            priceId: pkg.stripePriceId,
            planId: pkg.id,
            mode: 'payment', // One-time payment for credits
            successUrl: `https://chatbuilds.com/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}&source=nexusai`,
            cancelUrl: `https://chatbuilds.com/nexusai/credits`,
          }),
        },
      )

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const data = await response.json()

      if (!data.url) {
        throw new Error('No checkout URL received')
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (error: any) {
      console.error('Failed to initiate checkout:', error)
      toast({
        title: 'Payment Failed',
        description: error.message || 'Could not initiate checkout process',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setLoading(true)
    try {
      await refreshCredits()
      toast({
        title: 'Credits Refreshed',
        description: 'Your credit balance has been updated',
      })
    } catch (error) {
      toast({
        title: 'Refresh Failed',
        description: 'Could not refresh credit balance',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-background'>
      <Helmet>
        <title>Credits & Usage | NexusAI</title>
      </Helmet>
      <Navbar />

      <div className='container mx-auto px-6 py-8 pt-24'>
        {/* Header */}
        <div className='mb-8'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => navigate(-1)}
            className='mb-4 text-muted-foreground hover:text-foreground'
          >
            <ArrowLeft className='w-4 h-4 mr-2' />
            Back
          </Button>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent'>
                Credits & Usage
              </h1>
              <p className='text-muted-foreground mt-2'>
                Manage your AI credits and monitor usage
              </p>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className='w-4 h-4 mr-2 animate-spin' />
              ) : (
                <RefreshCw className='w-4 h-4 mr-2' />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {/* Current Plan & Usage Section */}
        <div className='grid gap-6 md:grid-cols-3 mb-8'>
          {/* Credits Remaining */}
          <Card className='border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
                <Coins className='w-4 h-4 text-primary' />
                Available Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold text-primary'>
                {creditsRemaining.toLocaleString()}
              </div>
              <p className='text-xs text-muted-foreground mt-1'>
                credits remaining
              </p>
            </CardContent>
          </Card>

          {/* Credits Used */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
                <TrendingUp className='w-4 h-4' />
                Credits Used
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold'>
                {creditsUsed.toLocaleString()}
              </div>
              <p className='text-xs text-muted-foreground mt-1'>
                out of {displayTotal} total
              </p>
            </CardContent>
          </Card>

          {/* Current Plan */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
                <Crown className='w-4 h-4' />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold capitalize'>
                {subscription?.plan || 'free'}
              </div>
              <p className='text-xs text-muted-foreground mt-1'>
                {subscription?.database_quota || 1}GB database quota
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Usage Progress */}
        <Card className='mb-8'>
          <CardHeader>
            <CardTitle className='flex items-center justify-between'>
              <span>Usage Overview</span>
              <Badge variant={usagePercent > 80 ? 'destructive' : 'secondary'}>
                {usagePercent.toFixed(0)}% Used
              </Badge>
            </CardTitle>
            <CardDescription>
              Monitor your credit consumption and plan usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium'>Credit Balance</span>
                  <span className='text-sm text-muted-foreground'>
                    {creditsRemaining} / {displayTotal} credits
                  </span>
                </div>
                <Progress value={100 - usagePercent} className='h-2' />
              </div>
              <div className='grid gap-4 md:grid-cols-2 pt-4'>
                <div className='flex items-start gap-3 p-4 rounded-lg bg-secondary/50'>
                  <Sparkles className='w-5 h-5 text-primary mt-0.5' />
                  <div>
                    <p className='font-medium text-sm'>AI Generations</p>
                    <p className='text-xs text-muted-foreground mt-1'>
                      Each app generation costs 10-50 credits depending on
                      complexity
                    </p>
                  </div>
                </div>
                <div className='flex items-start gap-3 p-4 rounded-lg bg-secondary/50'>
                  <Zap className='w-5 h-5 text-primary mt-0.5' />
                  <div>
                    <p className='font-medium text-sm'>Database Provisioning</p>
                    <p className='text-xs text-muted-foreground mt-1'>
                      Free with your plan - {subscription?.database_quota || 1}
                      GB included
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buy Credits Section */}
        <div className='mb-8'>
          <div className='mb-6'>
            <h2 className='text-2xl font-bold'>Buy More Credits</h2>
            <p className='text-muted-foreground'>
              Choose a credit package that fits your needs
            </p>
          </div>

          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
            {creditPackages.map((pkg) => (
              <Card
                key={pkg.id}
                className={`relative ${
                  pkg.popular
                    ? 'border-primary shadow-lg shadow-primary/20'
                    : 'border-border'
                }`}
              >
                {pkg.popular && (
                  <Badge className='absolute -top-3 left-1/2 -translate-x-1/2 bg-primary'>
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className='flex items-center justify-between'>
                    <span>{pkg.name}</span>
                    <Coins className='w-5 h-5 text-primary' />
                  </CardTitle>
                  <CardDescription>
                    <div className='text-3xl font-bold text-foreground mt-2'>
                      {pkg.credits.toLocaleString()}
                      {pkg.bonus && (
                        <span className='text-sm text-primary ml-2'>
                          +{pkg.bonus}
                        </span>
                      )}
                    </div>
                    <div className='text-sm mt-1'>AI credits</div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    <div className='text-2xl font-bold'>${pkg.price}</div>
                    {pkg.bonus && (
                      <div className='flex items-center gap-2 text-sm text-primary'>
                        <Check className='w-4 h-4' />
                        <span>+{pkg.bonus} bonus credits</span>
                      </div>
                    )}
                    <div className='text-xs text-muted-foreground'>
                      ~{Math.floor((pkg.credits + (pkg.bonus || 0)) / 25)} app
                      generations
                    </div>
                    <Button
                      className='w-full'
                      variant={pkg.popular ? 'default' : 'outline'}
                      onClick={() => handleBuyCredits(pkg)}
                      disabled={loading}
                    >
                      <CreditCard className='w-4 h-4 mr-2' />
                      {loading ? 'Processing...' : 'Buy Now'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <Card className='bg-secondary/20 border-dashed'>
          <CardHeader>
            <CardTitle className='text-lg flex items-center gap-2'>
              <ExternalLink className='w-5 h-5' />
              Need More?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground mb-4'>
              For teams and enterprises, upgrade to a Pro or Enterprise plan for
              unlimited credits and additional features.
            </p>
            <Button
              variant='outline'
              onClick={() =>
                window.open(
                  'https://chatbuilds.com/dashboard/billing',
                  '_blank',
                )
              }
            >
              View All Plans
              <ExternalLink className='w-4 h-4 ml-2' />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Credits
