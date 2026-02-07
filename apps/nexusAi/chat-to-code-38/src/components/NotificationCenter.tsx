import { Bell, X, CheckCheck, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { ScrollArea } from './ui/scroll-area'
import { Badge } from './ui/badge'
import { useNotifications } from '@/hooks/use-notifications'
import { NotificationItem } from './NotificationItem'
import { cn } from '@/lib/utils'

/**
 * Notification Center Component
 * Displays notification bell with badge and dropdown panel
 */
export function NotificationCenter() {
  const { notifications, unreadCount, markAllAsRead, clearAll } =
    useNotifications()

  const hasNotifications = notifications.length > 0
  const hasUnread = unreadCount > 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='relative'
          aria-label='Notifications'
        >
          <Bell className={cn('h-5 w-5', hasUnread && 'animate-pulse')} />
          {hasUnread && (
            <Badge
              variant='destructive'
              className='absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs'
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='w-80 p-0' sideOffset={8}>
        {/* Header */}
        <div className='flex items-center justify-between border-b px-4 py-3 bg-muted/30'>
          <div className='flex items-center gap-2'>
            <Bell className='h-4 w-4' />
            <h3 className='font-semibold'>Notifications</h3>
            {hasUnread && (
              <Badge variant='secondary' className='ml-1'>
                {unreadCount}
              </Badge>
            )}
          </div>

          {hasNotifications && (
            <div className='flex gap-1'>
              {hasUnread && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={markAllAsRead}
                  className='h-7 px-2 text-xs'
                >
                  <CheckCheck className='h-3 w-3 mr-1' />
                  Mark all read
                </Button>
              )}
              <Button
                variant='ghost'
                size='sm'
                onClick={clearAll}
                className='h-7 px-2 text-xs text-destructive hover:text-destructive'
              >
                <Trash2 className='h-3 w-3' />
              </Button>
            </div>
          )}
        </div>

        {/* Notification List */}
        {hasNotifications ? (
          <ScrollArea className='max-h-[400px]'>
            <div className='py-2'>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className='py-12 text-center text-sm text-muted-foreground'>
            <Bell className='h-8 w-8 mx-auto mb-2 opacity-20' />
            <p>No notifications yet</p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
