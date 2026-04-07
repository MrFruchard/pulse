'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, admin as adminApi } from '@/lib/api'
import { NavBar } from '@/components/NavBar'
import { Button } from '@/components/ui/Button'
import type { Report, ReportStatus, User } from '@/types'

const REASON_LABELS: Record<string, string> = {
  SPAM: 'Spam',
  INAPPROPRIATE: 'Inapproprié',
  HARASSMENT: 'Harcèlement',
  OTHER: 'Autre',
}

const STATUS_TABS: { value: ReportStatus; label: string }[] = [
  { value: 'PENDING',   label: 'En attente' },
  { value: 'REVIEWED',  label: 'Traités' },
  { value: 'DISMISSED', label: 'Rejetés' },
]

export default function AdminPage() {
  const router = useRouter()
  const [me, setMe] = useState<User | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [tab, setTab] = useState<ReportStatus>('PENDING')
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    auth.me()
      .then((data) => {
        const user = (data as { user: User }).user
        if (user.role !== 'admin' && user.role !== 'moderator') {
          router.push('/feed')
          return
        }
        setMe(user)
      })
      .catch(() => router.push('/login'))
  }, [router])

  useEffect(() => {
    if (!me) return
    setLoading(true)
    adminApi.reports(tab)
      .then((data) => setReports((data as { reports: Report[] }).reports))
      .catch(() => setReports([]))
      .finally(() => setLoading(false))
  }, [me, tab])

  async function handleUpdate(reportId: string, status: 'REVIEWED' | 'DISMISSED') {
    setActionLoading(reportId)
    try {
      await adminApi.updateReport(reportId, status)
      setReports(prev => prev.filter(r => r.id !== reportId))
    } catch { /* ignore */ }
    finally { setActionLoading(null) }
  }

  async function handleSuspend(userId: string, reportId: string) {
    setActionLoading(reportId + '-suspend')
    try {
      await adminApi.suspendUser(userId)
      await adminApi.updateReport(reportId, 'REVIEWED')
      setReports(prev => prev.filter(r => r.id !== reportId))
    } catch { /* ignore */ }
    finally { setActionLoading(null) }
  }

  if (!me) return null

  return (
    <>
      <NavBar pseudo={me.pseudo} />

      <main className="max-w-3xl mx-auto px-4 py-6 pt-20">
        <div className="mb-6">
          <h1 className="text-xl font-bold mb-1">Modération</h1>
          <p className="text-sm text-gray-500">
            Connecté en tant que <span className="text-white">{me.pseudo}</span>{' '}
            <span className="text-xs bg-gray-800 px-1.5 py-0.5 rounded">{me.role}</span>
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-800">
          {STATUS_TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.value
                  ? 'border-green-500 text-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Liste des reports */}
        {loading ? (
          <div className="text-center py-12 text-gray-600 text-sm">Chargement…</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-gray-600 text-sm">
            Aucun signalement {tab === 'PENDING' ? 'en attente' : tab === 'REVIEWED' ? 'traité' : 'rejeté'}.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {reports.map(report => (
              <div key={report.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-red-900/40 text-red-400 rounded font-medium">
                        {REASON_LABELS[report.reason] ?? report.reason}
                      </span>
                      <span className="text-xs text-gray-600">
                        par @{report.reporterPseudo}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-3 break-words">
                      {report.postContent}
                    </p>
                  </div>
                  <div className="text-xs text-gray-600 shrink-0">
                    {new Date(report.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>

                {tab === 'PENDING' && (
                  <div className="flex gap-2 pt-3 border-t border-gray-800">
                    <Button
                      variant="danger"
                      onClick={() => handleUpdate(report.id, 'REVIEWED')}
                      loading={actionLoading === report.id}
                      className="text-xs py-1"
                    >
                      Supprimer le post
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleSuspend(report.reporterId, report.id)}
                      loading={actionLoading === report.id + '-suspend'}
                      className="text-xs py-1"
                    >
                      Suspendre + supprimer
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleUpdate(report.id, 'DISMISSED')}
                      loading={actionLoading === report.id}
                      className="text-xs py-1"
                    >
                      Rejeter
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
