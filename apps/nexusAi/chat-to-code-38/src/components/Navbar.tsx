import { Button } from '@/components/ui/button'
import { ChevronDown, Flame, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const Navbar = () => {
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
          <Button
            variant='ghost'
            size='sm'
            className='text-muted-foreground hover:text-foreground'
            onClick={() =>
              window.open('https://chatbuilds.com/login', '_blank')
            }
          >
            Log in
          </Button>
          <Link to='/builder'>
            <Button
              variant='default'
              size='sm'
              className='bg-gradient-to-r from-primary to-purple-600 text-white hover:opacity-90 rounded-lg font-medium shadow-lg'
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
