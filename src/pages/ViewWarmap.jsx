import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getWarmap, deleteWarmap } from '../lib/supabase'
import { downloadPDF } from '../lib/pdfGenerator'
import WarmapPreview from '../components/WarmapPreview'

export default function ViewWarmap() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [warmap, setWarmap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
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

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const result = await downloadPDF(warmap)
      if (!result.success) {
        alert('Error generating PDF: ' + result.error)
      }
    } catch (err) {
      alert('Error generating PDF: ' + err.message)
    }
    setDownloading(false)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this warmap? This action cannot be undone.')) {
      return
    }

    const { error: deleteError } = await deleteWarmap(id)
    if (deleteError) {
      alert('Error deleting warmap: ' + deleteError.message)
    } else {
      navigate('/')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !warmap) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error ? 'Error Loading Warmap' : 'Warmap Not Found'}
          </h2>
          <p className="text-gray-600 mb-4">
            {error || "The warmap you're looking for doesn't exist."}
          </p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Back to Warmaps
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Warmaps
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="btn-primary inline-flex items-center gap-2"
          >
            {downloading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download PDF
              </>
            )}
          </button>

          <Link to={`/edit/${id}`} className="btn-secondary inline-flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit
          </Link>

          <button
            onClick={handleDelete}
            className="btn-danger inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete
          </button>
        </div>
      </div>

      {/* Warmap Preview */}
      <WarmapPreview data={warmap} />
    </div>
  )
}
