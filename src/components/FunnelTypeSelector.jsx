import { FUNNEL_TYPES } from '../lib/funnelConfigs'

export default function FunnelTypeSelector({ onSelect, selectedType }) {
  const funnelTypes = Object.values(FUNNEL_TYPES)

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Select Funnel Type</h2>
      <p className="text-gray-600">Choose the funnel type that matches your client's business model.</p>

      <div className="grid gap-4 md:grid-cols-3">
        {funnelTypes.map((funnel) => (
          <button
            key={funnel.id}
            onClick={() => onSelect(funnel.id)}
            className={`p-6 rounded-xl border-2 text-left transition-all hover:shadow-md ${
              selectedType === funnel.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{funnel.icon}</span>
              <h3 className="font-semibold text-gray-900">{funnel.name}</h3>
            </div>

            <p className="text-sm text-gray-600 mb-3 font-mono bg-gray-100 px-2 py-1 rounded">
              {funnel.description}
            </p>

            <p className="text-sm text-gray-500">{funnel.useCase}</p>

            {selectedType === funnel.id && (
              <div className="mt-4 flex items-center gap-2 text-blue-600 text-sm font-medium">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Selected
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
