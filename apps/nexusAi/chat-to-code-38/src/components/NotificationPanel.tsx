import { Bell, CheckCheck, Trash2, Filter, Search } from 'lucide-react'
import { useState, useMemo } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ScrollArea } from './ui/scroll-area'
import { Badge } from './ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs'
import { useNotifications, type Notification } from '@/hooks/use-notifications'
import { NotificationItem } from './NotificationItem'

/**
 * Full Notification Panel Component
 * Displays all notifications with filtering and search
 * Can be used as a dedicated page or slide-in panel
 */
export function NotificationPanel() {
  const { notifications, unreadCount, markAllAsRead, clearAll } =
    useNotifications()

  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<
    'all' | 'unread' | 'success' | 'error' | 'warning' | 'info'
  >('all')

  // Filter and search notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications

    // Apply type filter
    if (filter === 'unread') {
      filtered = filtered.filter((n) => !n.read)
    } else if (filter !== 'all') {
      filtered = filtered.filter((n) => n.type === filter)
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.message.toLowerCase().includes(query),
      )
    }

    return filtered
  }, [notifications, filter, searchQuery])

  const getCounts = () => {
    return {
      all: notifications.length,
      unread: unreadCount,
      success: notifications.filter((n) => n.type === 'success').length,
      error: notifications.filter((n) => n.type === 'error').length,
      warning: notifications.filter((n) => n.type === 'warning').length,
      info: notifications.filter((n) => n.type === 'info').length,
    }
  }

  const counts = getCounts()

  return (
    <div className='flex flex-col h-full'>
      {/* Header */}
      <div className='border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <div className='flex items-center justify-between px-6 py-4'>
          <div className='flex items-center gap-3'>
            <Bell className='h-6 w-6' />
            <div>
              <h1 className='text-2xl font-bold'>Notifications</h1>
              <p className='text-sm text-muted-foreground'>
                Stay updated with your app generation and deployments
              </p>
            </div>
          </div>

          {notifications.length > 0 && (
            <div className='flex gap-2'>
              {unreadCount > 0 && (
                <Button
                  variant='outline'
                  onClick={markAllAsRead}
                  className='gap-2'
                >
                  <CheckCheck className='h-4 w-4' />
                  Mark all read
                </Button>
              )}
              <Button
                variant='outline'
                onClick={clearAll}
                className='gap-2 text-destructive hover:text-destructive'
              >
                <Trash2 className='h-4 w-4' />
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Search Bar */}
        {notifications.length > 0 && (
          <div className='px-6 pb-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search notifications...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-9'
              />
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      {notifications.length > 0 && (
        <div className='border-b px-6 py-3'>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
            <TabsList className='grid grid-cols-6 w-full max-w-2xl'>
              <TabsTrigger value='all' className='gap-2'>
                All
                <Badge variant='secondary'>{counts.all}</Badge>
              </TabsTrigger>
              <TabsTrigger value='unread' className='gap-2'>
                Unread
                {counts.unread > 0 && (
                  <Badge variant='destructive'>{counts.unread}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value='success' className='gap-2'>
                Success
                <Badge variant='secondary'>{counts.success}</Badge>
              </TabsTrigger>
              <TabsTrigger value='error' className='gap-2'>
                Errors
                <Badge variant='secondary'>{counts.error}</Badge>
              </TabsTrigger>
              <TabsTrigger value='warning' className='gap-2'>
                Warnings
                <Badge variant='secondary'>{counts.warning}</Badge>
              </TabsTrigger>
              <TabsTrigger value='info' className='gap-2'>
                Info
                <Badge variant='secondary'>{counts.info}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Notification List */}
      <ScrollArea className='flex-1'>
        {filteredNotifications.length > 0 ? (
          <div className='divide-y'>
            {filteredNotifications.map((notification) => (
              <div key={notification.id} className='group'>
                <NotificationItem notification={notification} />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-full py-20 text-center'>
            <Bell className='h-16 w-16 text-muted-foreground/20 mb-4' />
            <h3 className='text-lg font-semibold mb-1'>No notifications yet</h3>
            <p className='text-sm text-muted-foreground max-w-sm'>
              When you generate apps or deploy them, you'll see notifications
              here
            </p>
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center h-full py-20 text-center'>
            <Filter className='h-16 w-16 text-muted-foreground/20 mb-4' />
            <h3 className='text-lg font-semibold mb-1'>
              No matching notifications
            </h3>
            <p className='text-sm text-muted-foreground max-w-sm'>
              Try adjusting your filters or search query
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
