import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Activity, Pause, Play, Square, Eye, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { jobApi, modelApi } from '../lib/api'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'

export default function JobsPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [startModal, setStartModal] = useState(false)
  const [selectedModel, setSelectedModel] = useState('')
  const [stopDialog, setStopDialog] = useState({ open: false, id: null })

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => jobApi.list().then(r => r.data),
    refetchInterval: 3000,
  })

  const { data: models } = useQuery({
    queryKey: ['models'],
    queryFn: () => modelApi.list().then(r => r.data),
  })

  const startMutation = useMutation({
    mutationFn: () => jobApi.start({ model_mapping_id: Number(selectedModel) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jobs'] }); toast.success('Job dimulai'); setStartModal(false) },
    onError: (e) => toast.error(e.message),
  })

  const pauseMutation = useMutation({
    mutationFn: (id) => jobApi.pause(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jobs'] }); toast.success('Job dijeda') },
    onError: (e) => toast.error(e.message),
  })

  const resumeMutation = useMutation({
    mutationFn: (id) => jobApi.resume(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jobs'] }); toast.success('Job dilanjutkan') },
    onError: (e) => toast.error(e.message),
  })

  const stopMutation = useMutation({
    mutationFn: (id) => jobApi.stop(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jobs'] }); toast.success('Job dihentikan') },
    onError: (e) => toast.error(e.message),
  })

  const formatProgress = (job) => {
    if (!job.total_items) return `${job.processed_items} items`
    const pct = Math.round((job.processed_items / job.total_items) * 100)
    return `${job.processed_items.toLocaleString()} / ${job.total_items.toLocaleString()} (${pct}%)`
  }

  return (
    <div>
      <PageHeader
        title="Sync Jobs"
        description="Monitor dan kelola proses sinkronisasi data"
        action={
          <div className="flex items-center gap-2">
            <button className="btn-secondary text-sm" onClick={() => qc.invalidateQueries({ queryKey: ['jobs'] })}><RefreshCw size={14} /></button>
            <button className="btn-primary" onClick={() => setStartModal(true)}><Plus size={15} /> Mulai Sync</button>
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card p-4 h-20 animate-pulse bg-gray-100" />)}</div>
      ) : !jobs?.length ? (
        <EmptyState icon={Activity} title="Belum ada job" description="Mulai proses sync dengan memilih model yang sudah dikonfigurasi." action={<button className="btn-primary" onClick={() => setStartModal(true)}><Plus size={15} /> Mulai Sync</button>} />
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <div key={job.id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">Job #{job.id}</span>
                    <StatusBadge status={job.status} />
                  </div>
                  <p className="text-xs text-gray-400">Model ID: {job.model_mapping_id}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatProgress(job)}</p>
                  {job.total_items > 0 && (
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden w-64">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.round((job.processed_items / job.total_items) * 100))}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button className="btn-secondary text-xs px-2.5 py-1.5" onClick={() => navigate(`/jobs/${job.id}/logs`)}>
                    <Eye size={12} /> Log
                  </button>
                  {job.status === 'running' && (
                    <button className="btn-warning text-xs px-2.5 py-1.5" onClick={() => pauseMutation.mutate(job.id)}>
                      <Pause size={12} /> Pause
                    </button>
                  )}
                  {job.status === 'paused' && (
                    <button className="btn-success text-xs px-2.5 py-1.5" onClick={() => resumeMutation.mutate(job.id)}>
                      <Play size={12} /> Resume
                    </button>
                  )}
                  {['running', 'paused'].includes(job.status) && (
                    <button className="btn-danger text-xs px-2.5 py-1.5" onClick={() => setStopDialog({ open: true, id: job.id })}>
                      <Square size={12} /> Stop
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Start Modal */}
      <Modal open={startModal} onClose={() => setStartModal(false)} title="Mulai Sync Job" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Pilih Model *</label>
            <select className="input" value={selectedModel} onChange={e => setSelectedModel(e.target.value)}>
              <option value="">Pilih model...</option>
              {models?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setStartModal(false)}>Batal</button>
            <button className="btn-primary" onClick={() => startMutation.mutate()} disabled={!selectedModel || startMutation.isPending}>
              {startMutation.isPending ? 'Memulai...' : 'Mulai'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={stopDialog.open}
        onClose={() => setStopDialog({ open: false, id: null })}
        onConfirm={() => stopMutation.mutate(stopDialog.id)}
        title="Stop Job"
        message="Job akan dihentikan dan tidak bisa dilanjutkan. Yakin?"
        confirmLabel="Stop"
      />
    </div>
  )
}
