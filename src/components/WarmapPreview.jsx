import { calculateFunnelMetrics, calculateScalingTimeline, formatIndianNumber, getStageNames, calculateRevenueBreakdown } from '../lib/calculations'
import { FUNNEL_TYPES } from '../lib/funnelConfigs'

export default function WarmapPreview({ data }) {
  if (!data) return null

  const metrics = calculateFunnelMetrics(data)
  const scaling = calculateScalingTimeline(
    data.current_daily_spend,
    data.target_daily_spend,
    data.scaling_increment_percent || 20,
    data.scaling_frequency_days_min || 3,
    data.scaling_frequency_days_max || 4
  )
  const stages = getStageNames(data.funnel_type, data)
  const revenueBreakdown = calculateRevenueBreakdown(data, metrics.volumes)
  const funnelInfo = FUNNEL_TYPES[data.funnel_type]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">META ADS WARMAP</h1>
          <p className="text-blue-100 mb-4">
            {data.strategy_subtitle || 'Deep Event Optimization + Educational Layer Strategy'}
          </p>
          <div className="text-xl font-semibold">{data.client_name}</div>
          <div className="text-blue-200">{data.business_name}</div>
          <div className="mt-4 inline-flex items-center gap-2 bg-blue-500/30 px-4 py-2 rounded-lg">
            <span>{funnelInfo?.icon}</span>
            <span>{funnelInfo?.name}</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="card text-center">
          <div className="text-sm text-gray-500 mb-1">Monthly Spend</div>
          <div className="text-xl font-bold text-gray-900">{formatIndianNumber(metrics.monthlyAdSpend)}</div>
        </div>
        <div className="card text-center">
          <div className="text-sm text-gray-500 mb-1">Monthly Revenue</div>
          <div className="text-xl font-bold text-green-600">{formatIndianNumber(metrics.totalRevenue)}</div>
        </div>
        <div className="card text-center">
          <div className="text-sm text-gray-500 mb-1">High Ticket Sales</div>
          <div className="text-xl font-bold text-blue-600">{metrics.highTicketSales}</div>
        </div>
        <div className="card text-center">
          <div className="text-sm text-gray-500 mb-1">ROI</div>
          <div className="text-xl font-bold text-purple-600">{metrics.roi.toFixed(2)}x</div>
        </div>
      </div>

      {/* Funnel Flow */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Funnel Flow</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {stages.map((stage, index) => (
            <span key={index} className="flex items-center">
              <span className={`px-3 py-1.5 rounded-lg ${
                stage.isPaid && stage.price > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {stage.name}
                {stage.isPaid && stage.price > 0 && (
                  <span className="ml-1 font-medium">(₹{stage.price})</span>
                )}
              </span>
              {index < stages.length - 1 && (
                <span className="mx-2 text-gray-400">→</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Unit Economics */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Unit Economics</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-3 font-medium text-gray-600">Metric</th>
                <th className="text-right p-3 font-medium text-gray-600">Current CPA</th>
                <th className="text-right p-3 font-medium text-gray-600">Kill Range CPA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="p-3 font-medium">Stage 1 CPA</td>
                <td className="p-3 text-right">{formatIndianNumber(data.current_cpa_stage1)}</td>
                <td className="p-3 text-right">{formatIndianNumber(data.cpa_stage1_kill_range)}</td>
              </tr>
              {metrics.cpasAtCurrentCPA.map((cpa, index) => (
                <tr key={index}>
                  <td className="p-3 font-medium">
                    Cost per {stages[index + 1]?.name?.split(' ')[0] || `Stage ${index + 2}`}
                  </td>
                  <td className="p-3 text-right">{formatIndianNumber(cpa)}</td>
                  <td className="p-3 text-right">{formatIndianNumber(metrics.cpasAtKillRange[index])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Volume Projections */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Volume Projections (Monthly at Kill Range)</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {stages.map((stage, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500">{stage.name}</div>
              <div className="text-xl font-bold text-gray-900">
                {Math.round(metrics.volumes[index] || 0).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Revenue Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-3 font-medium text-gray-600">Source</th>
                <th className="text-right p-3 font-medium text-gray-600">Volume</th>
                <th className="text-right p-3 font-medium text-gray-600">Price</th>
                <th className="text-right p-3 font-medium text-gray-600">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {revenueBreakdown.map((item, index) => (
                <tr key={index}>
                  <td className="p-3 font-medium">{item.stage}</td>
                  <td className="p-3 text-right">{item.volume.toLocaleString()}</td>
                  <td className="p-3 text-right">{formatIndianNumber(item.price)}</td>
                  <td className="p-3 text-right font-medium text-green-600">{formatIndianNumber(item.revenue)}</td>
                </tr>
              ))}
              <tr className="bg-green-50 font-semibold">
                <td className="p-3" colSpan={3}>Total Revenue</td>
                <td className="p-3 text-right text-green-700">{formatIndianNumber(metrics.totalRevenue)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Scaling Timeline */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Scaling Timeline</h2>
        <p className="text-gray-600 text-sm mb-4">
          Scaling from {formatIndianNumber(data.current_daily_spend)}/day to {formatIndianNumber(data.target_daily_spend)}/day
          with {data.scaling_increment_percent || 20}% increments every {data.scaling_frequency_days_min || 3}-{data.scaling_frequency_days_max || 4} days.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-3 font-medium text-gray-600">Step</th>
                <th className="text-right p-3 font-medium text-gray-600">Daily Budget</th>
                <th className="text-right p-3 font-medium text-gray-600">Days (Min-Max)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {scaling.steps.slice(0, 10).map((step, index) => (
                <tr key={index} className={step.isTarget ? 'bg-blue-50' : ''}>
                  <td className="p-3 font-medium">
                    {step.isStart ? 'Start' : step.isTarget ? 'Target' : `Step ${step.step}`}
                    {step.isTarget && (
                      <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded">Goal</span>
                    )}
                  </td>
                  <td className="p-3 text-right">{formatIndianNumber(step.budget)}</td>
                  <td className="p-3 text-right">{step.daysMin} - {step.daysMax}</td>
                </tr>
              ))}
              {scaling.steps.length > 10 && (
                <tr>
                  <td colSpan={3} className="p-3 text-center text-gray-500">
                    ... and {scaling.steps.length - 10} more steps
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-700">
            <strong>Total Steps:</strong> {scaling.totalSteps} |{' '}
            <strong>Estimated Duration:</strong> {scaling.totalDaysMin}-{scaling.totalDaysMax} days
          </div>
        </div>
      </div>

      {/* Campaign Structure */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Campaign Structure</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Layer 1: Conversion Campaign</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Objective</span>
                <span className="font-medium">{data.layer1_objective || 'Conversions'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Creatives</span>
                <span className="font-medium">{data.layer1_creatives_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Optimization Event</span>
                <span className="font-medium">{data.layer1_optimization_event || 'Deep Event'}</span>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Layer 2: Educational Campaign</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Objective</span>
                <span className="font-medium">{data.layer2_objective || 'ThruPlay'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Creatives</span>
                <span className="font-medium">{data.layer2_creatives_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cost Per View</span>
                <span className="font-medium">₹{data.layer2_cost_per_view || 0.5}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Tech Stack</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Funnel Platform</span>
            <span className="font-medium">{data.funnel_platform}</span>
          </div>
          <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Tracking Tool</span>
            <span className="font-medium">{data.tracking_tool}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
