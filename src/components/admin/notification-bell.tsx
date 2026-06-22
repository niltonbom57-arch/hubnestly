'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Bell, CheckCheck, Calendar, X } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  createdAt: string
  booking: { id: string } | null
}

export function NotificationBell() {
  const [open, setOpen]               = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading]         = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications')
      const json: { success: boolean; data?: { notifications: Notification[]; unreadCount: number } } = await res.json()
      if (json.success && json.data) {
        setNotifications(json.data.notifications)
        setUnreadCount(json.data.unreadCount)
      }
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    void fetchNotifications()
    const interval = setInterval(fetchNotifications, 30_000) // poll a cada 30s
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function markAllRead() {
    setLoading(true)
    await fetch('/api/admin/notifications', { method: 'PATCH' })
    await fetchNotifications()
    setLoading(false)
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60_000)
    if (mins < 1) return 'agora'
    if (mins < 60) return `${mins}min atrás`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h atrás`
    return `${Math.floor(hours / 24)}d atrás`
  }

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
        aria-label="Notificações"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-teal-600" />
              <span className="font-bold text-slate-800 text-sm">Notificações</span>
              {unreadCount > 0 && (
                <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount} novas</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={loading}
                  className="text-xs text-teal-600 hover:text-teal-800 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-teal-50 transition-colors font-medium"
                >
                  <CheckCheck className="w-3.5 h-3.5" />Marcar lidas
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-teal-50/40' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      !n.read ? 'bg-teal-100' : 'bg-slate-100'
                    }`}>
                      <Calendar className={`w-4 h-4 ${!n.read ? 'text-teal-600' : 'text-slate-400'}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold leading-tight ${!n.read ? 'text-slate-900' : 'text-slate-600'}`}>
                          {n.title}
                        </p>
                        <span className="text-xs text-slate-400 shrink-0">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.body}</p>
                      {n.booking && (
                        <Link
                          href={`/admin/bookings/${n.booking.id}`}
                          onClick={() => setOpen(false)}
                          className="text-xs text-teal-600 hover:text-teal-800 font-medium mt-1 inline-block"
                        >
                          Ver agendamento →
                        </Link>
                      )}
                    </div>

                    {/* Unread dot */}
                    {!n.read && (
                      <div className="w-2 h-2 bg-teal-500 rounded-full shrink-0 mt-2" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
