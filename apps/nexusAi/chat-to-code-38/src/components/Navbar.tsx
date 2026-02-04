import { Button } from '@/components/ui/button'
import {
  ChevronDown,
  Flame,
  Sparkles,
  User,
  LogOut,
  CreditCard,
  Settings,
  LayoutDashboard,
  Coins,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { authService, type User as AuthUser } from '@/services/authService'
import { useCredits } from '@/contexts/CreditsContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

const Navbar = () => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { credits, refreshCredits } = useCredits()

  useEffect(() => {
    const checkAuth = async () => {
      await authService.syncAuthFromDashboard()
      const authenticated = authService.isAuthenticated()
      setIsAuthenticated(authenticated)
      if (authenticated) {
        setUser(authService.getCurrentUser())
        refreshCredits()
      }
    }
    checkAuth()
  }, [])

  const subscriptionInfo = authService.getSubscriptionInfo()

  return (
    <nav className='fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50'>
      <div className='container mx-auto px-6 h-16 flex items-center justify-between'>
        {/* Logo */}
        <Link to='/' className='flex items-center gap-2'>
          <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg'>
            <Sparkles className='w-5 h-5 text-primary-foreground' />
          </div>
          <span className='text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent'>
            NexusAI
          </span>
        </Link>

        {/* Center Navigation */}
        <div className='hidden md:flex items-center gap-1'>
          <Link
            to='/describe'
            className='px-4 py-2 text-sm font-medium text-foreground bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors'
          >
            App Builder
          </Link>
          <Link
            to='/my-apps'
            className='px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50'
          >
            My Apps
          </Link>
          <a
            href='https://chatbuilds.com'
            target='_blank'
            rel='noopener noreferrer'
            className='px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50'
          >
            Platform
          </a>
          <a
            href='https://chatbuilds.com/docs'
            target='_blank'
            rel='noopener noreferrer'
            className='px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50'
          >
            Documentation
          </a>
          <a
            href='#api'
            className='px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50'
          >
            API
          </a>
          <a
            href='#examples'
            className='px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50'
          >
            Examples
          </a>
        </div>

        {/* Right Actions */}
        <div className='flex items-center gap-3'>
          {isAuthenticated && user ? (
            <>
              {/* Credits Badge - Clickable */}
              {subscriptionInfo && (
                <Link
                  to='/credits'
                  className='hidden md:flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-lg border border-border/50 hover:bg-secondary hover:border-primary/50 transition-all cursor-pointer'
                >
                  <Coins className='w-4 h-4 text-primary' />
                  <span className='text-sm font-medium'>{credits} credits</span>
                </Link>
              )}

              {/* Upgrade Button (for free tier) */}
              {subscriptionInfo?.canUpgrade && (
                <Link to='/credits'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='hidden md:flex border-primary text-primary hover:bg-primary hover:text-primary-foreground'
                  >
                    <Flame className='w-4 h-4 mr-2' />
                    Upgrade
                  </Button>
                </Link>
              )}

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='flex items-center gap-2'
                  >
                    <div className='w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-semibold text-sm'>
                      {user.name?.[0]?.toUpperCase() ||
                        user.email[0].toUpperCase()}
                    </div>
                    <ChevronDown className='w-4 h-4 text-muted-foreground' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-56'>
                  <DropdownMenuLabel>
                    <div className='flex flex-col space-y-1'>
                      <p className='text-sm font-medium leading-none'>
                        {user.name || 'User'}
                      </p>
                      <p className='text-xs leading-none text-muted-foreground'>
                        {user.email}
                      </p>
                      <Badge variant='secondary' className='w-fit mt-1 text-xs'>
                        {subscriptionInfo?.planName || 'Free'} Plan
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      window.open('https://chatbuilds.com/dashboard', '_blank')
                    }
                  >
                    <LayoutDashboard className='mr-2 h-4 w-4' />
                    <span>My Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to='/credits' className='flex items-center'>
                      <CreditCard className='mr-2 h-4 w-4' />
                      <span>Credits & Usage</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      window.open(
                        'https://chatbuilds.com/dashboard/profile',
                        '_blank',
                      )
                    }
                  >
                    <Settings className='mr-2 h-4 w-4' />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => authService.logout()}>
                    <LogOut className='mr-2 h-4 w-4' />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              {/* Not authenticated */}
              <Button
                variant='ghost'
                size='sm'
                className='text-muted-foreground hover:text-foreground'
                onClick={() =>
                  window.open(
                    'https://chatbuilds.com/auth/login?redirect=nexusai',
                    '_blank',
                  )
                }
              >
                Sign in
              </Button>
              <Button
                variant='default'
                size='sm'
                className='bg-gradient-to-r from-primary to-purple-600 text-white hover:opacity-90 rounded-lg font-medium shadow-lg'
                onClick={() =>
                  window.open(
                    'https://chatbuilds.com/auth/signup?redirect=nexusai',
                    '_blank',
                  )
                }
              >
                Get started free
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
