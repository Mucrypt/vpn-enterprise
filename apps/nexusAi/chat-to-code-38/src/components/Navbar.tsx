import { Button } from '@/components/ui/button'
import { ChevronDown, Flame } from 'lucide-react'
import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
    <nav className='fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50'>
      <div className='container mx-auto px-6 h-16 flex items-center justify-between'>
        {/* Logo */}
        <Link to='/' className='flex items-center gap-2'>
          <div className='w-8 h-8 rounded-lg bg-gradient-warm flex items-center justify-center'>
            <Flame className='w-5 h-5 text-primary-foreground' />
          </div>
          <span className='text-xl font-semibold text-foreground'>NexusAI</span>
        </Link>

        {/* Center Navigation */}
        <div className='hidden md:flex items-center gap-1'>
          <Link
            to='/build'
            className='px-4 py-2 text-sm font-medium text-foreground bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors'
          >
            App Builder
          </Link>
          <button className='flex items-center gap-1 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50'>
            Solutions
            <ChevronDown className='w-4 h-4' />
          </button>
          <a
            href='#enterprise'
            className='px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50'
          >
            Enterprise
          </a>
          <a
            href='#pricing'
            className='px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50'
          >
            Pricing
          </a>
          <a
            href='#community'
            className='px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50'
          >
            Community
          </a>
        </div>

        {/* Right Actions */}
        <div className='flex items-center gap-3'>
          <Button
            variant='ghost'
            size='sm'
            className='text-muted-foreground hover:text-foreground'
          >
            Log in
          </Button>
          <Link to='/build'>
            <Button
              variant='default'
              size='sm'
              className='bg-foreground text-background hover:bg-foreground/90 rounded-lg font-medium'
            >
              Get started
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
