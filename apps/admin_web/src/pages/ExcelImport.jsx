import { useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../core/api'
import { MODULE_TYPES } from '../core/constants'

export default function ExcelImport() {
  const { id, type } = useParams()
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1=upload, 2=map, 3=done
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null) // { headers, sample }
  const [moduleId, setModuleId] = useState('')
  const [columnMap, setColumnMap] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const fileRef = useRef()

  const apiType = type.replace('_', '-')

  async function uploadPreview() {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post('/import/preview', form)
      setPreview(data)
      // Get module id from URL query
      const params = new URLSearchParams(window.location.search)
      setModuleId(params.get('moduleId') || '')
      setStep(2)
    } catch {
      setError('Failed to read file. Make sure it is a valid .xlsx file.')
    } finally {
      setLoading(false)
    }
  }

  async function doImport() {
    setLoading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('column_map', JSON.stringify(columnMap))
      const { data } = await api.post(`/import/${apiType}/${moduleId}`, form)
      setResult(data)
      setStep(3)
    } catch (err) {
      setError(err.response?.data?.detail || 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <Link to={`/projects/${id}/modules/${type}`} className="back-link">← Back to Module</Link>
      <h1 className="page-title">📊 Import from Excel — {MODULE_TYPES[type]}</h1>

      {error && <div className="alert alert-error">{error}</div>}

      {step === 1 && (
        <div className="card">
          <h2 className="section-title">Step 1: Upload Excel File</h2>
          <div
            className="file-drop"
            onClick={() => fileRef.current.click()}
          >
            <div style={{ fontSize: 40, marginBottom: 8 }}>📁</div>
            <div>{file ? file.name : 'Click to select .xlsx file'}</div>
            <div className="text-sm text-gray mt-2">Only .xlsx files supported</div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx"
            style={{ display: 'none' }}
            onChange={e => setFile(e.target.files[0])}
          />
          <div className="mt-4">
            <button className="btn btn-primary" onClick={uploadPreview} disabled={!file || loading}>
              {loading ? 'Reading…' : 'Preview File →'}
            </button>
          </div>
        </div>
      )}

      {step === 2 && preview && (
        <div className="card">
          <h2 className="section-title">Step 2: Map Columns</h2>
          <p className="text-sm text-gray mb-4">
            Match your Excel columns to the fields below. Sample data shown.
          </p>
          <table style={{ width: '100%', marginBottom: 20 }}>
            <thead>
              <tr>
                {preview.headers.map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {preview.sample.slice(0, 3).map((row, i) => (
                <tr key={i}>
                  {preview.headers.map(h => <td key={h}>{row[h] ?? ''}</td>)}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid-2">
            {['name', 'description', 'status', 'notes'].map(field => (
              <div className="form-group" key={field}>
                <label className="form-label">"{field}" column</label>
                <select
                  className="form-select"
                  value={columnMap[field] || ''}
                  onChange={e => setColumnMap(m => ({ ...m, [field]: e.target.value }))}
                >
                  <option value="">— skip —</option>
                  {preview.headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <button className="btn btn-primary" onClick={doImport} disabled={loading}>
              {loading ? 'Importing…' : 'Import Items'}
            </button>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
          </div>
        </div>
      )}

      {step === 3 && result && (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>✅</div>
          <h2 className="section-title">Import Complete!</h2>
          <p className="text-gray">{result.created ?? result.count ?? 0} items imported successfully.</p>
          <div className="mt-4">
            <Link to={`/projects/${id}/modules/${type}`} className="btn btn-primary">View Module</Link>
          </div>
        </div>
      )}
    </div>
  )
}
