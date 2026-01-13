import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DynamicFunnelForm from '../components/DynamicFunnelForm'
import { createWarmap } from '../lib/supabase'
import { FUNNEL_TYPES } from '../lib/funnelConfigs'

export default function CreateWarmap() {
  const { funnelType } = useParams()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const funnelInfo = FUNNEL_TYPES[funnelType]

  // Redirect if invalid funnel type
  if (!funnelInfo) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Funnel Type</h2>
          <p className="text-gray-600 mb-4">Please select a valid funnel type to continue.</p>
          <button onClick={() => navigate('/create')} className="btn-primary">
            Select Funnel Type
          </button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (formData) => {
    setSaving(true)
    setError(null)

    try {
      const { data, error: saveError } = await createWarmap(formData)

      if (saveError) {
        setError(saveError.message)
        setSaving(false)
        return
      }

      // Navigate to view page after successful save
      navigate(`/view/${data.id}`)
    } catch (err) {
      setError(err.message || 'An error occurred while saving')
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate('/create')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Link */}
      <button
        onClick={() => navigate('/create')}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Funnel Selection
      </button>

      {/* Header */}
      <div className="flex items-center gap-4">
        <span className="text-3xl">{funnelInfo.icon}</span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{funnelInfo.name}</h1>
          <p className="text-gray-600">{funnelInfo.description}</p>
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
          funnelType={funnelType}
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
