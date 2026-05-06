'use client'

import { useEffect, useRef, useCallback } from 'react'

type WSMessage = {
  type: string
  [key: string]: unknown
}

export function useWebSocket(onMessage: (msg: WSMessage) => void) {
  const ws = useRef<WebSocket | null>(null)
  const onMessageRef = useRef(onMessage)
  const mountedRef = useRef(true)
  onMessageRef.current = onMessage

  const connect = useCallback(() => {
    if (!mountedRef.current) return

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? '/ws'
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const url = wsUrl.startsWith('/') ? `${protocol}//${host}${wsUrl}` : wsUrl

    ws.current = new WebSocket(url)

    ws.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WSMessage
        onMessageRef.current(msg)
      } catch {
        // ignore malformed messages
      }
    }

    ws.current.onclose = () => {
      // Reconnexion uniquement si le composant est encore monté
      if (mountedRef.current) {
        setTimeout(connect, 3000)
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    connect()
    return () => {
      mountedRef.current = false
      ws.current?.close()
    }
  }, [connect])
}
