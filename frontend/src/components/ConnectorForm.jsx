import { useForm } from 'react-hook-form'
import { useState } from 'react'

const defaultVals = {
  name: '', description: '', url: '', method: 'GET',
  headers: '{}', query_params: '{}', body: '',
  pagination_type: 'cursor', pagination_param: 'page',
  cursor_path: 'data.nextCursor', data_path: 'data.items', total_path: 'data.totalItems',
}

export default function ConnectorForm({ defaultValues, onSubmit, isLoading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: defaultValues ? {
      ...defaultValues,
      headers: JSON.stringify(defaultValues.headers || {}, null, 2),
      query_params: JSON.stringify(defaultValues.query_params || {}, null, 2),
      body: defaultValues.body ? JSON.stringify(defaultValues.body, null, 2) : '',
    } : defaultVals,
  })

  const submit = (data) => {
    try {
      onSubmit({
        ...data,
        headers: JSON.parse(data.headers || '{}'),
        query_params: JSON.parse(data.query_params || '{}'),
        body: data.body ? JSON.parse(data.body) : null,
      })
    } catch (e) {
      alert('JSON tidak valid: ' + e.message)
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Nama Connector *</label>
          <input className="input" placeholder="Contoh: API Keluarga Kemenag" {...register('name', { required: true })} />
        </div>
        <div className="col-span-2">
          <label className="label">Deskripsi</label>
          <input className="input" placeholder="Deskripsi singkat" {...register('description')} />
        </div>
        <div>
          <label className="label">Method</label>
          <select className="input" {...register('method')}>
            <option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option>
          </select>
        </div>
        <div>
          <label className="label">URL *</label>
          <input className="input" placeholder="https://api.example.com/data" {...register('url', { required: true })} />
        </div>
      </div>

      <div>
        <label className="label">Headers (JSON)</label>
        <textarea className="input font-mono text-xs" rows={3} placeholder='{"x-api-key": "your-key"}' {...register('headers')} />
      </div>

      <div>
        <label className="label">Query Params (JSON)</label>
        <textarea className="input font-mono text-xs" rows={2} placeholder='{"limit": "10"}' {...register('query_params')} />
      </div>

      <div>
        <label className="label">Body (JSON, opsional)</label>
        <textarea className="input font-mono text-xs" rows={3} placeholder="null untuk GET request" {...register('body')} />
      </div>

      <hr className="border-gray-100" />
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Konfigurasi Pagination</p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Tipe Pagination</label>
          <select className="input" {...register('pagination_type')}>
            <option value="cursor">Cursor</option>
            <option value="page">Page</option>
            <option value="offset">Offset</option>
          </select>
        </div>
        <div>
          <label className="label">Nama Parameter</label>
          <input className="input" placeholder="page / cursor" {...register('pagination_param')} />
        </div>
        <div>
          <label className="label">Path Data (dot notation)</label>
          <input className="input font-mono text-xs" placeholder="data.items" {...register('data_path')} />
        </div>
        <div>
          <label className="label">Path Total Items</label>
          <input className="input font-mono text-xs" placeholder="data.totalItems" {...register('total_path')} />
        </div>
        <div className="col-span-2">
          <label className="label">Path Cursor (untuk cursor pagination)</label>
          <input className="input font-mono text-xs" placeholder="data.nextCursor" {...register('cursor_path')} />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </form>
  )
}
