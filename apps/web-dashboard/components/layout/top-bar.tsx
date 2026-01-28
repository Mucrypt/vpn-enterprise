'use client'

import { useAuthStore, useDashboardStore } from '@/lib/store'
import {
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  Shield,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { api } from '@/lib/api'

interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  timestamp: string
  read: boolean
  action_url?: string
}

export function TopBar() {
  const { user, logout } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin'

  useEffect(() => {
    loadNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications({ limit: 10 })
      setNotifications(data.notifications || [])
      setUnreadCount(data.unread_count || 0)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await api.markNotificationRead(notificationId)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className='h-5 w-5 text-green-600' />
      case 'warning':
        return <AlertTriangle className='h-5 w-5 text-yellow-600' />
      case 'error':
        return <AlertCircle className='h-5 w-5 text-red-600' />
      default:
        return <Info className='h-5 w-5 text-blue-600' />
    }
  }

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000)

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const { toggleSidebar } = useDashboardStore()

  return (
    <div className='flex h-14 md:h-16 items-center justify-between border-b bg-white px-3 sm:px-4 md:px-6'>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className='md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation'
        aria-label='Open menu'
      >
        <svg
          className='h-6 w-6 text-gray-700'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M4 6h16M4 12h16M4 18h16'
          />
        </svg>
      </button>

      {/* Search */}
      <div className='flex flex-1 items-center gap-2 md:gap-4'>
        <div className='relative w-full max-w-md'>
          <Search className='absolute left-2 md:left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
          <input
            type='text'
            placeholder='Search...'
            className='w-full rounded-lg border border-gray-300 py-1.5 md:py-2 pl-8 md:pl-10 pr-3 md:pr-4 text-sm md:text-base text-gray-900 placeholder:text-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500'
          />
        </div>
      </div>

      {/* User Menu */}
      <div className='flex items-center gap-1 sm:gap-2 md:gap-4'>
        {/* Notifications */}
        <div className='relative' ref={notifRef}>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setShowNotifications(!showNotifications)}
            className='relative h-9 w-9 md:h-10 md:w-10 touch-manipulation'
          >
            <Bell className='h-5 w-5 text-gray-600' />
            {unreadCount > 0 && (
              <span className='absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-semibold'>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          {showNotifications && (
            <div className='absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[70vh] sm:max-h-[600px] overflow-hidden flex flex-col'>
              <div className='px-3 sm:px-4 py-3 border-b flex items-center justify-between bg-gray-50'>
                <h3 className='text-sm font-semibold text-gray-900'>
                  Notifications
                </h3>
                <div className='flex items-center gap-2'>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className='text-xs text-emerald-600 hover:text-emerald-700 font-medium'
                    >
                      Mark all as read
                    </button>
                  )}
                  <Link
                    href='/dashboard/notifications'
                    onClick={() => setShowNotifications(false)}
                    className='text-xs text-gray-600 hover:text-gray-900 font-medium'
                  >
                    View All
                  </Link>
                </div>
              </div>

              <div className='overflow-y-auto max-h-[500px]'>
                {notifications.length === 0 ? (
                  <div className='py-12 text-center'>
                    <Bell className='h-12 w-12 text-gray-300 mx-auto mb-3' />
                    <p className='text-sm text-gray-500'>
                      No notifications yet
                    </p>
                  </div>
                ) : (
                  <div className='divide-y'>
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                          !notif.read ? 'bg-emerald-50' : ''
                        }`}
                        onClick={() => {
                          if (!notif.read) markAsRead(notif.id)
                          if (notif.action_url) {
                            window.location.href = notif.action_url
                            setShowNotifications(false)
                          }
                        }}
                      >
                        <div className='flex gap-3'>
                          <div className='shrink-0 mt-0.5'>
                            {getNotificationIcon(notif.type)}
                          </div>
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-start justify-between gap-2'>
                              <p
                                className={`text-sm font-medium text-gray-900 ${!notif.read ? 'font-semibold' : ''}`}
                              >
                                {notif.title}
                              </p>
                              {!notif.read && (
                                <span className='shrink-0 h-2 w-2 rounded-full bg-emerald-600'></span>
                              )}
                            </div>
                            <p className='text-xs text-gray-600 mt-1 line-clamp-2'>
                              {notif.message}
                            </p>
                            <p className='text-xs text-gray-400 mt-1'>
                              {formatTime(notif.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className='relative' ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className='flex items-center gap-2 md:gap-3 hover:bg-gray-50 rounded-lg px-2 md:px-3 py-1.5 md:py-2 transition-colors touch-manipulation'
          >
            <div className='h-8 w-8 md:h-9 md:w-9 rounded-full bg-linear-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm'>
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className='hidden sm:flex flex-col items-start'>
              <span className='text-sm font-medium text-gray-900 line-clamp-1'>
                {user?.email?.split('@')[0] || 'User'}
              </span>
              <span
                className={`text-xs font-medium ${
                  user?.role === 'super_admin'
                    ? 'text-red-600'
                    : user?.role === 'admin'
                      ? 'text-orange-600'
                      : 'text-blue-600'
                }`}
              >
                {user?.role?.replace('_', ' ').toUpperCase() || 'USER'}
              </span>
            </div>
          </button>

          {showUserMenu && (
            <div className='absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50'>
              <div className='px-4 py-3 border-b'>
                <p className='text-sm font-medium text-gray-900'>
                  {user?.email}
                </p>
                <p className='text-xs text-gray-500 mt-1'>
                  {user?.role?.replace('_', ' ').toUpperCase()} Account
                </p>
              </div>

              <div className='py-2'>
                <Link
                  href='/dashboard/profile'
                  onClick={() => setShowUserMenu(false)}
                  className='flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
                >
                  <User className='h-4 w-4' />
                  My Profile
                </Link>

                {isAdmin && (
                  <Link
                    href='/dashboard/profile/admin'
                    onClick={() => setShowUserMenu(false)}
                    className='flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
                  >
                    <Shield className='h-4 w-4' />
                    Admin Profile
                  </Link>
                )}

                <Link
                  href='/dashboard/security'
                  onClick={() => setShowUserMenu(false)}
                  className='flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
                >
                  <Settings className='h-4 w-4' />
                  Settings
                </Link>
              </div>

              <div className='border-t py-2'>
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    logout()
                  }}
                  className='flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full'
                >
                  <LogOut className='h-4 w-4' />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
