import { useState, useEffect } from 'react'
import { getDefaultsForFunnelType, FIELD_METADATA } from '../lib/funnelConfigs'

export default function DynamicFunnelForm({ funnelType, initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})

  useEffect(() => {
    // Initialize form with defaults for funnel type, merged with any initial data
    const defaults = getDefaultsForFunnelType(funnelType)
    setFormData({
      ...defaults,
      ...initialData,
      funnel_type: funnelType
    })
  }, [funnelType, initialData])

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))

    // Clear error when field changes
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Required fields validation
    const requiredFields = [
      'client_name',
      'business_name',
      'current_daily_spend',
      'target_daily_spend',
      'current_cpa_stage1',
      'cpa_stage1_kill_range',
      'high_ticket_price',
      'high_ticket_conversion_rate',
      'stage2_conversion_rate'
    ]

    // Add funnel-specific required fields
    if (funnelType === 'webinar_to_call') {
      requiredFields.push('stage3_conversion_rate', 'stage4_conversion_rate')
    } else if (funnelType === 'direct_call') {
      requiredFields.push('stage3_conversion_rate')
    }

    requiredFields.forEach((field) => {
      const value = formData[field]
      if (value === undefined || value === null || value === '') {
        newErrors[field] = 'This field is required'
      }
    })

    // Numeric validation
    const numericFields = [
      'current_daily_spend',
      'target_daily_spend',
      'current_cpa_stage1',
      'cpa_stage1_kill_range',
      'high_ticket_price',
      'high_ticket_conversion_rate',
      'stage2_conversion_rate',
      'stage3_conversion_rate',
      'stage4_conversion_rate'
    ]

    numericFields.forEach((field) => {
      if (formData[field] !== undefined && formData[field] !== '' && isNaN(Number(formData[field]))) {
        newErrors[field] = 'Must be a number'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (validateForm()) {
      // Convert numeric strings to numbers
      const processedData = { ...formData }
      Object.keys(processedData).forEach((key) => {
        const meta = FIELD_METADATA[key]
        if (meta?.type === 'number' && processedData[key] !== '') {
          processedData[key] = Number(processedData[key])
        }
      })

      onSubmit(processedData)
    }
  }

  const renderField = (field) => {
    const meta = FIELD_METADATA[field]
    if (!meta) return null

    // Check conditional visibility
    if (meta.conditional) {
      if (!formData[meta.conditional]) return null
    }

    const value = formData[field] ?? ''
    const error = errors[field]

    if (meta.type === 'checkbox') {
      return (
        <div key={field} className="flex items-center gap-3">
          <input
            type="checkbox"
            id={field}
            checked={!!formData[field]}
            onChange={(e) => handleChange(field, e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor={field} className="text-sm font-medium text-gray-700">
            {meta.label}
          </label>
        </div>
      )
    }

    return (
      <div key={field}>
        <label htmlFor={field} className="label">
          {meta.label}
          {meta.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type={meta.type === 'number' ? 'number' : 'text'}
          id={field}
          value={value}
          onChange={(e) => handleChange(field, e.target.value)}
          min={meta.min}
          max={meta.max}
          step={meta.type === 'number' ? 'any' : undefined}
          className={`input ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    )
  }

  const renderStage1Fields = () => (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-4">
        Stage 1: {formData.stage1_name || 'Entry Point'}
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        {renderField('stage1_is_paid')}
        {formData.stage1_is_paid && renderField('stage1_price')}
        {renderField('landing_page_conversion_rate')}
        {renderField('current_cpa_stage1')}
        {renderField('cpa_stage1_at_scale')}
        {renderField('cpa_stage1_kill_range')}
      </div>
    </div>
  )

  const renderStage2Fields = () => (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-4">
        Stage 2: {formData.stage2_name || 'Engagement'}
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        {funnelType === 'direct_call' && (
          <>
            {renderField('stage2_is_paid')}
            {formData.stage2_is_paid && renderField('stage2_price')}
          </>
        )}
        {renderField('stage2_conversion_rate')}
      </div>
    </div>
  )

  const renderStage3Fields = () => {
    if (!formData.stage3_enabled) return null

    return (
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">
          Stage 3: {formData.stage3_name || 'Qualification'}
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {funnelType === 'webinar_to_call' && (
            <>
              {renderField('stage3_is_paid')}
              {formData.stage3_is_paid && renderField('stage3_price')}
            </>
          )}
          {renderField('stage3_conversion_rate')}
        </div>
      </div>
    )
  }

  const renderStage4Fields = () => {
    if (!formData.stage4_enabled) return null

    return (
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">
          Stage 4: {formData.stage4_name || 'Call Attendance'}
        </h3>
        <div className="grid gap-4 md:grid-cols-2">{renderField('stage4_conversion_rate')}</div>
      </div>
    )
  }

  const renderHighTicketFields = () => (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-4">High Ticket Sale</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {renderField('high_ticket_price')}
        {renderField('high_ticket_conversion_rate')}
      </div>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client Info */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Client Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {renderField('client_name')}
          {renderField('business_name')}
        </div>
      </div>

      {/* Ad Spend */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Ad Spend</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {renderField('current_daily_spend')}
          {renderField('target_daily_spend')}
        </div>
      </div>

      {/* Funnel Stages */}
      {renderStage1Fields()}
      {renderStage2Fields()}
      {renderStage3Fields()}
      {renderStage4Fields()}
      {renderHighTicketFields()}

      {/* Campaign Structure */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Campaign Structure</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {renderField('layer1_creatives_count')}
          {renderField('layer2_creatives_count')}
          {renderField('layer2_cost_per_view')}
        </div>
      </div>

      {/* Scaling */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Scaling Parameters</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {renderField('scaling_increment_percent')}
          {renderField('scaling_frequency_days_min')}
          {renderField('scaling_frequency_days_max')}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Tech Stack</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {renderField('funnel_platform')}
          {renderField('tracking_tool')}
          {renderField('target_roi')}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-4">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        )}
        <button type="submit" className="btn-primary">
          Save Warmap
        </button>
      </div>
    </form>
  )
}
