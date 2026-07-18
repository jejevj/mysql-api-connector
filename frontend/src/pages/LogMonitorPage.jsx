import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Circle } from 'lucide-react'
import { jobApi } from '../lib/api'
import StatusBadge from '../components/StatusBadge'

export default function LogMonitorPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [connected, setConnected] = useState(false)
  const bottomRef = useRef(null)
  const wsRef = useRef(null)

  const { data: job } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobApi.get(jobId).then(r => r.data),
    refetchInterval: 2000,
  })

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const wsUrl = `${protocol}://${window.location.host}/ws/jobs/${jobId}/logs`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setConnected(false)
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setLogs(prev => [...prev.slice(-500), data])
      } catch {}
    }

    return () => ws.close()
  }, [jobId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const levelColor = {
    INFO:  'text-emerald-400',
    WARN:  'text-amber-400',
    ERROR: 'text-red-400',
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button className="btn-secondary text-sm" onClick={() => navigate('/jobs')}>
          <ArrowLeft size={14} /> Kembali
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-gray-900">Log Job #{jobId}</h1>
          {job && <StatusBadge status={job.status} />}
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs">
          <Circle size={8} className={connected ? 'fill-emerald-500 text-emerald-500' : 'fill-gray-300 text-gray-300'} />
          <span className="text-gray-500">{connected ? 'Terhubung' : 'Terputus'}</span>
        </div>
      </div>

      {/* Progress */}
      {job && (
        <div className="card p-4 mb-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-400">Processed</p>
            <p className="text-lg font-semibold text-gray-900 tabular-nums">{job.processed_items?.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-lg font-semibold text-gray-900 tabular-nums">{job.total_items?.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Failed</p>
            <p className="text-lg font-semibold text-red-500 tabular-nums">{job.failed_items?.toLocaleString()}</p>
          </div>
          {job.total_items > 0 && (
            <div className="col-span-3">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.round((job.processed_items / job.total_items) * 100))}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{Math.round((job.processed_items / job.total_items) * 100)}%</p>
            </div>
          )}
        </div>
      )}

      {/* Log Terminal */}
      <div className="rounded-xl bg-gray-950 border border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-xs text-gray-500 font-mono">log monitor — job #{jobId}</span>
          <span className="text-xs text-gray-600">{logs.length} entries</span>
        </div>
        <div className="log-scroll overflow-y-auto h-[500px] p-4 font-mono text-xs">
          {logs.length === 0 ? (
            <p className="text-gray-600">Menunggu log masuk...</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="flex gap-3 mb-1 leading-5">
                <span className="text-gray-600 shrink-0">{new Date(log.time).toLocaleTimeString('id-ID')}</span>
                <span className={`shrink-0 w-10 ${levelColor[log.level] || 'text-gray-400'}`}>{log.level}</span>
                <span className="text-gray-300 break-all">{log.message}</span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  )
}
