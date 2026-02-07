import { useState, useEffect, useCallback } from 'react'
import { useToast } from './use-toast'

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
}

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  addNotification: (
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>,
  ) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  clearAll: () => void
}

const STORAGE_KEY = 'nexusai_notifications'
const MAX_NOTIFICATIONS = 50

/**
 * Hook for managing in-app notifications
 * Integrates with N8N webhooks and Slack notifications
 */
export function useNotifications(): NotificationStore {
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    // Load from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }))
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
    return []
  })

  // Save to localStorage whenever notifications change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
    } catch (error) {
      console.error('Failed to save notifications:', error)
    }
  }, [notifications])

  // Listen for broadcast notifications (from other tabs or N8N webhooks)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          setNotifications(
            parsed.map((n: any) => ({
              ...n,
              timestamp: new Date(n.timestamp),
            })),
          )
        } catch (error) {
          console.error(
            'Failed to parse notifications from storage event:',
            error,
          )
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Subscribe to N8N webhook notifications via WebSocket or Server-Sent Events
  useEffect(() => {
    // TODO: Implement WebSocket or SSE connection to N8N
    // For now, we'll poll the API or receive via window events

    const handleN8NNotification = (event: CustomEvent) => {
      const { type, title, message, metadata } = event.detail
      addNotification({ type, title, message, metadata })
    }

    window.addEventListener(
      'n8n-notification' as any,
      handleN8NNotification as EventListener,
    )
    return () => {
      window.removeEventListener(
        'n8n-notification' as any,
        handleN8NNotification as EventListener,
      )
    }
  }, [])

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      const newNotification: Notification = {
        ...notification,
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        read: false,
      }

      setNotifications((prev) => {
        const updated = [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS)
        return updated
      })

      // Show toast for important notifications
      if (notification.type === 'error' || notification.type === 'success') {
        toast({
          title: notification.title,
          description: notification.message,
          variant: notification.type === 'error' ? 'destructive' : 'default',
        })
      }

      return newNotification.id
    },
    [toast],
  )

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  }
}

// Global function to trigger notifications from anywhere in the app
export function triggerNotification(
  notification: Omit<Notification, 'id' | 'timestamp' | 'read'>,
) {
  const event = new CustomEvent('n8n-notification', { detail: notification })
  window.dispatchEvent(event)
}
