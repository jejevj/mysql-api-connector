import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, LayoutGrid, Trash2, Pencil, Table2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { modelApi } from '../lib/api'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'
import ModelForm from '../components/ModelForm'

export default function ModelsPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState({ open: false, data: null })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null })

  const { data, isLoading } = useQuery({
    queryKey: ['models'],
    queryFn: () => modelApi.list().then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (payload) => modal.data ? modelApi.update(modal.data.id, payload) : modelApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['models'] })
      toast.success(modal.data ? 'Model diperbarui' : 'Model dibuat')
      setModal({ open: false, data: null })
    },
    onError: (e) => toast.error(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => modelApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['models'] }); toast.success('Model dihapus') },
    onError: (e) => toast.error(e.message),
  })

  const createTableMutation = useMutation({
    mutationFn: (id) => modelApi.createTable(id).then(r => r.data),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ['models'] }); toast.success(`Tabel "${res.table}" berhasil dibuat`) },
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
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card p-4 h-20 animate-pulse bg-gray-100" />)}</div>
      ) : !data?.length ? (
        <EmptyState icon={LayoutGrid} title="Belum ada model" description="Buat model untuk mendefinisikan mapping field API ke tabel MySQL." action={<button className="btn-primary" onClick={() => setModal({ open: true, data: null })}><Plus size={15} /> Tambah Model</button>} />
      ) : (
        <div className="space-y-3">
          {data.map(item => (
            <div key={item.id} className="card p-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                <LayoutGrid size={16} className="text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  {item.table_created && <span className="badge bg-emerald-50 text-emerald-600">Tabel aktif</span>}
                </div>
                <p className="text-xs text-gray-400">{item.target_db_host}:{item.target_db_port} / {item.target_db_name} → <span className="font-mono">{item.target_table}</span></p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {!item.table_created && (
                  <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => createTableMutation.mutate(item.id)} disabled={createTableMutation.isPending}>
                    <Table2 size={12} /> Buat Tabel
                  </button>
                )}
                <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => setModal({ open: true, data: item })}><Pencil size={12} /> Edit</button>
                <button className="btn text-xs px-3 py-1.5 text-red-500 hover:bg-red-50" onClick={() => setDeleteDialog({ open: true, id: item.id })}><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal.open} onClose={() => setModal({ open: false, data: null })} title={modal.data ? 'Edit Model' : 'Tambah Model'} size="xl">
        <ModelForm defaultValues={modal.data} onSubmit={(v) => saveMutation.mutate(v)} isLoading={saveMutation.isPending} />
      </Modal>

      <ConfirmDialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })} onConfirm={() => deleteMutation.mutate(deleteDialog.id)} title="Hapus Model" message="Model ini akan dihapus permanen. Lanjutkan?" />
    </div>
  )
}
