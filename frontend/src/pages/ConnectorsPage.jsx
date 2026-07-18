import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Link2, Trash2, Pencil, Play, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { connectorApi } from '../lib/api'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'
import ConnectorForm from '../components/ConnectorForm'

export default function ConnectorsPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState({ open: false, data: null })
  const [testModal, setTestModal] = useState({ open: false, result: null })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null })

  const { data, isLoading } = useQuery({
    queryKey: ['connectors'],
    queryFn: () => connectorApi.list().then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (payload) => modal.data
      ? connectorApi.update(modal.data.id, payload)
      : connectorApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['connectors'] })
      toast.success(modal.data ? 'Connector diperbarui' : 'Connector dibuat')
      setModal({ open: false, data: null })
    },
    onError: (e) => toast.error(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => connectorApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['connectors'] })
      toast.success('Connector dihapus')
    },
    onError: (e) => toast.error(e.message),
  })

  const testMutation = useMutation({
    mutationFn: (id) => connectorApi.test(id).then(r => r.data),
    onSuccess: (result) => setTestModal({ open: true, result }),
    onError: (e) => toast.error(e.message),
  })

  return (
    <div>
      <PageHeader
        title="Connectors"
        description="Konfigurasi sumber API yang akan di-sync ke MySQL"
        action={
          <button className="btn-primary" onClick={() => setModal({ open: true, data: null })}>
            <Plus size={15} /> Tambah Connector
          </button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card p-4 h-20 animate-pulse bg-gray-100" />)}</div>
      ) : !data?.length ? (
        <EmptyState
          icon={Link2}
          title="Belum ada connector"
          description="Tambahkan konfigurasi API pertama kamu untuk mulai sync data."
          action={<button className="btn-primary" onClick={() => setModal({ open: true, data: null })}><Plus size={15} /> Tambah Connector</button>}
        />
      ) : (
        <div className="space-y-3">
          {data.map(item => (
            <div key={item.id} className="card p-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                <Link2 size={16} className="text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-400 truncate">{item.method} {item.url}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => testMutation.mutate(item.id)} disabled={testMutation.isPending}>
                  <Play size={12} /> Test
                </button>
                <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => setModal({ open: true, data: item })}>
                  <Pencil size={12} /> Edit
                </button>
                <button className="btn text-xs px-3 py-1.5 text-red-500 hover:bg-red-50" onClick={() => setDeleteDialog({ open: true, id: item.id })}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal open={modal.open} onClose={() => setModal({ open: false, data: null })} title={modal.data ? 'Edit Connector' : 'Tambah Connector'} size="lg">
        <ConnectorForm
          defaultValues={modal.data}
          onSubmit={(v) => saveMutation.mutate(v)}
          isLoading={saveMutation.isPending}
        />
      </Modal>

      {/* Test Result Modal */}
      <Modal open={testModal.open} onClose={() => setTestModal({ open: false, result: null })} title="Hasil Test Request" size="xl">
        {testModal.result && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className={`badge ${testModal.result.status_code < 300 ? 'badge-done' : 'badge-error'}`}>{testModal.result.status_code}</span>
            </div>
            <pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-xl overflow-auto max-h-[60vh] font-mono">
              {JSON.stringify(testModal.result.response, null, 2)}
            </pre>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
        onConfirm={() => deleteMutation.mutate(deleteDialog.id)}
        title="Hapus Connector"
        message="Connector ini akan dihapus permanen. Lanjutkan?"
      />
    </div>
  )
}
