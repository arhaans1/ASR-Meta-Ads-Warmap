/**
 * Calculate funnel metrics based on warmap data
 * Works dynamically for all funnel types: webinar, webinar_to_call, direct_call
 */
export function calculateFunnelMetrics(data) {
  const {
    funnel_type,
    current_cpa_stage1,
    cpa_stage1_at_scale,
    cpa_stage1_kill_range,
    stage1_price = 0,
    stage2_conversion_rate,
    stage2_price = 0,
    stage3_enabled,
    stage3_conversion_rate,
    stage3_price = 0,
    stage4_enabled,
    stage4_conversion_rate,
    high_ticket_price,
    high_ticket_conversion_rate,
    target_daily_spend,
    current_daily_spend
  } = data

  // Build conversion chain based on funnel type
  const conversionChain = [stage2_conversion_rate / 100]

  if (stage3_enabled && stage3_conversion_rate) {
    conversionChain.push(stage3_conversion_rate / 100)
  }

  if (stage4_enabled && stage4_conversion_rate) {
    conversionChain.push(stage4_conversion_rate / 100)
  }

  conversionChain.push(high_ticket_conversion_rate / 100)

  // Calculate cumulative conversion rates
  const cumulativeRates = []
  let cumulative = 1
  for (const rate of conversionChain) {
    cumulative *= rate
    cumulativeRates.push(cumulative)
  }

  // Total conversion from stage 1 to final sale
  const totalConversion = cumulativeRates[cumulativeRates.length - 1]

  // Calculate CPAs at each stage (current, at scale, kill range)
  const cpasAtCurrentCPA = cumulativeRates.map(rate => current_cpa_stage1 / rate)
  const cpasAtScale = cpa_stage1_at_scale
    ? cumulativeRates.map(rate => cpa_stage1_at_scale / rate)
    : null
  const cpasAtKillRange = cumulativeRates.map(rate => cpa_stage1_kill_range / rate)

  // Cost per customer calculations
  const costPerCustomer_current = current_cpa_stage1 / totalConversion
  const costPerCustomer_atScale = cpa_stage1_at_scale ? cpa_stage1_at_scale / totalConversion : null
  const costPerCustomer_kill = cpa_stage1_kill_range / totalConversion

  // Revenue projections at kill range CPR
  const monthlyAdSpend = target_daily_spend * 30
  const stage1Volume = monthlyAdSpend / cpa_stage1_kill_range

  // Calculate volume at each stage
  const volumes = [stage1Volume]
  let currentVolume = stage1Volume
  for (const rate of conversionChain) {
    currentVolume *= rate
    volumes.push(currentVolume)
  }

  // High ticket sales (last volume)
  const highTicketSales = volumes[volumes.length - 1]

  // Calculate total revenue from all paid stages
  let totalRevenue = highTicketSales * high_ticket_price

  // Add revenue from paid stages
  if (stage1_price > 0) {
    totalRevenue += volumes[0] * stage1_price
  }
  if (stage2_price > 0) {
    totalRevenue += volumes[1] * stage2_price
  }
  if (stage3_enabled && stage3_price > 0) {
    totalRevenue += volumes[2] * stage3_price
  }

  // Calculate ROI
  const roi = totalRevenue / monthlyAdSpend

  // Calculate break-even CPR
  const breakEvenCPR = (high_ticket_price * totalConversion)

  return {
    // Conversion chain info
    conversionChain,
    cumulativeRates,
    totalConversion,

    // CPAs at different stages
    cpasAtCurrentCPA,
    cpasAtScale,
    cpasAtKillRange,

    // Cost per customer
    costPerCustomer_current,
    costPerCustomer_atScale,
    costPerCustomer_kill,

    // Volume projections
    volumes,
    highTicketSales: Math.round(highTicketSales),

    // Revenue
    totalRevenue,
    monthlyAdSpend,
    roi,

    // Break-even
    breakEvenCPR
  }
}

/**
 * Calculate scaling timeline from current to target spend
 */
export function calculateScalingTimeline(currentSpend, targetSpend, incrementPercent = 20, minDays = 3, maxDays = 4) {
  const steps = []
  let current = currentSpend
  let step = 0
  let totalDaysMin = 0
  let totalDaysMax = 0

  while (current < targetSpend) {
    steps.push({
      step,
      budget: Math.round(current),
      daysMin: totalDaysMin,
      daysMax: totalDaysMax,
      isStart: step === 0
    })

    current *= (1 + incrementPercent / 100)
    step++
    totalDaysMin += minDays
    totalDaysMax += maxDays
  }

  // Add final step at or above target
  steps.push({
    step,
    budget: Math.round(current),
    daysMin: totalDaysMin,
    daysMax: totalDaysMax,
    isTarget: true
  })

  return {
    steps,
    totalSteps: steps.length,
    totalDaysMin,
    totalDaysMax
  }
}

/**
 * Format currency in Indian Rupees
 */
export function formatCurrency(amount) {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} Lakhs`
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`
  }
  return `₹${Math.round(amount)}`
}

/**
 * Format number with Indian numbering system
 */
export function formatIndianNumber(num) {
  const formatted = Math.round(num).toString()
  let result = ''
  let count = 0

  for (let i = formatted.length - 1; i >= 0; i--) {
    count++
    result = formatted[i] + result
    if (count === 3 && i > 0) {
      result = ',' + result
    } else if (count > 3 && (count - 3) % 2 === 0 && i > 0) {
      result = ',' + result
    }
  }

  return '₹' + result
}

/**
 * Get stage names based on funnel type
 */
export function getStageNames(funnelType, data) {
  const stages = []

  switch (funnelType) {
    case 'webinar':
      stages.push({
        name: data.stage1_name || 'Webinar Registration',
        isPaid: data.stage1_is_paid,
        price: data.stage1_price
      })
      stages.push({
        name: data.stage2_name || 'Webinar Attendance',
        isPaid: false,
        price: 0
      })
      stages.push({
        name: 'High Ticket Sale',
        isPaid: true,
        price: data.high_ticket_price
      })
      break

    case 'webinar_to_call':
      stages.push({
        name: data.stage1_name || 'Webinar Registration',
        isPaid: data.stage1_is_paid,
        price: data.stage1_price
      })
      stages.push({
        name: data.stage2_name || 'Webinar Attendance',
        isPaid: false,
        price: 0
      })
      stages.push({
        name: data.stage3_name || '1-1 Call Booking',
        isPaid: data.stage3_is_paid,
        price: data.stage3_price
      })
      stages.push({
        name: data.stage4_name || 'Call Attendance',
        isPaid: false,
        price: 0
      })
      stages.push({
        name: 'High Ticket Sale',
        isPaid: true,
        price: data.high_ticket_price
      })
      break

    case 'direct_call':
      stages.push({
        name: data.stage1_name || 'Opt-In / Lead',
        isPaid: data.stage1_is_paid,
        price: data.stage1_price
      })
      stages.push({
        name: data.stage2_name || 'Call Booking',
        isPaid: data.stage2_is_paid,
        price: data.stage2_price
      })
      stages.push({
        name: data.stage3_name || 'Call Attendance',
        isPaid: false,
        price: 0
      })
      stages.push({
        name: 'High Ticket Sale',
        isPaid: true,
        price: data.high_ticket_price
      })
      break

    default:
      break
  }

  return stages
}

/**
 * Calculate detailed revenue breakdown
 */
export function calculateRevenueBreakdown(data, volumes) {
  const breakdown = []

  if (data.stage1_price > 0) {
    breakdown.push({
      stage: data.stage1_name || 'Stage 1',
      volume: Math.round(volumes[0]),
      price: data.stage1_price,
      revenue: Math.round(volumes[0] * data.stage1_price)
    })
  }

  if (data.stage2_price > 0) {
    breakdown.push({
      stage: data.stage2_name || 'Stage 2',
      volume: Math.round(volumes[1]),
      price: data.stage2_price,
      revenue: Math.round(volumes[1] * data.stage2_price)
    })
  }

  if (data.stage3_enabled && data.stage3_price > 0) {
    breakdown.push({
      stage: data.stage3_name || 'Stage 3',
      volume: Math.round(volumes[2]),
      price: data.stage3_price,
      revenue: Math.round(volumes[2] * data.stage3_price)
    })
  }

  const highTicketVolume = volumes[volumes.length - 1]
  breakdown.push({
    stage: 'High Ticket Sales',
    volume: Math.round(highTicketVolume),
    price: data.high_ticket_price,
    revenue: Math.round(highTicketVolume * data.high_ticket_price)
  })

  return breakdown
}
