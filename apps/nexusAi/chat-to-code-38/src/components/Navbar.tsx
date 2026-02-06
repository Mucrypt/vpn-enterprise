import { Button } from '@/components/ui/button'
import {
  ChevronDown,
  Flame,
  Sparkles,
  LogOut,
  CreditCard,
  Settings,
  LayoutDashboard,
  Coins,
  Menu,
  X,
  ExternalLink,
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

const Navbar = () => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
    <nav className='fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50'>
      <div className='container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between'>
        {/* Logo */}
        <Link to='/' className='flex items-center gap-2 shrink-0'>
          <div className='w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg'>
            <Sparkles className='w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground' />
          </div>
          <span className='text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent'>
            NexusAI
          </span>
        </Link>

        {/* Center Navigation - Desktop */}
        <div className='hidden lg:flex items-center gap-1'>
          <Link
            to='/describe'
            className='px-3 xl:px-4 py-2 text-sm font-medium text-foreground bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors'
          >
            App Builder
          </Link>
          <Link
            to='/my-apps'
            className='px-3 xl:px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50'
          >
            My Apps
          </Link>
          <a
            href='https://chatbuilds.com'
            target='_blank'
            rel='noopener noreferrer'
            className='px-3 xl:px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50'
          >
            Platform
          </a>
          <a
            href='https://chatbuilds.com/docs'
            target='_blank'
            rel='noopener noreferrer'
            className='px-3 xl:px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50'
          >
            Documentation
          </a>
          <a
            href='#api'
            className='px-3 xl:px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50'
          >
            API
          </a>
          <a
            href='#examples'
            className='px-3 xl:px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50'
          >
            Examples
          </a>
        </div>

        {/* Right Actions */}
        <div className='flex items-center gap-3'>
          {isAuthenticated && user ? (
            <>
              {/* Credits Badge - Clickable - Hidden on small mobile */}
              {subscriptionInfo && (
                <Link
                  to='/credits'
                  className='hidden sm:flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 bg-secondary/50 rounded-lg border border-border/50 hover:bg-secondary hover:border-primary/50 transition-all cursor-pointer'
                >
                  <Coins className='w-4 h-4 text-primary' />
                  <span className='text-xs sm:text-sm font-medium'>
                    {credits}
                  </span>
                </Link>
              )}

              {/* Upgrade Button (for free tier) - Hidden on mobile */}
              {subscriptionInfo?.canUpgrade && (
                <Link to='/credits' className='hidden md:block'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='border-primary text-primary hover:bg-primary hover:text-primary-foreground'
                  >
                    <Flame className='w-4 h-4 mr-2' />
                    Upgrade
                  </Button>
                </Link>
              )}

              {/* User Dropdown - Desktop */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='hidden lg:flex items-center gap-2'
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
                  <DropdownMenuItem
                    onClick={async () => await authService.logout()}
                  >
                    <LogOut className='mr-2 h-4 w-4' />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              {/* Not authenticated - Desktop/Tablet */}
              <Button
                variant='ghost'
                size='sm'
                className='hidden sm:flex text-muted-foreground hover:text-foreground'
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
                className='hidden sm:flex bg-gradient-to-r from-primary to-purple-600 text-white hover:opacity-90 rounded-lg font-medium shadow-lg'
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

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className='lg:hidden p-2'
                aria-label='Open menu'
              >
                <Menu className='w-5 h-5' />
              </Button>
            </SheetTrigger>
            <SheetContent side='right' className='w-[300px] sm:w-[350px]'>
              <div className='flex flex-col h-full'>
                {/* Mobile Header */}
                <div className='flex items-center justify-between mb-6'>
                  <Link
                    to='/'
                    className='flex items-center gap-2'
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg'>
                      <Sparkles className='w-4 h-4 text-primary-foreground' />
                    </div>
                    <span className='text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent'>
                      NexusAI
                    </span>
                  </Link>
                </div>

                {/* User Info - Mobile */}
                {isAuthenticated && user && (
                  <div className='mb-6 p-4 bg-secondary/50 rounded-lg border border-border/50'>
                    <div className='flex items-center gap-3 mb-3'>
                      <div className='w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-semibold'>
                        {user.name?.[0]?.toUpperCase() ||
                          user.email[0].toUpperCase()}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium truncate'>
                          {user.name || 'User'}
                        </p>
                        <p className='text-xs text-muted-foreground truncate'>
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center justify-between'>
                      <Badge variant='secondary' className='text-xs'>
                        {subscriptionInfo?.planName || 'Free'} Plan
                      </Badge>
                      <Link
                        to='/credits'
                        onClick={() => setMobileMenuOpen(false)}
                        className='flex items-center gap-1.5 text-sm font-medium text-primary'
                      >
                        <Coins className='w-4 h-4' />
                        {credits} credits
                      </Link>
                    </div>
                  </div>
                )}

                {/* Mobile Navigation Links */}
                <nav className='flex-1 space-y-2'>
                  <Link
                    to='/describe'
                    className='flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-foreground font-medium hover:bg-primary/20 transition-colors'
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Sparkles className='w-5 h-5' />
                    App Builder
                  </Link>
                  <Link
                    to='/my-apps'
                    className='flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-secondary/50 transition-colors'
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className='w-5 h-5' />
                    My Apps
                  </Link>

                  {isAuthenticated && (
                    <>
                      <Link
                        to='/credits'
                        className='flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-secondary/50 transition-colors'
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <CreditCard className='w-5 h-5' />
                        Credits & Usage
                      </Link>
                      <button
                        onClick={() => {
                          window.open(
                            'https://chatbuilds.com/dashboard',
                            '_blank',
                          )
                          setMobileMenuOpen(false)
                        }}
                        className='w-full flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-secondary/50 transition-colors'
                      >
                        <ExternalLink className='w-5 h-5' />
                        My Dashboard
                      </button>
                      <button
                        onClick={() => {
                          window.open(
                            'https://chatbuilds.com/dashboard/profile',
                            '_blank',
                          )
                          setMobileMenuOpen(false)
                        }}
                        className='w-full flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-secondary/50 transition-colors'
                      >
                        <Settings className='w-5 h-5' />
                        Settings
                      </button>
                    </>
                  )}

                  <div className='border-t border-border/50 my-2 pt-2'>
                    <a
                      href='https://chatbuilds.com'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors'
                    >
                      <ExternalLink className='w-5 h-5' />
                      Platform
                    </a>
                    <a
                      href='https://chatbuilds.com/docs'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors'
                    >
                      <ExternalLink className='w-5 h-5' />
                      Documentation
                    </a>
                  </div>
                </nav>

                {/* Mobile Auth Actions */}
                <div className='border-t border-border/50 pt-4 space-y-2'>
                  {isAuthenticated ? (
                    <Button
                      variant='ghost'
                      className='w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10'
                      onClick={async () => {
                        await authService.logout()
                        setMobileMenuOpen(false)
                      }}
                    >
                      <LogOut className='w-5 h-5' />
                      Log out
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant='outline'
                        className='w-full'
                        onClick={() => {
                          window.open(
                            'https://chatbuilds.com/auth/login?redirect=nexusai',
                            '_blank',
                          )
                          setMobileMenuOpen(false)
                        }}
                      >
                        Sign in
                      </Button>
                      <Button
                        className='w-full bg-gradient-to-r from-primary to-purple-600 text-white hover:opacity-90'
                        onClick={() => {
                          window.open(
                            'https://chatbuilds.com/auth/signup?redirect=nexusai',
                            '_blank',
                          )
                          setMobileMenuOpen(false)
                        }}
                      >
                        Get started free
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
