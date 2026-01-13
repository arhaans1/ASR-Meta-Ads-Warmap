import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getWarmaps, searchWarmaps, deleteWarmap } from '../lib/supabase'
import { formatIndianNumber, calculateFunnelMetrics } from '../lib/calculations'
import { FUNNEL_TYPES } from '../lib/funnelConfigs'
import SearchBar from '../components/SearchBar'

export default function Home() {
  const [warmaps, setWarmaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => {
    loadWarmaps()
  }, [])

  const loadWarmaps = async () => {
    setLoading(true)
    const { data, error } = await getWarmaps()
    if (error) {
      setError(error.message)
    } else {
      setWarmaps(data || [])
    }
    setLoading(false)
  }

  const handleSearch = async (query) => {
    if (!query.trim()) {
      loadWarmaps()
      return
    }

    setLoading(true)
    const { data, error } = await searchWarmaps(query)
    if (error) {
      setError(error.message)
    } else {
      setWarmaps(data || [])
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this warmap?')) return

    setDeleteId(id)
    const { error } = await deleteWarmap(id)
    if (error) {
      alert('Error deleting warmap: ' + error.message)
    } else {
      setWarmaps(warmaps.filter((w) => w.id !== id))
    }
    setDeleteId(null)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warmaps</h1>
          <p className="text-gray-600">Manage your Meta Ads warmaps for coaching clients</p>
        </div>
        <Link to="/create" className="btn-primary">
          + Create New Warmap
        </Link>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <SearchBar onSearch={handleSearch} placeholder="Search by client or business name..." />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
          <button onClick={loadWarmaps} className="ml-2 underline">
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && warmaps.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">🗺️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No warmaps yet</h3>
          <p className="text-gray-600 mb-4">Create your first warmap to get started</p>
          <Link to="/create" className="btn-primary inline-block">
            Create New Warmap
          </Link>
        </div>
      )}

      {/* Warmaps Table */}
      {!loading && warmaps.length > 0 && (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-600">Client</th>
                  <th className="text-left p-4 font-medium text-gray-600">Business</th>
                  <th className="text-left p-4 font-medium text-gray-600">Funnel Type</th>
                  <th className="text-right p-4 font-medium text-gray-600">Target Spend</th>
                  <th className="text-right p-4 font-medium text-gray-600">Projected ROI</th>
                  <th className="text-left p-4 font-medium text-gray-600">Created</th>
                  <th className="text-right p-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {warmaps.map((warmap) => {
                  const funnelInfo = FUNNEL_TYPES[warmap.funnel_type]
                  let metrics = null
                  try {
                    metrics = calculateFunnelMetrics(warmap)
                  } catch (e) {
                    // Ignore calculation errors
                  }

                  return (
                    <tr key={warmap.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <Link to={`/view/${warmap.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                          {warmap.client_name}
                        </Link>
                      </td>
                      <td className="p-4 text-gray-600">{warmap.business_name}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {funnelInfo?.icon} {funnelInfo?.name || warmap.funnel_type}
                        </span>
                      </td>
                      <td className="p-4 text-right text-gray-900">
                        {formatIndianNumber(warmap.target_daily_spend)}/day
                      </td>
                      <td className="p-4 text-right">
                        {metrics ? (
                          <span className="text-green-600 font-medium">{metrics.roi.toFixed(1)}x</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-4 text-gray-500 text-sm">{formatDate(warmap.created_at)}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/view/${warmap.id}`}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="View"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </Link>
                          <Link
                            to={`/edit/${warmap.id}`}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </Link>
                          <button
                            onClick={() => handleDelete(warmap.id)}
                            disabled={deleteId === warmap.id}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      {!loading && warmaps.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          Showing {warmaps.length} warmap{warmaps.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
