'use client'

import { useEffect, useState } from 'react'
import { followRequests } from '@/lib/api'
import type { FollowRequest } from '@/types'

export function FollowRequestsPanel() {
  const [requests, setRequests] = useState<FollowRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    followRequests.list()
      .then(data => setRequests(data.requests))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handle(id: string, action: 'ACCEPT' | 'DECLINE') {
    try {
      await followRequests.respond(id, action)
      setRequests(prev => prev.filter(r => r.id !== id))
    } catch { /* ignore */ }
  }

  if (loading || requests.length === 0) return null

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
        Demandes d&apos;abonnement ({requests.length})
      </h2>
      <div className="flex flex-col gap-3">
        {requests.map(req => (
          <div key={req.id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold shrink-0">
                {req.pseudo[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium">{req.pseudo}</span>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handle(req.id, 'ACCEPT')}
                className="text-xs px-3 py-1.5 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition"
              >
                Accepter
              </button>
              <button
                onClick={() => handle(req.id, 'DECLINE')}
                className="text-xs px-3 py-1.5 border border-gray-700 text-gray-400 rounded-lg hover:border-gray-600 transition"
              >
                Refuser
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
