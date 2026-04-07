import { useCallback, useEffect, useState } from 'react'
import { notifications as notifApi } from '@/lib/api'
import type { Notification } from '@/types'

export function useNotifications() {
  const [items, setItems] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetch = useCallback(async () => {
    try {
      const data = await notifApi.list() as { notifications: Notification[]; unreadCount: number }
      setItems(data.notifications ?? [])
      setUnreadCount(data.unreadCount ?? 0)
    } catch { /* non connecté */ }
  }, [])

  useEffect(() => {
    fetch()
    // Polling léger toutes les 30s pour le badge
    const interval = setInterval(fetch, 30_000)
    return () => clearInterval(interval)
  }, [fetch])

  const markRead = useCallback(async (id: string) => {
    await notifApi.markRead(id).catch(() => {})
    setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const markAllRead = useCallback(async () => {
    await Promise.all(items.filter(n => !n.isRead).map(n => notifApi.markRead(n.id).catch(() => {})))
    setItems(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }, [items])

  return { items, unreadCount, markRead, markAllRead, refresh: fetch }
}
