import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DynamicFunnelForm from '../components/DynamicFunnelForm'
import { getWarmap, updateWarmap } from '../lib/supabase'
import { FUNNEL_TYPES } from '../lib/funnelConfigs'

export default function EditWarmap() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [warmap, setWarmap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadWarmap()
  }, [id])

  const loadWarmap = async () => {
    setLoading(true)
    const { data, error: loadError } = await getWarmap(id)

    if (loadError) {
      setError(loadError.message)
    } else {
      setWarmap(data)
    }
    setLoading(false)
  }

  const handleSubmit = async (formData) => {
    setSaving(true)
    setError(null)

    try {
      const { data, error: saveError } = await updateWarmap(id, formData)

      if (saveError) {
        setError(saveError.message)
        setSaving(false)
        return
      }

      navigate(`/view/${id}`)
    } catch (err) {
      setError(err.message || 'An error occurred while saving')
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate(`/view/${id}`)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!warmap) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Warmap Not Found</h2>
          <p className="text-gray-600 mb-4">The warmap you're looking for doesn't exist.</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Back to Warmaps
          </button>
        </div>
      </div>
    )
  }

  const funnelInfo = FUNNEL_TYPES[warmap.funnel_type]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Link */}
      <button
        onClick={() => navigate(`/view/${id}`)}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Warmap
      </button>

      {/* Header */}
      <div className="flex items-center gap-4">
        <span className="text-3xl">{funnelInfo?.icon || '🗺️'}</span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Warmap</h1>
          <p className="text-gray-600">
            {warmap.client_name} - {warmap.business_name}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Form */}
      <div className={saving ? 'opacity-50 pointer-events-none' : ''}>
        <DynamicFunnelForm
          funnelType={warmap.funnel_type}
          initialData={warmap}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>

      {/* Saving Indicator */}
      {saving && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg flex items-center gap-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-900 font-medium">Saving warmap...</span>
          </div>
        </div>
      )}
    </div>
  )
}
