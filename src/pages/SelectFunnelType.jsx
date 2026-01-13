import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FunnelTypeSelector from '../components/FunnelTypeSelector'

export default function SelectFunnelType() {
  const navigate = useNavigate()
  const [selectedType, setSelectedType] = useState(null)

  const handleSelect = (type) => {
    setSelectedType(type)
  }

  const handleContinue = () => {
    if (selectedType) {
      navigate(`/create/${selectedType}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back Link */}
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Warmaps
      </button>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Warmap</h1>
        <p className="text-gray-600">Select the funnel type that matches your client's business model</p>
      </div>

      {/* Funnel Type Selector */}
      <FunnelTypeSelector onSelect={handleSelect} selectedType={selectedType} />

      {/* Continue Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleContinue}
          disabled={!selectedType}
          className="btn-primary"
        >
          Continue
          <svg className="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
