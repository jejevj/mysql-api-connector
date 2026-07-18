import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Database, Table2, Zap, CheckCircle2, ChevronRight,
  ChevronLeft, Loader2, AlertCircle, RefreshCw, Check, X
} from 'lucide-react'
import { connectorApi, modelApi } from '../lib/api'
import api from '../lib/api'

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), obj)
}

function extractApiFields(responseData, dataPath) {
  let items = responseData
  if (dataPath) {
    const parts = dataPath.split('.')
    for (const part of parts) {
      if (items && typeof items === 'object') items = items[part]
    }
  }
  const sample = Array.isArray(items) ? items[0] : items
  if (!sample || typeof sample !== 'object') return []
  return Object.keys(sample).map(key => ({ key, sampleValue: sample[key] }))
}

function autoMapFields(apiFields, dbColumns) {
  const mappings = []
  const dbColMap = {}
  dbColumns.forEach(c => { dbColMap[c.column.toLowerCase()] = c })
  apiFields.forEach(({ key, sampleValue }) => {
    const match = dbColMap[key.toLowerCase()]
    if (match) {
      mappings.push({
        source: key,
        target: match.column,
        type: match.type.toUpperCase(),
        matched: true,
        sampleValue,
      })
    }
  })
  return mappings
}

function TypeBadge({ type }) {
  const t = type?.toLowerCase() || ''
  let color = 'bg-gray-100 text-gray-500'
  if (t.includes('int') || t.includes('decimal')) color = 'bg-blue-50 text-blue-600'
  else if (t.includes('varchar') || t.includes('text') || t.includes('char')) color = 'bg-green-50 text-green-600'
  else if (t.includes('date') || t.includes('time')) color = 'bg-purple-50 text-purple-600'
  else if (t.includes('json')) color = 'bg-amber-50 text-amber-600'
  return <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${color}`}>{type}</span>
}

function Steps({ current }) {
  const steps = [
    { n: 1, label: 'Konfigurasi DB' },
    { n: 2, label: 'Pilih Tabel' },
    { n: 3, label: 'Mapping Field' },
    { n: 4, label: 'Konfirmasi' },
  ]
  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
            current === s.n ? 'bg-blue-600 text-white' :
            current > s.n ? 'bg-green-100 text-green-700' :
            'bg-gray-100 text-gray-400'
          }`}>
            {current > s.n ? <Check size={11} /> : <span>{s.n}</span>}
            <span className="hidden sm:inline">{s.label}</span>
          </div>
          {i < steps.length - 1 && <ChevronRight size={14} className="text-gray-300 mx-1" />}
        </div>
      ))}
    </div>
  )
}

export default function ModelForm({ defaultValues, onSubmit, isLoading }) {
  const isEditing = !!defaultValues?.id

  // Jika edit & sudah ada mappings, langsung ke step 3
  const [step, setStep] = useState(isEditing && defaultValues?.field_mappings?.length > 0 ? 3 : 1)

  const [dbConfig, setDbConfig] = useState({
    host: defaultValues?.target_db_host || 'host.docker.internal',
    port: defaultValues?.target_db_port || 3306,
    db_name: defaultValues?.target_db_name || '',
    user: defaultValues?.target_db_user || 'root',
    password: defaultValues?.target_db_password || '',
  })
  const [tables, setTables] = useState([])
  const [selectedTable, setSelectedTable] = useState(defaultValues?.target_table || '')
  const [dbColumns, setDbColumns] = useState([])
  const [apiFields, setApiFields] = useState([])

  // ← Populate dari defaultValues jika edit
  const [mappings, setMappings] = useState(
    Array.isArray(defaultValues?.field_mappings) && defaultValues.field_mappings.length > 0
      ? defaultValues.field_mappings.map(m => ({ ...m, matched: true, sampleValue: null }))
      : []
  )

  const [connectorId, setConnectorId] = useState(defaultValues?.connector_id || '')
  const [modelName, setModelName] = useState(defaultValues?.name || '')
  const [upsertKeys, setUpsertKeys] = useState(
    Array.isArray(defaultValues?.upsert_keys)
      ? defaultValues.upsert_keys.join(', ')
      : (defaultValues?.upsert_keys || '')
  )
  const [tableSearch, setTableSearch] = useState('')

  const { data: connectors } = useQuery({
    queryKey: ['connectors'],
    queryFn: () => connectorApi.list().then(r => r.data),
  })

  const testMutation = useMutation({
    mutationFn: (id) => connectorApi.test(id).then(r => r.data),
  })

  const tablesMutation = useMutation({
    mutationFn: (cfg) => api.post('/models/db-tables', cfg).then(r => r.data),
    onSuccess: (data) => {
      setTables(data.tables || [])
      setStep(2)
    },
  })

  const columnsMutation = useMutation({
    mutationFn: async (table) => {
      const connector = connectors?.find(c => String(c.id) === String(connectorId))
      const [colRes, testRes] = await Promise.all([
        api.post('/models/db-columns', { ...dbConfig, table }).then(r => r.data),
        testMutation.mutateAsync(connectorId),
      ])
      return { columns: colRes.columns, testResult: testRes, connector }
    },
    onSuccess: ({ columns, testResult, connector }) => {
      setDbColumns(columns)
      const fields = extractApiFields(testResult.response, connector?.data_path || 'data.items')
      setApiFields(fields)
      const auto = autoMapFields(fields, columns)
      setMappings(auto)
      setStep(3)
    },
  })

  // Re-fetch mappings dari API + DB (refresh mapping saat edit)
  const refreshMappingMutation = useMutation({
    mutationFn: async () => {
      const connector = connectors?.find(c => String(c.id) === String(connectorId))
      if (!connector) throw new Error('Connector tidak ditemukan')
      const [colRes, testRes] = await Promise.all([
        api.post('/models/db-columns', { ...dbConfig, table: selectedTable }).then(r => r.data),
        connectorApi.test(connector.id).then(r => r.data),
      ])
      return { columns: colRes.columns, testResult: testRes, connector }
    },
    onSuccess: ({ columns, testResult, connector }) => {
      setDbColumns(columns)
      const fields = extractApiFields(testResult.response, connector?.data_path || 'data.items')
      setApiFields(fields)
      const auto = autoMapFields(fields, columns)
      setMappings(auto)
    },
  })

  const handleStep1 = () => {
    if (!connectorId) return alert('Pilih connector terlebih dahulu')
    if (!dbConfig.db_name) return alert('Isi nama database')
    tablesMutation.mutate(dbConfig)
  }

  const handleStep2 = (table) => {
    setSelectedTable(table)
    columnsMutation.mutate(table)
  }

  const handleStep4 = () => {
    onSubmit({
      name: modelName,
      connector_id: Number(connectorId),
      target_db_host: dbConfig.host,
      target_db_port: Number(dbConfig.port),
      target_db_name: dbConfig.db_name,
      target_db_user: dbConfig.user,
      target_db_password: dbConfig.password,
      target_table: selectedTable,
      field_mappings: mappings.map(m => ({ source: m.source, target: m.target, type: m.type, nullable: true })),
      upsert_keys: upsertKeys ? upsertKeys.split(',').map(s => s.trim()).filter(Boolean) : [],
    })
  }

  const unmatchedApiFields = apiFields.filter(f => !mappings.find(m => m.source === f.key))
  const filteredTables = tables.filter(t => t.toLowerCase().includes(tableSearch.toLowerCase()))

  return (
    <div className="space-y-4">
      <Steps current={step} />

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="label">Nama Model *</label>
            <input className="input" placeholder="Contoh: Keluarga Kemenag" value={modelName} onChange={e => setModelName(e.target.value)} />
          </div>
          <div>
            <label className="label">Connector *</label>
            <select className="input" value={connectorId} onChange={e => setConnectorId(e.target.value)}>
              <option value="">Pilih connector...</option>
              {connectors?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
              <Database size={13} /> Target Database
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Host</label>
                <input className="input" value={dbConfig.host} onChange={e => setDbConfig(p => ({ ...p, host: e.target.value }))} />
              </div>
              <div>
                <label className="label">Port</label>
                <input className="input" type="number" value={dbConfig.port} onChange={e => setDbConfig(p => ({ ...p, port: Number(e.target.value) }))} />
              </div>
              <div className="col-span-2">
                <label className="label">Database Name *</label>
                <input className="input" value={dbConfig.db_name} onChange={e => setDbConfig(p => ({ ...p, db_name: e.target.value }))} />
              </div>
              <div>
                <label className="label">User</label>
                <input className="input" value={dbConfig.user} onChange={e => setDbConfig(p => ({ ...p, user: e.target.value }))} />
              </div>
              <div>
                <label className="label">Password</label>
                <input className="input" type="password" value={dbConfig.password} onChange={e => setDbConfig(p => ({ ...p, password: e.target.value }))} />
              </div>
            </div>
          </div>
          {tablesMutation.isError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              <AlertCircle size={14} /> {tablesMutation.error?.message}
            </div>
          )}
          <button type="button" className="btn-primary w-full" onClick={handleStep1} disabled={tablesMutation.isPending}>
            {tablesMutation.isPending
              ? <><Loader2 size={14} className="animate-spin" /> Menghubungkan...</>
              : <><Database size={14} /> Hubungkan & Lihat Tabel <ChevronRight size={14} /></>}
          </button>
        </div>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              <span className="text-green-600 font-semibold">{tables.length}</span> tabel di <code className="bg-gray-100 px-1 rounded text-xs">{dbConfig.db_name}</code>
            </p>
            <button type="button" className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1" onClick={() => setStep(1)}>
              <ChevronLeft size={12} /> Kembali
            </button>
          </div>
          <input className="input text-sm" placeholder="Cari nama tabel..." value={tableSearch} onChange={e => setTableSearch(e.target.value)} />
          {columnsMutation.isError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              <AlertCircle size={14} /> {columnsMutation.error?.message}
            </div>
          )}
          <div className="border border-gray-200 rounded-lg overflow-hidden max-h-72 overflow-y-auto divide-y divide-gray-100">
            {filteredTables.map(table => (
              <button key={table} type="button"
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 transition-colors text-left group"
                onClick={() => handleStep2(table)} disabled={columnsMutation.isPending}>
                <div className="flex items-center gap-2">
                  {columnsMutation.isPending && columnsMutation.variables === table
                    ? <Loader2 size={13} className="animate-spin text-blue-500" />
                    : <Table2 size={13} className="text-gray-400 group-hover:text-blue-500" />}
                  <span className="font-mono text-sm text-gray-700 group-hover:text-blue-700">{table}</span>
                </div>
                <ChevronRight size={13} className="text-gray-300 group-hover:text-blue-400" />
              </button>
            ))}
            {filteredTables.length === 0 && <div className="text-center py-8 text-sm text-gray-400">Tidak ada tabel yang cocok</div>}
          </div>
        </div>
      )}

      {/* ── STEP 3 ── */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">
                Mapping ke <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">{selectedTable}</code>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                <span className="text-green-600 font-medium">{mappings.length} field</span>
                {unmatchedApiFields.length > 0 && <span className="text-amber-600 ml-2">{unmatchedApiFields.length} tidak cocok</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Tombol refresh mapping dari API */}
              {!isEditing || dbColumns.length > 0 ? null : (
                <button
                  type="button"
                  className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 border border-blue-200 rounded px-2 py-1"
                  onClick={() => refreshMappingMutation.mutate()}
                  disabled={refreshMappingMutation.isPending}
                >
                  {refreshMappingMutation.isPending
                    ? <Loader2 size={11} className="animate-spin" />
                    : <RefreshCw size={11} />}
                  Refresh dari API
                </button>
              )}
              {!isEditing && (
                <button type="button" className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1" onClick={() => setStep(2)}>
                  <ChevronLeft size={12} /> Kembali
                </button>
              )}
            </div>
          </div>

          {/* Edit mode: info banner */}
          {isEditing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700 flex items-start gap-2">
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
              <span>
                Mode edit — mapping di bawah sudah tersimpan sebelumnya.
                Klik <strong>Simpan Model</strong> untuk update, atau klik <strong>Ulang dari Awal</strong> untuk redo wizard lengkap.
              </span>
            </div>
          )}

          {isEditing && (
            <button
              type="button"
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              onClick={() => { setMappings([]); setStep(1) }}
            >
              <ChevronLeft size={11} /> Ulang dari Awal
            </button>
          )}

          {/* Matched fields */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-green-50 px-3 py-2 border-b border-gray-200">
              <p className="text-xs font-semibold text-green-700 flex items-center gap-1.5">
                <CheckCircle2 size={12} /> Field Mapping ({mappings.length})
              </p>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
              {mappings.map((m, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 text-xs">
                  <span className="font-mono text-gray-600 w-44 truncate" title={m.source}>{m.source}</span>
                  <ChevronRight size={11} className="text-gray-300 flex-shrink-0" />
                  <span className="font-mono text-blue-700 w-44 truncate" title={m.target}>{m.target}</span>
                  <TypeBadge type={m.type} />
                  {m.sampleValue !== null && m.sampleValue !== undefined && (
                    <span className="text-gray-400 truncate flex-1 ml-1">
                      {String(m.sampleValue).substring(0, 25)}
                    </span>
                  )}
                  <button type="button" className="text-red-300 hover:text-red-500 flex-shrink-0"
                    onClick={() => setMappings(prev => prev.filter((_, j) => j !== i))}>
                    <X size={12} />
                  </button>
                </div>
              ))}
              {mappings.length === 0 && (
                <div className="text-center py-6 text-xs text-gray-400">
                  Belum ada mapping. Klik "Ulang dari Awal" untuk redo wizard.
                </div>
              )}
            </div>
          </div>

          {unmatchedApiFields.length > 0 && (
            <div className="border border-amber-200 rounded-lg overflow-hidden">
              <div className="bg-amber-50 px-3 py-2 border-b border-amber-200">
                <p className="text-xs font-semibold text-amber-700">⚠ Field API tidak ada di tabel ({unmatchedApiFields.length})</p>
              </div>
              <div className="max-h-32 overflow-y-auto divide-y divide-amber-100">
                {unmatchedApiFields.map(f => (
                  <div key={f.key} className="flex items-center gap-2 px-3 py-1.5 text-xs text-amber-800">
                    <span className="font-mono w-40 truncate">{f.key}</span>
                    <span className="text-amber-400 flex-1 truncate">{String(f.sampleValue ?? 'null').substring(0, 40)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="label">Upsert Keys <span className="text-gray-400 font-normal">(kolom unik, pisahkan koma)</span></label>
            <input
              className="input font-mono text-xs"
              placeholder="nomor_kartu_keluarga"
              value={upsertKeys}
              onChange={e => setUpsertKeys(e.target.value)}
            />
          </div>

          <button type="button" className="btn-primary w-full" onClick={() => setStep(4)} disabled={mappings.length === 0}>
            Lanjut Konfirmasi <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* ── STEP 4 ── */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
            <div className="px-4 py-3 flex justify-between text-sm">
              <span className="text-gray-500">Nama Model</span>
              <span className="font-medium">{modelName}</span>
            </div>
            <div className="px-4 py-3 flex justify-between text-sm">
              <span className="text-gray-500">Connector</span>
              <span className="font-medium">{connectors?.find(c => String(c.id) === String(connectorId))?.name}</span>
            </div>
            <div className="px-4 py-3 flex justify-between text-sm">
              <span className="text-gray-500">Database Target</span>
              <span className="font-mono text-xs">{dbConfig.host}:{dbConfig.port}/{dbConfig.db_name}</span>
            </div>
            <div className="px-4 py-3 flex justify-between text-sm">
              <span className="text-gray-500">Tabel Target</span>
              <span className="font-mono font-medium">{selectedTable}</span>
            </div>
            <div className="px-4 py-3 flex justify-between text-sm">
              <span className="text-gray-500">Field di-sync</span>
              <span className="font-medium text-green-600">{mappings.length} field</span>
            </div>
            <div className="px-4 py-3 flex justify-between text-sm">
              <span className="text-gray-500">Upsert Key</span>
              <span className="font-mono text-xs">{upsertKeys || '(tidak ada)'}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setStep(3)}>
              <ChevronLeft size={14} /> Kembali
            </button>
            <button type="button" className="btn-primary flex-1" onClick={handleStep4} disabled={isLoading}>
              {isLoading
                ? <><Loader2 size={14} className="animate-spin" /> Menyimpan...</>
                : <><CheckCircle2 size={14} /> Simpan Model</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
