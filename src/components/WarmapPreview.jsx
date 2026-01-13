import { calculateFunnelMetrics, calculateScalingTimeline, formatIndianNumber, getStageNames, calculateRevenueBreakdown } from '../lib/calculations'
import { FUNNEL_TYPES } from '../lib/funnelConfigs'

// Helper to format lakhs
function formatLakhs(amount) {
  const lakhs = amount / 100000
  if (lakhs >= 1) {
    return `₹${lakhs.toFixed(0)} Lakhs`
  }
  return formatIndianNumber(amount)
}

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

  // Build event tracking data
  const eventTracking = [
    {
      event: `FB ${stages[0]?.name || 'Registration'}`,
      currentStatus: 'ROOT Tracked',
      currentTracked: true,
      newStatus: 'ROOT Tracked',
      newTracked: true
    },
    {
      event: stages[1]?.name || 'Attendance',
      currentStatus: 'NOT Tracked',
      currentTracked: false,
      newStatus: 'TRACKED',
      newTracked: true
    }
  ]

  if (data.stage3_enabled) {
    const stage3Label = data.stage3_is_paid ? `₹${data.stage3_price} ${data.stage3_name}` : data.stage3_name
    eventTracking.push({
      event: stage3Label,
      currentStatus: 'ROOT Tracked',
      currentTracked: true,
      newStatus: 'TRACKED + OPTIMIZED',
      newTracked: true
    })
  }

  if (data.stage4_enabled) {
    eventTracking.push({
      event: data.stage4_name || 'Call Attended',
      currentStatus: 'NOT Tracked',
      currentTracked: false,
      newStatus: 'TRACKED',
      newTracked: true
    })
  }

  eventTracking.push({
    event: `₹${data.high_ticket_price?.toLocaleString()} High Ticket`,
    currentStatus: 'NOT Tracked',
    currentTracked: false,
    newStatus: 'TRACKED',
    newTracked: true
  })

  const optimizationEvent = data.stage3_enabled && data.stage3_is_paid
    ? `${data.stage3_name} (₹${data.stage3_price})`
    : data.stage1_is_paid
    ? `${data.stage1_name} (₹${data.stage1_price})`
    : data.stage1_name

  const monthlySpend = data.target_daily_spend * 30
  const registrations = Math.round(monthlySpend / data.cpa_stage1_kill_range)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">META ADS PLAN</h1>
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

      {/* Section 1: Current State Analysis */}
      <div className="card">
        <h2 className="text-lg font-bold text-blue-800 bg-blue-100 px-4 py-2 -mx-6 -mt-6 mb-4">
          1. CURRENT STATE ANALYSIS
        </h2>

        {/* Funnel Flow */}
        <h3 className="font-semibold text-gray-900 mb-3">Current Funnel Flow & Unit Economics</h3>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border border-gray-200">
            <thead>
              <tr className="bg-blue-800 text-white">
                <th className="text-left p-3 font-medium">STAGE</th>
                <th className="text-center p-3 font-medium">PRICE</th>
                <th className="text-center p-3 font-medium">CONV %</th>
                <th className="text-center p-3 font-medium">VOLUME</th>
                <th className="text-center p-3 font-medium">CPA NOW</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stages.map((stage, index) => {
                let convRate = ''
                let volume = Math.round(metrics.volumes[index] || 0)
                let cpa = ''

                if (index === 0) {
                  convRate = `${data.landing_page_conversion_rate || 7}% from LP`
                  cpa = formatIndianNumber(data.current_cpa_stage1)
                } else if (index === 1) {
                  convRate = `${data.stage2_conversion_rate}% of reg`
                  cpa = formatIndianNumber(metrics.cpasAtCurrentCPA[0] || 0)
                } else if (index === 2 && data.stage3_enabled) {
                  convRate = `${data.stage3_conversion_rate}%`
                  cpa = formatIndianNumber(metrics.cpasAtCurrentCPA[1] || 0)
                } else if (index === 3 && data.stage4_enabled) {
                  convRate = `${data.stage4_conversion_rate}%`
                  cpa = formatIndianNumber(metrics.cpasAtCurrentCPA[2] || 0)
                } else {
                  convRate = `${data.high_ticket_conversion_rate}%`
                  cpa = formatIndianNumber(metrics.costPerCustomer_current)
                }

                const priceDisplay = stage.isPaid && stage.price > 0 ? `₹${stage.price}` : 'Free'

                return (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="p-3 font-medium">{stage.name}</td>
                    <td className="p-3 text-center">{priceDisplay}</td>
                    <td className="p-3 text-center">{convRate}</td>
                    <td className="p-3 text-center">{volume}</td>
                    <td className="p-3 text-center">{cpa}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Calculation Breakdown */}
        <h3 className="font-semibold text-gray-900 mb-2">CALCULATION BREAKDOWN</h3>
        <div className="bg-gray-50 p-4 rounded-lg mb-6 text-sm">
          <p>Cost/{stages[0]?.name || 'Registration'}: <span className="font-semibold">₹{data.current_cpa_stage1}</span> (current) → <span className="font-semibold text-blue-600">₹{data.cpa_stage1_kill_range}</span> (kill range)</p>
          <p className="mt-1">Kill Range: CPR = {formatIndianNumber(data.cpa_stage1_kill_range)} (Cost per {stages[0]?.name || 'Registration'} where lifetime customer value {'>'} CPA)</p>
        </div>

        {/* Current Problems */}
        <h3 className="font-semibold text-red-600 mb-2">Current Problems</h3>
        <ul className="space-y-1 text-sm text-gray-700 mb-4">
          <li className="flex items-start gap-2">
            <span className="text-red-500">•</span>
            Meta ONLY optimizing for FB {stages[0]?.name?.toLowerCase() || 'registrations'}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500">•</span>
            Low quality leads – people who register for FREE / ultra-low-cost (₹{data.stage1_price || 0}) / who converted to ₹{data.stage1_price || 0}k
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500">•</span>
            Algorithm not tuned to high-value actions
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500">•</span>
            Scale attempts fail – costs spike, quality drops
          </li>
        </ul>
      </div>

      {/* Section 2: The Strategy */}
      <div className="card">
        <h2 className="text-lg font-bold text-blue-800 bg-blue-100 px-4 py-2 -mx-6 -mt-6 mb-4">
          2. THE STRATEGY - PHASE 1
        </h2>

        {/* 2-Layer Campaign Architecture */}
        <h3 className="font-semibold text-gray-900 mb-3">2-LAYER CAMPAIGN ARCHITECTURE</h3>
        <div className="space-y-2 mb-6">
          <p className="text-sm">
            <span className="font-semibold text-blue-700">Layer 1:</span> {stages[0]?.name || 'Registration'} Ads (Conversion Optimized)
          </p>
          <p className="text-sm">
            <span className="font-semibold text-blue-500">Layer 2:</span> Educational Brand Lift Ads (ThruPlay)
          </p>
          <p className="text-sm">
            <span className="font-semibold text-green-600">+ Deep Event Optimization via {data.tracking_tool || 'ZinoTrack'}</span>
          </p>
        </div>

        {/* Event Tracking Table */}
        <h3 className="font-semibold text-gray-900 mb-3">Step 1: Deep Event Optimization</h3>
        <p className="text-sm text-gray-600 mb-3">You're targeting an event on HIGH VALUE buyers, not just registrations:</p>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border border-gray-200">
            <thead>
              <tr className="bg-blue-800 text-white">
                <th className="text-left p-3 font-medium">EVENT</th>
                <th className="text-center p-3 font-medium">CURRENT STATUS</th>
                <th className="text-center p-3 font-medium">NEW STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {eventTracking.map((row, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="p-3 font-medium">{row.event}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      row.currentTracked ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {row.currentStatus}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      row.newTracked ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {row.newStatus} {row.newTracked && '✓'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Key Insight */}
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
          <p className="font-semibold text-amber-800">KEY INSIGHT:</p>
          <p className="text-sm text-amber-700">
            Optimize for {optimizationEvent} event as primary of FB {stages[0]?.name?.toLowerCase() || 'registration'}.
            The audience Meta finds with deep tracking is 85%+ more qualified than cold ₹{data.stage1_price || 0} opt-ins!
          </p>
        </div>

        {/* Layer 2 Details */}
        <h3 className="font-semibold text-gray-900 mb-3">Step 2: Educational Relief BAM Ads (Layer 2)</h3>
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="bg-gray-50 p-3 rounded">
            <span className="text-gray-600">Format:</span>
            <span className="font-medium ml-2">15-30 second videos (1 min max)</span>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <span className="text-gray-600">Objective:</span>
            <span className="font-medium ml-2">ThruPlay (Video Views)</span>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <span className="text-gray-600">Est. Cost Per View:</span>
            <span className="font-medium ml-2">~₹{data.layer2_cost_per_view || 0.30} (in post)</span>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <span className="text-gray-600">Purpose:</span>
            <span className="font-medium ml-2">Build authority; warm the audience</span>
          </div>
        </div>

        {/* Layer 2 Targeting Logic */}
        <h3 className="font-semibold text-gray-900 mb-2">Layer 2 Targeting Logic</h3>
        <ul className="space-y-1 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            Audience Size: Fresh/Warm (Ads Retgt)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            Lookalike on webinar / course / call page
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            Past {formatIndianNumber(100000)} already Converted – look alike
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            Flat TOF/A roll
          </li>
        </ul>
      </div>

      {/* Section 3: Campaign Structure */}
      <div className="card">
        <h2 className="text-lg font-bold text-blue-800 bg-blue-100 px-4 py-2 -mx-6 -mt-6 mb-4">
          3. CAMPAIGN STRUCTURE
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Layer 1: Conversion Campaign</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Objective</span>
                <span className="font-medium">Conversions</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Creatives</span>
                <span className="font-medium">{data.layer1_creatives_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Optimization Event</span>
                <span className="font-medium">{data.layer1_optimization_event || optimizationEvent}</span>
              </div>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Layer 2: Educational Campaign</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Objective</span>
                <span className="font-medium">{data.layer2_objective || 'ThruPlay (Video Views)'}</span>
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

      {/* Section 4: Funnel Flow Visualization */}
      <div className="card">
        <h2 className="text-lg font-bold text-blue-800 bg-blue-100 px-4 py-2 -mx-6 -mt-6 mb-4">
          4. FUNNEL FLOW VISUALIZATION
        </h2>
        <div className="flex flex-col items-center gap-2">
          <div className="bg-gray-800 text-white px-6 py-2 rounded-lg text-sm font-medium">
            COLD AUDIENCE
          </div>
          <div className="text-gray-400 text-xs">Sees Layer 1 Ads ({data.layer1_creatives_count} creatives)</div>
          <div className="text-blue-500 text-xl">↓</div>

          {stages.map((stage, index) => {
            const priceText = stage.isPaid && stage.price > 0 ? ` → ₹${stage.price}` : ''
            let convText = ''
            if (index === 1) convText = ` → ${data.stage2_conversion_rate}%`
            else if (index === 2 && data.stage3_enabled) convText = ` → ${data.stage3_conversion_rate}%`
            else if (index === 3 && data.stage4_enabled) convText = ` → ${data.stage4_conversion_rate}%`
            else if (index === stages.length - 1) convText = ` → ${data.high_ticket_conversion_rate}%`

            const isLast = index === stages.length - 1
            const bgColor = isLast ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'

            return (
              <div key={index} className="flex flex-col items-center gap-2">
                <div className={`px-6 py-2 rounded-lg text-sm font-medium ${bgColor}`}>
                  {stage.name.toUpperCase()}{priceText}{convText}
                </div>
                {index === 0 && (
                  <>
                    <div className="text-xs text-gray-500 italic">(Layer 2 Edu Ads Start)</div>
                  </>
                )}
                {index < stages.length - 1 && <div className="text-blue-500 text-xl">↓</div>}
              </div>
            )
          })}

          <div className="text-xs text-gray-500 mt-2 italic">
            {data.high_ticket_conversion_rate}% of calls converts = Current State
          </div>
        </div>
      </div>

      {/* Section 5: Numbers & Projections */}
      <div className="card">
        <h2 className="text-lg font-bold text-blue-800 bg-blue-100 px-4 py-2 -mx-6 -mt-6 mb-4">
          5. NUMBERS & PROJECTIONS
        </h2>

        {/* Current vs Target */}
        <h3 className="font-semibold text-gray-900 mb-3">Current vs Target Metrics</h3>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border border-gray-200">
            <thead>
              <tr className="bg-blue-800 text-white">
                <th className="text-left p-3 font-medium">METRIC</th>
                <th className="text-center p-3 font-medium">NOW</th>
                <th className="text-center p-3 font-medium">TARGET</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="bg-gray-50">
                <td className="p-3 font-medium">Daily Ad Spend</td>
                <td className="p-3 text-center">{formatIndianNumber(data.current_daily_spend)}</td>
                <td className="p-3 text-center font-semibold text-blue-600">{formatIndianNumber(data.target_daily_spend)}</td>
              </tr>
              <tr>
                <td className="p-3 font-medium">Cost Per Registration</td>
                <td className="p-3 text-center">{formatIndianNumber(data.current_cpa_stage1)}</td>
                <td className="p-3 text-center">{formatIndianNumber(data.cpa_stage1_kill_range)} (Kill Max)</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-3 font-medium">Monthly Revenue</td>
                <td className="p-3 text-center">-</td>
                <td className="p-3 text-center font-semibold text-green-600">{formatLakhs(metrics.totalRevenue)}</td>
              </tr>
              <tr>
                <td className="p-3 font-medium">ROI Target</td>
                <td className="p-3 text-center">-</td>
                <td className="p-3 text-center font-semibold text-purple-600">{data.target_roi || 2}x ROI</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Revenue Math - Stage by Stage Breakdown */}
        <h3 className="font-semibold text-green-600 mb-3">Revenue Math (at Kill Range CPA)</h3>

        {/* Stage-by-Stage Funnel Breakdown Table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border border-gray-200">
            <thead>
              <tr className="bg-green-700 text-white">
                <th className="text-left p-3 font-medium">STAGE</th>
                <th className="text-center p-3 font-medium">CALCULATION</th>
                <th className="text-center p-3 font-medium">VOLUME</th>
                <th className="text-center p-3 font-medium">COST/UNIT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* Ad Spend */}
              <tr className="bg-blue-50">
                <td className="p-3 font-semibold text-blue-700">
                  <span className="inline-block w-6 h-6 bg-blue-600 text-white text-xs rounded-full text-center leading-6 mr-2">1</span>
                  Monthly Ad Spend
                </td>
                <td className="p-3 text-center">
                  {formatIndianNumber(data.target_daily_spend)} × 30 days
                </td>
                <td className="p-3 text-center font-bold text-blue-600">
                  {formatIndianNumber(monthlySpend)}
                </td>
                <td className="p-3 text-center text-gray-500">—</td>
              </tr>

              {/* Registrations/Opt-ins */}
              <tr className="bg-gray-50">
                <td className="p-3 font-semibold text-gray-700">
                  <span className="inline-block w-6 h-6 bg-gray-600 text-white text-xs rounded-full text-center leading-6 mr-2">2</span>
                  {stages[0]?.name || 'Registrations'}
                </td>
                <td className="p-3 text-center">
                  {formatIndianNumber(monthlySpend)} ÷ {formatIndianNumber(data.cpa_stage1_kill_range)}
                </td>
                <td className="p-3 text-center font-bold text-blue-600">
                  {registrations.toLocaleString()}
                </td>
                <td className="p-3 text-center">
                  {formatIndianNumber(data.cpa_stage1_kill_range)}
                </td>
              </tr>

              {/* Stage 2 */}
              <tr>
                <td className="p-3 font-semibold text-gray-700">
                  <span className="inline-block w-6 h-6 bg-gray-600 text-white text-xs rounded-full text-center leading-6 mr-2">3</span>
                  {stages[1]?.name || 'Stage 2'}
                </td>
                <td className="p-3 text-center">
                  {registrations.toLocaleString()} × {data.stage2_conversion_rate}%
                </td>
                <td className="p-3 text-center font-bold text-blue-600">
                  {Math.round(metrics.volumes[1] || 0).toLocaleString()}
                </td>
                <td className="p-3 text-center">
                  {formatIndianNumber(Math.round(metrics.cpasAtCurrentCPA[0] || 0))}
                </td>
              </tr>

              {/* Stage 3 (if enabled) */}
              {data.stage3_enabled && (
                <tr className="bg-gray-50">
                  <td className="p-3 font-semibold text-gray-700">
                    <span className="inline-block w-6 h-6 bg-gray-600 text-white text-xs rounded-full text-center leading-6 mr-2">4</span>
                    {stages[2]?.name || 'Stage 3'}
                  </td>
                  <td className="p-3 text-center">
                    {Math.round(metrics.volumes[1] || 0).toLocaleString()} × {data.stage3_conversion_rate}%
                  </td>
                  <td className="p-3 text-center font-bold text-blue-600">
                    {Math.round(metrics.volumes[2] || 0).toLocaleString()}
                  </td>
                  <td className="p-3 text-center">
                    {formatIndianNumber(Math.round(metrics.cpasAtCurrentCPA[1] || 0))}
                  </td>
                </tr>
              )}

              {/* Stage 4 (if enabled) */}
              {data.stage4_enabled && (
                <tr className={data.stage3_enabled ? '' : 'bg-gray-50'}>
                  <td className="p-3 font-semibold text-gray-700">
                    <span className="inline-block w-6 h-6 bg-gray-600 text-white text-xs rounded-full text-center leading-6 mr-2">{data.stage3_enabled ? '5' : '4'}</span>
                    {stages[data.stage3_enabled ? 3 : 2]?.name || 'Stage 4'}
                  </td>
                  <td className="p-3 text-center">
                    {Math.round(metrics.volumes[data.stage3_enabled ? 2 : 1] || 0).toLocaleString()} × {data.stage4_conversion_rate}%
                  </td>
                  <td className="p-3 text-center font-bold text-blue-600">
                    {Math.round(metrics.volumes[data.stage3_enabled ? 3 : 2] || 0).toLocaleString()}
                  </td>
                  <td className="p-3 text-center">
                    {formatIndianNumber(Math.round(metrics.cpasAtCurrentCPA[data.stage3_enabled ? 2 : 1] || 0))}
                  </td>
                </tr>
              )}

              {/* High Ticket Closed */}
              <tr className="bg-green-50 border-t-2 border-green-500">
                <td className="p-3 font-bold text-green-700">
                  <span className="inline-block w-6 h-6 bg-green-600 text-white text-xs rounded-full text-center leading-6 mr-2">✓</span>
                  High Ticket Closed
                </td>
                <td className="p-3 text-center">
                  {(() => {
                    const lastStageIndex = stages.length - 2
                    const prevVolume = Math.round(metrics.volumes[lastStageIndex] || 0)
                    return `${prevVolume.toLocaleString()} × ${data.high_ticket_conversion_rate}%`
                  })()}
                </td>
                <td className="p-3 text-center font-bold text-green-600 text-lg">
                  ~{metrics.highTicketSales}
                </td>
                <td className="p-3 text-center font-semibold text-green-600">
                  {formatIndianNumber(Math.round(metrics.costPerCustomer_current || 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Summary Formula */}
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-semibold">Full Conversion Path:</span>
          </p>
          <p className="text-sm font-mono bg-white p-3 rounded border">
            {registrations.toLocaleString()} {stages[0]?.name || 'Registrations'}
            <span className="text-blue-500"> → </span>
            {data.stage2_conversion_rate}%
            <span className="text-blue-500"> → </span>
            {Math.round(metrics.volumes[1] || 0).toLocaleString()} {stages[1]?.name || 'Stage 2'}
            {data.stage3_enabled && (
              <>
                <span className="text-blue-500"> → </span>
                {data.stage3_conversion_rate}%
                <span className="text-blue-500"> → </span>
                {Math.round(metrics.volumes[2] || 0).toLocaleString()} {stages[2]?.name}
              </>
            )}
            {data.stage4_enabled && (
              <>
                <span className="text-blue-500"> → </span>
                {data.stage4_conversion_rate}%
                <span className="text-blue-500"> → </span>
                {Math.round(metrics.volumes[data.stage3_enabled ? 3 : 2] || 0).toLocaleString()} {stages[data.stage3_enabled ? 3 : 2]?.name}
              </>
            )}
            <span className="text-blue-500"> → </span>
            {data.high_ticket_conversion_rate}%
            <span className="text-blue-500"> → </span>
            <span className="text-green-600 font-bold">~{metrics.highTicketSales} High Ticket Sales</span>
          </p>
        </div>

        {/* Revenue Breakdown */}
        <h3 className="font-semibold text-gray-900 mb-3">Revenue Breakdown</h3>
        <div className="space-y-2 mb-4">
          {revenueBreakdown.map((item, index) => (
            <p key={index} className="text-sm">
              {item.stage}: {item.volume} × {formatIndianNumber(item.price)} = <span className="font-semibold text-green-600">{formatIndianNumber(item.revenue)}</span>
            </p>
          ))}
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <p className="text-lg font-bold text-green-700">
            Total Revenue = {formatLakhs(metrics.totalRevenue)} = {metrics.roi.toFixed(1)}x ROI
          </p>
        </div>
      </div>

      {/* Section 6: Scaling Timeline */}
      <div className="card">
        <h2 className="text-lg font-bold text-blue-800 bg-blue-100 px-4 py-2 -mx-6 -mt-6 mb-4">
          6. SCALING TIMELINE
        </h2>

        <div className="text-center mb-4">
          <span className="font-bold text-blue-600 text-lg">{formatIndianNumber(data.current_daily_spend)}/day</span>
          <span className="mx-2">→</span>
          <span className="font-bold text-green-600 text-lg">{formatIndianNumber(data.target_daily_spend)}/day</span>
        </div>
        <p className="text-center text-sm text-gray-600 mb-4">
          {data.scaling_increment_percent || 20}% budget increments every {data.scaling_frequency_days_min || 3}-{data.scaling_frequency_days_max || 4} days
        </p>

        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border border-gray-200">
            <thead>
              <tr className="bg-blue-800 text-white">
                <th className="text-left p-3 font-medium">ROUND</th>
                <th className="text-center p-3 font-medium">BUDGET</th>
                <th className="text-center p-3 font-medium">INCREMENT %</th>
                <th className="text-center p-3 font-medium">DAY MIN</th>
                <th className="text-center p-3 font-medium">DAY MAX</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {scaling.steps.slice(0, 10).map((step, index) => (
                <tr key={index} className={step.isTarget ? 'bg-blue-50' : index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="p-3 font-medium">
                    {index + 1}
                    {step.isTarget && <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded">Goal</span>}
                  </td>
                  <td className="p-3 text-center">{formatIndianNumber(step.budget)}</td>
                  <td className="p-3 text-center">{index === 0 ? '-' : `+${data.scaling_increment_percent || 20}%`}</td>
                  <td className="p-3 text-center">{step.daysMin}</td>
                  <td className="p-3 text-center">{step.daysMax}</td>
                </tr>
              ))}
              {scaling.steps.length > 10 && (
                <tr>
                  <td colSpan={5} className="p-3 text-center text-gray-500">
                    ... and {scaling.steps.length - 10} more steps
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Timeline Boxes */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-100 p-4 rounded-lg text-center">
            <div className="text-sm text-gray-600">MINIMUM TIMELINE</div>
            <div className="text-2xl font-bold text-blue-700">{scaling.totalDaysMin} Days</div>
          </div>
          <div className="bg-blue-100 p-4 rounded-lg text-center">
            <div className="text-sm text-gray-600">MAXIMUM TIMELINE</div>
            <div className="text-2xl font-bold text-blue-700">{scaling.totalDaysMax} Days</div>
          </div>
        </div>

        {/* Warning Note */}
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
          <p className="text-sm text-amber-700">
            <span className="font-semibold">Note:</span> If CPA spikes above ₹{data.cpa_stage1_kill_range.toLocaleString()} during any increment, pause scaling and optimize creatives before continuing.
          </p>
        </div>
      </div>

      {/* Section 7: Tech Stack & Implementation */}
      <div className="card">
        <h2 className="text-lg font-bold text-blue-800 bg-blue-100 px-4 py-2 -mx-6 -mt-6 mb-4">
          7. TECH STACK & IMPLEMENTATION
        </h2>

        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border border-gray-200">
            <thead>
              <tr className="bg-blue-800 text-white">
                <th className="text-left p-3 font-medium">COMPONENT</th>
                <th className="text-left p-3 font-medium">SOLUTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="bg-gray-50">
                <td className="p-3 font-medium">Funnel Platform</td>
                <td className="p-3">{data.funnel_platform || 'GoHighLevel (GHL)'} – Funnels with full session & attribution</td>
              </tr>
              <tr>
                <td className="p-3 font-medium">Tracking & Attribution</td>
                <td className="p-3">{data.tracking_tool || 'ZinoTrack'} – End-to-end server-side tracking via Meta</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-3 font-medium">Events Sent</td>
                <td className="p-3">Registration, Attendance, Video %, Book, Purchase, ROAS Tags</td>
              </tr>
              <tr>
                <td className="p-3 font-medium">CRM Integration</td>
                <td className="p-3">GHL → ZinoTrack → Meta CAPI (Server-Side)</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="p-3 font-medium">Repeat Buyers</td>
                <td className="p-3">Re-market via paid/organic sequences from GHL/Audience list</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* What We're Building */}
        <h3 className="font-semibold text-gray-900 mb-3">What We're Building</h3>
        <ol className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="font-semibold text-blue-600">1.</span>
            Complete GHL funnel with ad pages, forms, and automation
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-blue-600">2.</span>
            Full event tracking: {stages.map(s => s.name).join(', ')}, High Ticket
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-blue-600">3.</span>
            Layer 1 + Layer 2 campaign setup in Ads Manager
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-blue-600">4.</span>
            ZinoTrack integration for CAPI + attribution
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-blue-600">5.</span>
            Custom dashboard for ROI/ROAS monitoring
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-blue-600">6.</span>
            Scaling SOP document with benchmarks
          </li>
        </ol>
      </div>

      {/* Section 8: Summary */}
      <div className="card">
        <h2 className="text-lg font-bold text-blue-800 bg-blue-100 px-4 py-2 -mx-6 -mt-6 mb-4">
          8. SUMMARY
        </h2>

        {/* Problem vs Solution */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-semibold text-red-700 mb-3">THE PROBLEM</h3>
            <ul className="space-y-2 text-sm text-red-600">
              <li>• Meta only optimizing for FB regs</li>
              <li>• No tracking of high-value events</li>
              <li>• Algorithm attracts low-ticket buyers</li>
              <li>• Scaling = cost spikes</li>
            </ul>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-700 mb-3">THE SOLUTION</h3>
            <ul className="space-y-2 text-sm text-green-600">
              <li>• Deep event optimization (₹{data.stage3_price || data.stage1_price}+)</li>
              <li>• Full funnel tracking via {data.tracking_tool || 'ZinoTrack'}</li>
              <li>• Educational Layer 2 for warm traffic</li>
              <li>• Systematic scaling with benchmarks</li>
            </ul>
          </div>
        </div>

        {/* Key Numbers to Remember */}
        <div className="bg-blue-800 text-white p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-center mb-4">KEY NUMBERS TO REMEMBER</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-blue-700/50 p-3 rounded">
              <div>Layer 1 Creatives: <span className="font-semibold">{data.layer1_creatives_count}</span></div>
              <div>Layer 2 Creatives: <span className="font-semibold">{data.layer2_creatives_count}</span></div>
              <div>Current Budget: <span className="font-semibold">{formatIndianNumber(data.current_daily_spend)}/day</span></div>
            </div>
            <div className="bg-blue-700/50 p-3 rounded">
              <div>Goal Target: <span className="font-semibold text-green-300">{formatLakhs(metrics.totalRevenue)}/mo</span></div>
              <div>Scale Budget: <span className="font-semibold">{formatIndianNumber(data.target_daily_spend)}/day</span></div>
              <div>Timeline: <span className="font-semibold">{scaling.totalDaysMin}-{scaling.totalDaysMax} days</span></div>
            </div>
          </div>
        </div>

        {/* Closing */}
        <div className="text-center">
          <p className="text-xl font-bold text-blue-700 italic">Ready to scale profitably.</p>
        </div>
      </div>
    </div>
  )
}
