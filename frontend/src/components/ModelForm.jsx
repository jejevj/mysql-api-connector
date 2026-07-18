import { useForm, useFieldArray } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { connectorApi } from '../lib/api'

const SQL_TYPES = ['VARCHAR(255)', 'TEXT', 'LONGTEXT', 'INT', 'BIGINT', 'DECIMAL(15,2)', 'TINYINT(1)', 'DATE', 'DATETIME', 'JSON']

export default function ModelForm({ defaultValues, onSubmit, isLoading }) {
  const { data: connectors } = useQuery({
    queryKey: ['connectors'],
    queryFn: () => connectorApi.list().then(r => r.data),
  })

  const { register, handleSubmit, control } = useForm({
    defaultValues: defaultValues || {
      name: '', connector_id: '', target_db_host: 'host.docker.internal',
      target_db_port: 3306, target_db_name: '', target_db_user: 'root',
      target_db_password: '', target_table: '',
      field_mappings: [{ source: '', target: '', type: 'VARCHAR(255)', nullable: true }],
      upsert_keys: '',
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'field_mappings' })

  const submit = (data) => {
    onSubmit({
      ...data,
      target_db_port: Number(data.target_db_port),
      upsert_keys: data.upsert_keys ? data.upsert_keys.split(',').map(s => s.trim()).filter(Boolean) : [],
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Nama Model *</label>
          <input className="input" placeholder="Contoh: Keluarga Kemenag" {...register('name', { required: true })} />
        </div>
        <div className="col-span-2">
          <label className="label">Connector *</label>
          <select className="input" {...register('connector_id', { required: true })}>
            <option value="">Pilih connector...</option>
            {connectors?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <hr className="border-gray-100" />
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Target Database</p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Host</label>
          <input className="input" placeholder="host.docker.internal" {...register('target_db_host')} />
        </div>
        <div>
          <label className="label">Port</label>
          <input className="input" type="number" placeholder="3306" {...register('target_db_port')} />
        </div>
        <div>
          <label className="label">Database Name</label>
          <input className="input" placeholder="nama_database" {...register('target_db_name')} />
        </div>
        <div>
          <label className="label">Tabel Target</label>
          <input className="input font-mono text-xs" placeholder="nama_tabel" {...register('target_table')} />
        </div>
        <div>
          <label className="label">User</label>
          <input className="input" placeholder="root" {...register('target_db_user')} />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" placeholder="kosongkan jika tanpa password" {...register('target_db_password')} />
        </div>
        <div className="col-span-2">
          <label className="label">Upsert Keys (pisahkan koma)</label>
          <input className="input font-mono text-xs" placeholder="nomor_kartu_keluarga, id" {...register('upsert_keys')} />
        </div>
      </div>

      <hr className="border-gray-100" />
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Field Mapping</p>
        <button type="button" className="btn-secondary text-xs px-2 py-1" onClick={() => append({ source: '', target: '', type: 'VARCHAR(255)', nullable: true })}>
          <Plus size={12} /> Tambah Field
        </button>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 font-medium px-1">
          <span className="col-span-4">Source (dari API)</span>
          <span className="col-span-4">Target (kolom DB)</span>
          <span className="col-span-3">Tipe</span>
          <span className="col-span-1"></span>
        </div>
        {fields.map((field, idx) => (
          <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
            <input className="input font-mono text-xs col-span-4" placeholder="nama_field_api" {...register(`field_mappings.${idx}.source`)} />
            <input className="input font-mono text-xs col-span-4" placeholder="nama_kolom_db" {...register(`field_mappings.${idx}.target`)} />
            <select className="input text-xs col-span-3" {...register(`field_mappings.${idx}.type`)}>
              {SQL_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <button type="button" className="col-span-1 p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" onClick={() => remove(idx)}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary" disabled={isLoading}>{isLoading ? 'Menyimpan...' : 'Simpan'}</button>
      </div>
    </form>
  )
}
