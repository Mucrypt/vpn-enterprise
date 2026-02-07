import { formatDistanceToNow } from 'date-fns'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  X,
} from 'lucide-react'
import { Button } from './ui/button'
import { useNotifications, type Notification } from '@/hooks/use-notifications'
import { cn } from '@/lib/utils'

interface NotificationItemProps {
  notification: Notification
}

/**
 * Individual Notification Item Component
 * Shows notification with icon, title, message, and actions
 */
export function NotificationItem({ notification }: NotificationItemProps) {
  const { markAsRead, deleteNotification } = useNotifications()

  const handleClick = () => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank')
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteNotification(notification.id)
  }

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle2 className='h-4 w-4 text-green-500' />
      case 'error':
        return <XCircle className='h-4 w-4 text-red-500' />
      case 'warning':
        return <AlertTriangle className='h-4 w-4 text-yellow-500' />
      default:
        return <Info className='h-4 w-4 text-blue-500' />
    }
  }

  const getBackgroundColor = () => {
    if (!notification.read) {
      return 'bg-primary/5 hover:bg-primary/10'
    }
    return 'hover:bg-muted/50'
  }

  return (
    <div
      className={cn(
        'relative px-4 py-3 border-b last:border-b-0 transition-colors cursor-pointer',
        getBackgroundColor(),
      )}
      onClick={handleClick}
    >
      <div className='flex gap-3'>
        {/* Icon */}
        <div className='flex-shrink-0 mt-0.5'>{getIcon()}</div>

        {/* Content */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-start justify-between gap-2'>
            <div className='flex-1 min-w-0'>
              <p
                className={cn(
                  'text-sm font-medium',
                  !notification.read && 'font-semibold',
                )}
              >
                {notification.title}
              </p>
              <p className='text-sm text-muted-foreground mt-0.5 line-clamp-2'>
                {notification.message}
              </p>
            </div>

            {/* Delete button */}
            <Button
              variant='ghost'
              size='sm'
              onClick={handleDelete}
              className='h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10'
            >
              <X className='h-3 w-3' />
            </Button>
          </div>

          {/* Footer */}
          <div className='flex items-center gap-2 mt-2'>
            <span className='text-xs text-muted-foreground'>
              {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
            </span>

            {notification.actionUrl && (
              <>
                <span className='text-xs text-muted-foreground'>•</span>
                <button
                  className='text-xs text-primary hover:underline inline-flex items-center gap-1'
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClick()
                  }}
                >
                  {notification.actionLabel || 'View'}
                  <ExternalLink className='h-3 w-3' />
                </button>
              </>
            )}

            {!notification.read && (
              <>
                <span className='text-xs text-muted-foreground'>•</span>
                <div className='h-2 w-2 rounded-full bg-primary' />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
