import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, Trash2, Zap, CheckSquare, Square, Loader2, AlertCircle } from 'lucide-react'
import { connectorApi } from '../lib/api'
import { useState, useEffect } from 'react'

const SQL_TYPES = ['VARCHAR(255)', 'TEXT', 'LONGTEXT', 'INT', 'BIGINT', 'DECIMAL(15,2)', 'TINYINT(1)', 'DATE', 'DATETIME', 'JSON']

// Deteksi tipe SQL dari nilai
function detectSqlType(value) {
  if (value === null || value === undefined) return 'VARCHAR(255)'
  if (typeof value === 'boolean') return 'TINYINT(1)'
  if (typeof value === 'object') return 'JSON'
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return value > 2147483647 ? 'BIGINT' : 'INT'
    }
    return 'DECIMAL(15,2)'
  }
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return 'DATETIME'
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'DATE'
    if (value.length > 500) return 'TEXT'
    // bisa jadi angka yang disimpan sebagai string
    if (/^\d+$/.test(value) && value.length > 10) return 'BIGINT'
    if (/^\d+$/.test(value)) return 'INT'
  }
  return 'VARCHAR(255)'
}

// Flatten object satu level + ambil dari data_path
function extractFields(responseData, dataPath) {
  let items = responseData
  // navigasi ke data_path (e.g. "data.items")
  if (dataPath) {
    const parts = dataPath.split('.')
    for (const part of parts) {
      if (items && typeof items === 'object') items = items[part]
    }
  }
  // ambil item pertama jika array
  const sample = Array.isArray(items) ? items[0] : items
  if (!sample || typeof sample !== 'object') return []

  return Object.entries(sample).map(([key, val]) => ({
    source: key,
    target: key,
    type: detectSqlType(val),
    nullable: true,
    sample: val === null ? 'null' : String(val).substring(0, 60),
  }))
}

export default function ModelForm({ defaultValues, onSubmit, isLoading }) {
  const [availableFields, setAvailableFields] = useState([])
  const [selectedFields, setSelectedFields] = useState(new Set())
  const [fetchError, setFetchError] = useState(null)

  const { data: connectors } = useQuery({
    queryKey: ['connectors'],
    queryFn: () => connectorApi.list().then(r => r.data),
  })

  const { register, handleSubmit, control, setValue, getValues } = useForm({
    defaultValues: defaultValues || {
      name: '', connector_id: '', target_db_host: 'host.docker.internal',
      target_db_port: 3306, target_db_name: '', target_db_user: 'root',
      target_db_password: '', target_table: '',
      field_mappings: [],
      upsert_keys: '',
    },
  })

  const { fields, append, remove, replace } = useFieldArray({ control, name: 'field_mappings' })
  const watchedConnectorId = useWatch({ control, name: 'connector_id' })

  // Auto-test connector saat connector dipilih
  const testMutation = useMutation({
    mutationFn: (id) => connectorApi.test(id).then(r => r.data),
    onSuccess: (result) => {
      setFetchError(null)
      const connector = connectors?.find(c => String(c.id) === String(watchedConnectorId))
      const fields = extractFields(result.response, connector?.data_path || 'data.items')
      setAvailableFields(fields)
      // Pre-select semua field
      setSelectedFields(new Set(fields.map(f => f.source)))
    },
    onError: (e) => {
      setFetchError(e.message)
      setAvailableFields([])
    },
  })

  useEffect(() => {
    if (watchedConnectorId) {
      setAvailableFields([])
      setSelectedFields(new Set())
      setFetchError(null)
      testMutation.mutate(watchedConnectorId)
    }
  }, [watchedConnectorId])

  // Toggle pilih field
  const toggleField = (source) => {
    setSelectedFields(prev => {
      const next = new Set(prev)
      next.has(source) ? next.delete(source) : next.add(source)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedFields.size === availableFields.length) {
      setSelectedFields(new Set())
    } else {
      setSelectedFields(new Set(availableFields.map(f => f.source)))
    }
  }

  // Terapkan field yang dipilih ke form field_mappings
  const applySelectedFields = () => {
    const mappings = availableFields
      .filter(f => selectedFields.has(f.source))
      .map(f => ({ source: f.source, target: f.target, type: f.type, nullable: true }))
    replace(mappings)
  }

  const submit = (data) => {
    onSubmit({
      ...data,
      connector_id: Number(data.connector_id),
      target_db_port: Number(data.target_db_port),
      upsert_keys: data.upsert_keys ? data.upsert_keys.split(',').map(s => s.trim()).filter(Boolean) : [],
    })
  }

  const allSelected = availableFields.length > 0 && selectedFields.size === availableFields.length

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      {/* Nama Model */}
      <div>
        <label className="label">Nama Model *</label>
        <input className="input" placeholder="Contoh: Keluarga Kemenag" {...register('name', { required: true })} />
      </div>

      {/* Pilih Connector */}
      <div>
        <label className="label">Connector *</label>
        <select className="input" {...register('connector_id', { required: true })}>
          <option value="">Pilih connector...</option>
          {connectors?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Status fetch fields */}
      {testMutation.isPending && (
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
          <Loader2 size={14} className="animate-spin" />
          Mengambil data dari API connector...
        </div>
      )}
      {fetchError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          <AlertCircle size={14} />
          Gagal fetch API: {fetchError}
        </div>
      )}

      {/* Field Selector dari response API */}
      {availableFields.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between bg-gray-50 px-3 py-2 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Zap size={13} className="text-amber-500" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {availableFields.length} Field Terdeteksi dari API
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1" onClick={toggleAll}>
                {allSelected ? <CheckSquare size={13} className="text-blue-500" /> : <Square size={13} />}
                {allSelected ? 'Batal Semua' : 'Pilih Semua'}
              </button>
              <button
                type="button"
                className="btn-primary text-xs px-2 py-1"
                onClick={applySelectedFields}
                disabled={selectedFields.size === 0}
              >
                Terapkan ({selectedFields.size})
              </button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
            {availableFields.map((f) => {
              const checked = selectedFields.has(f.source)
              return (
                <label
                  key={f.source}
                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                    checked ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleField(f.source)}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className="font-mono text-xs text-gray-800 flex-1">{f.source}</span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">{f.type}</span>
                  <span className="text-xs text-gray-400 truncate max-w-[120px]" title={f.sample}>
                    {f.sample}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      )}

      <hr className="border-gray-100" />
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Target Database</p>

      <div className="grid grid-cols-2 gap-3">
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
          <label className="label">Upsert Keys <span className="text-gray-400 font-normal">(pisahkan koma)</span></label>
          <input className="input font-mono text-xs" placeholder="nomor_kartu_keluarga, id" {...register('upsert_keys')} />
        </div>
      </div>

      {/* Field Mapping Editor */}
      {fields.length > 0 && (
        <>
          <hr className="border-gray-100" />
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Field Mapping ({fields.length} field)
            </p>
            <button
              type="button"
              className="btn-secondary text-xs px-2 py-1"
              onClick={() => append({ source: '', target: '', type: 'VARCHAR(255)', nullable: true })}
            >
              <Plus size={12} /> Tambah Manual
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 font-medium px-1">
              <span className="col-span-4">Source (dari API)</span>
              <span className="col-span-4">Target (kolom DB)</span>
              <span className="col-span-3">Tipe</span>
              <span className="col-span-1"></span>
            </div>
            {fields.map((field, idx) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                <input
                  className="input font-mono text-xs col-span-4"
                  placeholder="nama_field_api"
                  {...register(`field_mappings.${idx}.source`)}
                />
                <input
                  className="input font-mono text-xs col-span-4"
                  placeholder="nama_kolom_db"
                  {...register(`field_mappings.${idx}.target`)}
                />
                <select className="input text-xs col-span-3" {...register(`field_mappings.${idx}.type`)}>
                  {SQL_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                <button
                  type="button"
                  className="col-span-1 p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  onClick={() => remove(idx)}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Menyimpan...' : 'Simpan Model'}
        </button>
      </div>
    </form>
  )
}
