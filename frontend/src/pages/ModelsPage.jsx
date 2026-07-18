import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, LayoutGrid, Trash2, Pencil, Play, RefreshCw, CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { modelApi, jobApi } from '../lib/api'
import api from '../lib/api'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'
import ModelForm from '../components/ModelForm'

// Badge status tabel
function TableStatusBadge({ model }) {
  const { data, isLoading } = useQuery({
    queryKey: ['table-status', model.id],
    queryFn: () => api.post('/models/db-check-table', {
      host: model.target_db_host,
      port: model.target_db_port,
      db_name: model.target_db_name,
      user: model.target_db_user,
      password: model.target_db_password,
      table: model.target_table,
    }).then(r => r.data),
    staleTime: 30000,
    retry: false,
  })

  if (isLoading) return (
    <span className="badge bg-gray-50 text-gray-400 flex items-center gap-1">
      <RefreshCw size={10} className="animate-spin" /> Cek...
    </span>
  )
  if (!data) return (
    <span className="badge bg-red-50 text-red-500 flex items-center gap-1">
      <XCircle size={10} /> DB tidak terhubung
    </span>
  )
  if (data.exists) return (
    <span className="badge bg-emerald-50 text-emerald-600 flex items-center gap-1">
      <CheckCircle2 size={10} /> Tabel ada
    </span>
  )
  return (
    <span className="badge bg-amber-50 text-amber-600 flex items-center gap-1">
      <HelpCircle size={10} /> Tabel belum ada
    </span>
  )
}

export default function ModelsPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [modal, setModal] = useState({ open: false, data: null })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null })

  const { data, isLoading } = useQuery({
    queryKey: ['models'],
    queryFn: () => modelApi.list().then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (payload) => modal.data
      ? modelApi.update(modal.data.id, payload)
      : modelApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['models'] })
      toast.success(modal.data ? 'Model diperbarui' : 'Model dibuat')
      setModal({ open: false, data: null })
    },
    onError: (e) => toast.error(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => modelApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['models'] })
      toast.success('Model dihapus')
    },
    onError: (e) => toast.error(e.message),
  })

  const startJobMutation = useMutation({
    mutationFn: (modelId) => jobApi.start({ model_id: modelId }),
    onSuccess: (res) => {
      toast.success('Sync job dimulai!')
      navigate('/jobs')
    },
    onError: (e) => toast.error(e.message),
  })

  return (
    <div>
      <PageHeader
        title="Models"
        description="Mapping field API ke kolom tabel MySQL"
        action={
          <button className="btn-primary" onClick={() => setModal({ open: true, data: null })}>
            <Plus size={15} /> Tambah Model
          </button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-4 h-20 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : !data?.length ? (
        <EmptyState
          icon={LayoutGrid}
          title="Belum ada model"
          description="Buat model untuk mendefinisikan mapping field API ke tabel MySQL."
          action={
            <button className="btn-primary" onClick={() => setModal({ open: true, data: null })}>
              <Plus size={15} /> Tambah Model
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {data.map(item => (
            <div key={item.id} className="card p-4">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 mt-0.5">
                  <LayoutGrid size={16} className="text-purple-600" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <TableStatusBadge model={item} />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <span className="font-mono">{item.target_db_host}:{item.target_db_port}</span>
                    <span className="mx-1">/</span>
                    <span className="font-mono">{item.target_db_name}</span>
                    <span className="mx-1">→</span>
                    <span className="font-mono font-medium text-gray-600">{item.target_table}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.field_mappings?.length || 0} field mapped
                    {item.upsert_keys?.length > 0 && (
                      <span className="ml-2 text-blue-400">upsert: {item.upsert_keys.join(', ')}</span>
                    )}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                    onClick={() => startJobMutation.mutate(item.id)}
                    disabled={startJobMutation.isPending}
                    title="Mulai sync sekarang"
                  >
                    <Play size={12} /> Sync
                  </button>
                  <button
                    className="btn-secondary text-xs px-3 py-1.5"
                    onClick={() => setModal({ open: true, data: item })}
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    className="btn text-xs px-2 py-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"
                    onClick={() => setDeleteDialog({ open: true, id: item.id })}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, data: null })}
        title={modal.data ? 'Edit Model' : 'Tambah Model'}
        size="xl"
      >
        <ModelForm
          defaultValues={modal.data}
          onSubmit={(v) => saveMutation.mutate(v)}
          isLoading={saveMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
        onConfirm={() => deleteMutation.mutate(deleteDialog.id)}
        title="Hapus Model"
        message="Model ini akan dihapus permanen. Lanjutkan?"
      />
    </div>
  )
}
