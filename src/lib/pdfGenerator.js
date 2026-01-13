import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  calculateFunnelMetrics,
  calculateScalingTimeline,
  formatIndianNumber,
  getStageNames,
  calculateRevenueBreakdown
} from './calculations'

// Helper to format lakhs
function formatLakhs(amount) {
  const lakhs = amount / 100000
  if (lakhs >= 1) {
    return `₹${lakhs.toFixed(0)} Lakhs`
  }
  return formatIndianNumber(amount)
}

// Colors
const COLORS = {
  primary: [30, 58, 138], // Blue
  secondary: [59, 130, 246],
  success: [16, 185, 129],
  danger: [239, 68, 68],
  warning: [245, 158, 11],
  dark: [31, 41, 55],
  light: [243, 244, 246],
  white: [255, 255, 255]
}

/**
 * Generate and download PDF warmap
 */
export async function downloadPDF(data) {
  try {
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    let y = margin

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

    // Helper functions
    const checkPageBreak = (neededHeight) => {
      if (y + neededHeight > pageHeight - margin) {
        doc.addPage()
        y = margin
        return true
      }
      return false
    }

    const addSectionHeader = (number, title) => {
      checkPageBreak(15)
      doc.setFillColor(...COLORS.light)
      doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(...COLORS.primary)
      doc.text(`${number}. ${title.toUpperCase()}`, margin + 3, y + 7)
      y += 15
    }

    const addSubheading = (text, color = COLORS.dark) => {
      checkPageBreak(10)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(...color)
      doc.text(text, margin, y)
      y += 7
    }

    const addParagraph = (text, fontSize = 10) => {
      checkPageBreak(10)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(fontSize)
      doc.setTextColor(...COLORS.dark)
      const lines = doc.splitTextToSize(text, pageWidth - 2 * margin)
      doc.text(lines, margin, y)
      y += lines.length * 5 + 3
    }

    const addBulletPoint = (text, color = COLORS.dark) => {
      checkPageBreak(8)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(...color)
      const lines = doc.splitTextToSize(text, pageWidth - 2 * margin - 10)
      doc.text('•', margin + 3, y)
      doc.text(lines, margin + 8, y)
      y += lines.length * 5 + 2
    }

    // ============================================
    // TITLE PAGE
    // ============================================
    doc.setFillColor(...COLORS.primary)
    doc.rect(0, 0, pageWidth, 60, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(24)
    doc.setTextColor(...COLORS.white)
    doc.text('META ADS PLAN', pageWidth / 2, 25, { align: 'center' })

    doc.setFont('helvetica', 'italic')
    doc.setFontSize(12)
    doc.text(data.strategy_subtitle || 'Deep Event Optimization + Educational Layer Strategy', pageWidth / 2, 35, { align: 'center' })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text(`${data.client_name}'s ${data.business_name}`, pageWidth / 2, 50, { align: 'center' })

    y = 75

    // Key metrics boxes
    const boxWidth = (pageWidth - 3 * margin) / 2

    doc.setFillColor(...COLORS.light)
    doc.rect(margin, y, boxWidth, 25, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.dark)
    doc.text('Current Spend', margin + boxWidth / 2, y + 8, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...COLORS.primary)
    doc.text(`${formatIndianNumber(data.current_daily_spend)}/day`, margin + boxWidth / 2, y + 18, { align: 'center' })

    doc.setFillColor(...COLORS.light)
    doc.rect(margin + boxWidth + margin / 2, y, boxWidth, 25, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.dark)
    doc.text('Target Spend', margin + boxWidth + margin / 2 + boxWidth / 2, y + 8, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...COLORS.primary)
    doc.text(`${formatIndianNumber(data.target_daily_spend)}/day`, margin + boxWidth + margin / 2 + boxWidth / 2, y + 18, { align: 'center' })

    y += 35

    // Revenue target
    doc.setFillColor(209, 250, 229) // Green light
    doc.rect(margin, y, pageWidth - 2 * margin, 12, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...COLORS.success)
    doc.text(`Revenue Target: ${formatLakhs(metrics.totalRevenue)}/Month`, pageWidth / 2, y + 8, { align: 'center' })

    y += 25

    // ============================================
    // SECTION 1: CURRENT STATE ANALYSIS
    // ============================================
    addSectionHeader(1, 'Current State Analysis')

    addSubheading('Current Funnel Flow & Unit Economics')

    // Funnel flow table
    const funnelFlowData = stages.map((stage, index) => {
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
      return [stage.name, priceDisplay, convRate, volume.toString(), cpa]
    })

    autoTable(doc, {
      startY: y,
      head: [['STAGE', 'PRICE', 'CONV %', 'VOLUME', 'CPA NOW']],
      body: funnelFlowData,
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin }
    })

    y = doc.lastAutoTable.finalY + 10

    addSubheading('CALCULATION BREAKDOWN')
    addParagraph(`Cost/${stages[0]?.name || 'Registration'}: ₹${data.current_cpa_stage1} (current) → ₹${data.cpa_stage1_kill_range} (kill range)`)
    addParagraph(`Kill Range: CPR = ${formatIndianNumber(data.cpa_stage1_kill_range)} (Cost per ${stages[0]?.name || 'Registration'} where lifetime customer value > CPA)`)

    y += 5
    addSubheading('Current Problems', COLORS.danger)
    addBulletPoint(`Meta ONLY optimizing for FB ${stages[0]?.name?.toLowerCase() || 'registrations'}`, COLORS.danger)
    addBulletPoint(`Low quality leads – people who register for FREE / ultra-low-cost (₹${data.stage1_price || 0})`, COLORS.danger)
    addBulletPoint('Algorithm not tuned to high-value actions', COLORS.danger)
    addBulletPoint('Scale attempts fail – costs spike, quality drops', COLORS.danger)

    // ============================================
    // SECTION 2: THE STRATEGY
    // ============================================
    doc.addPage()
    y = margin

    addSectionHeader(2, 'The Strategy - Phase 1')

    addSubheading('2-LAYER CAMPAIGN ARCHITECTURE')
    addParagraph(`Layer 1: ${stages[0]?.name || 'Registration'} Ads (Conversion Optimized)`)
    addParagraph('Layer 2: Educational Brand Lift Ads (ThruPlay)')
    addParagraph(`+ Deep Event Optimization via ${data.tracking_tool || 'ZinoTrack'}`)

    y += 5
    addSubheading('Step 1: Deep Event Optimization')
    addParagraph("You're targeting an event on HIGH VALUE buyers, not just registrations:")

    // Event tracking table
    const eventRows = [
      [`FB ${stages[0]?.name || 'Registration'}`, 'ROOT Tracked', 'ROOT Tracked ✓'],
      [stages[1]?.name || 'Attendance', 'NOT Tracked', 'TRACKED ✓']
    ]

    if (data.stage3_enabled) {
      const stage3Label = data.stage3_is_paid ? `₹${data.stage3_price} ${data.stage3_name}` : data.stage3_name
      eventRows.push([stage3Label, 'ROOT Tracked', 'TRACKED + OPTIMIZED ✓'])
    }

    if (data.stage4_enabled) {
      eventRows.push([data.stage4_name || 'Call Attended', 'NOT Tracked', 'TRACKED ✓'])
    }

    eventRows.push([`₹${data.high_ticket_price?.toLocaleString()} High Ticket`, 'NOT Tracked', 'TRACKED ✓'])

    autoTable(doc, {
      startY: y,
      head: [['EVENT', 'CURRENT STATUS', 'NEW STATUS']],
      body: eventRows,
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin }
    })

    y = doc.lastAutoTable.finalY + 10

    // Key insight box
    const optimizationEvent = data.stage3_enabled && data.stage3_is_paid
      ? `${data.stage3_name} (₹${data.stage3_price})`
      : data.stage1_is_paid
      ? `${data.stage1_name} (₹${data.stage1_price})`
      : data.stage1_name

    doc.setFillColor(254, 243, 199) // Amber light
    doc.rect(margin, y, pageWidth - 2 * margin, 20, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.warning)
    doc.text('KEY INSIGHT:', margin + 3, y + 6)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.dark)
    const insightText = `Optimize for ${optimizationEvent} event as primary. The audience Meta finds with deep tracking is 85%+ more qualified than cold ₹${data.stage1_price || 0} opt-ins!`
    const insightLines = doc.splitTextToSize(insightText, pageWidth - 2 * margin - 6)
    doc.text(insightLines, margin + 3, y + 13)
    y += 25

    addSubheading('Step 2: Educational Relief BAM Ads (Layer 2)')
    autoTable(doc, {
      startY: y,
      head: [['Parameter', 'Value']],
      body: [
        ['Format', '15-30 second videos (1 min max)'],
        ['Objective', 'ThruPlay (Video Views)'],
        ['Est. Cost Per View', `~₹${data.layer2_cost_per_view || 0.30} (in post)`],
        ['Purpose', 'Build authority with beliefs; warm the audience']
      ],
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin }
    })

    y = doc.lastAutoTable.finalY + 10

    addSubheading('Layer 2 Targeting Logic')
    addBulletPoint('Audience Size: Fresh/Warm (Ads Retgt)')
    addBulletPoint('Lookalike on webinar / course / call page')
    addBulletPoint(`Past ${formatIndianNumber(100000)} already Converted – look alike`)
    addBulletPoint('Flat TOF/A roll')

    // ============================================
    // SECTION 3: CAMPAIGN STRUCTURE
    // ============================================
    doc.addPage()
    y = margin

    addSectionHeader(3, 'Campaign Structure')

    addSubheading('Layer 1: Conversion Campaign')
    autoTable(doc, {
      startY: y,
      head: [['Parameter', 'Value']],
      body: [
        ['Objective', `Conversions (optimized for ₹${data.stage3_is_paid ? data.stage3_price : data.stage1_price} purchases)`],
        ['Number of Creatives', `${data.layer1_creatives_count} static/video ads`],
        ['Target Daily Budget', `${formatIndianNumber(data.current_daily_spend)}/day`],
        ['Target CPA', 'On or Below Ad Spend Based on LTV']
      ],
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin }
    })

    y = doc.lastAutoTable.finalY + 10

    addSubheading('Layer 2: Educational Ads Campaign')
    autoTable(doc, {
      startY: y,
      head: [['Parameter', 'Value']],
      body: [
        ['Objective', data.layer2_objective || 'ThruPlay (Video Views)'],
        ['Number of Creatives', `${data.layer2_creatives_count} (short videos) (+mix)`],
        ['Cost Per View', `~₹${data.layer2_cost_per_view || 0.30} (in post)`],
        ['Audience', 'Warm (cold is an option – ROAS to guide)']
      ],
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin }
    })

    y = doc.lastAutoTable.finalY + 15

    // ============================================
    // SECTION 4: FUNNEL FLOW VISUALIZATION
    // ============================================
    addSectionHeader(4, 'Funnel Flow Visualization')

    // Simple text-based funnel flow
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.dark)
    doc.text('COLD AUDIENCE', pageWidth / 2, y, { align: 'center' })
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(`Sees Layer 1 Ads (${data.layer1_creatives_count} creatives)`, pageWidth / 2, y, { align: 'center' })
    y += 5
    doc.setFontSize(12)
    doc.setTextColor(...COLORS.secondary)
    doc.text('↓', pageWidth / 2, y, { align: 'center' })
    y += 5

    stages.forEach((stage, index) => {
      const priceText = stage.isPaid && stage.price > 0 ? ` → ₹${stage.price}` : ''
      let convText = ''
      if (index === 1) convText = ` → ${data.stage2_conversion_rate}%`
      else if (index === 2 && data.stage3_enabled) convText = ` → ${data.stage3_conversion_rate}%`
      else if (index === 3 && data.stage4_enabled) convText = ` → ${data.stage4_conversion_rate}%`
      else if (index === stages.length - 1) convText = ` → ${data.high_ticket_conversion_rate}%`

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...(index === stages.length - 1 ? COLORS.success : COLORS.primary))
      doc.text(`${stage.name.toUpperCase()}${priceText}${convText}`, pageWidth / 2, y, { align: 'center' })
      y += 7

      if (index < stages.length - 1) {
        doc.setTextColor(...COLORS.secondary)
        doc.text('↓', pageWidth / 2, y, { align: 'center' })
        y += 5
      }
    })

    y += 10

    // ============================================
    // SECTION 5: NUMBERS & PROJECTIONS
    // ============================================
    checkPageBreak(80)
    addSectionHeader(5, 'Numbers & Projections')

    addSubheading('Current vs Target Metrics')

    const monthlySpend = data.target_daily_spend * 30
    const registrations = Math.round(monthlySpend / data.cpa_stage1_kill_range)

    autoTable(doc, {
      startY: y,
      head: [['METRIC', 'NOW', 'TARGET']],
      body: [
        ['Daily Ad Spend', formatIndianNumber(data.current_daily_spend), formatIndianNumber(data.target_daily_spend)],
        ['Cost Per Registration', formatIndianNumber(data.current_cpa_stage1), `${formatIndianNumber(data.cpa_stage1_kill_range)} (Kill Max)`],
        ['Monthly Revenue', '-', formatLakhs(metrics.totalRevenue)],
        ['ROI Target', '-', `${data.target_roi || 2}x ROI`]
      ],
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin }
    })

    y = doc.lastAutoTable.finalY + 10

    addSubheading('Revenue Math (at Kill Range CPA)', COLORS.success)
    addParagraph(`Monthly Ad Spend: ${formatIndianNumber(data.target_daily_spend)} × 30 = ${formatIndianNumber(monthlySpend)}`)
    addParagraph(`Registrations: ${formatIndianNumber(monthlySpend)} / ${formatIndianNumber(data.cpa_stage1_kill_range)} = ${registrations}`)
    addParagraph(`High Ticket Sales: ${registrations} × ${data.stage2_conversion_rate}%${data.stage3_enabled ? ` × ${data.stage3_conversion_rate}%` : ''}${data.stage4_enabled ? ` × ${data.stage4_conversion_rate}%` : ''} × ${data.high_ticket_conversion_rate}% = ~${metrics.highTicketSales}`)

    y += 5
    addSubheading('Revenue Breakdown')
    revenueBreakdown.forEach(item => {
      addParagraph(`${item.stage}: ${item.volume} × ${formatIndianNumber(item.price)} = ${formatIndianNumber(item.revenue)}`)
    })

    // Total revenue box
    doc.setFillColor(209, 250, 229)
    doc.rect(margin, y, pageWidth - 2 * margin, 12, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...COLORS.success)
    doc.text(`Total Revenue = ${formatLakhs(metrics.totalRevenue)} = ${metrics.roi.toFixed(1)}x ROI`, pageWidth / 2, y + 8, { align: 'center' })
    y += 20

    // ============================================
    // SECTION 6: SCALING TIMELINE
    // ============================================
    doc.addPage()
    y = margin

    addSectionHeader(6, 'Scaling Timeline')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...COLORS.primary)
    doc.text(`${formatIndianNumber(data.current_daily_spend)}/day`, pageWidth / 3, y, { align: 'center' })
    doc.setTextColor(...COLORS.dark)
    doc.text('→', pageWidth / 2, y, { align: 'center' })
    doc.setTextColor(...COLORS.success)
    doc.text(`${formatIndianNumber(data.target_daily_spend)}/day`, 2 * pageWidth / 3, y, { align: 'center' })
    y += 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.dark)
    doc.text(`${data.scaling_increment_percent || 20}% budget increments every ${data.scaling_frequency_days_min || 3}-${data.scaling_frequency_days_max || 4} days`, pageWidth / 2, y, { align: 'center' })
    y += 10

    const scalingRows = scaling.steps.slice(0, 15).map((step, index) => {
      const increment = index === 0 ? '-' : `+${data.scaling_increment_percent || 20}%`
      return [
        (index + 1).toString() + (step.isTarget ? ' (Goal)' : ''),
        formatIndianNumber(step.budget),
        increment,
        step.daysMin.toString(),
        step.daysMax.toString()
      ]
    })

    autoTable(doc, {
      startY: y,
      head: [['ROUND', 'BUDGET', 'INCREMENT %', 'DAY MIN', 'DAY MAX']],
      body: scalingRows,
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin }
    })

    y = doc.lastAutoTable.finalY + 10

    // Timeline boxes
    const timelineBoxWidth = (pageWidth - 3 * margin) / 2
    doc.setFillColor(...COLORS.light)
    doc.rect(margin, y, timelineBoxWidth, 20, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.dark)
    doc.text('MINIMUM TIMELINE', margin + timelineBoxWidth / 2, y + 6, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(...COLORS.primary)
    doc.text(`${scaling.totalDaysMin} Days`, margin + timelineBoxWidth / 2, y + 15, { align: 'center' })

    doc.setFillColor(...COLORS.light)
    doc.rect(margin + timelineBoxWidth + margin / 2, y, timelineBoxWidth, 20, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.dark)
    doc.text('MAXIMUM TIMELINE', margin + timelineBoxWidth + margin / 2 + timelineBoxWidth / 2, y + 6, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(...COLORS.primary)
    doc.text(`${scaling.totalDaysMax} Days`, margin + timelineBoxWidth + margin / 2 + timelineBoxWidth / 2, y + 15, { align: 'center' })

    y += 30

    // Warning note
    doc.setFillColor(254, 243, 199)
    doc.rect(margin, y, pageWidth - 2 * margin, 15, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.warning)
    doc.text('Note:', margin + 3, y + 6)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.dark)
    const noteText = `If CPA spikes above ₹${data.cpa_stage1_kill_range.toLocaleString()} during any increment, pause scaling and optimize creatives before continuing.`
    const noteLines = doc.splitTextToSize(noteText, pageWidth - 2 * margin - 20)
    doc.text(noteLines, margin + 15, y + 6)
    y += 25

    // ============================================
    // SECTION 7: TECH STACK
    // ============================================
    addSectionHeader(7, 'Tech Stack & Implementation')

    autoTable(doc, {
      startY: y,
      head: [['COMPONENT', 'SOLUTION']],
      body: [
        ['Funnel Platform', `${data.funnel_platform || 'GoHighLevel (GHL)'} – Funnels with full session & attribution`],
        ['Tracking & Attribution', `${data.tracking_tool || 'ZinoTrack'} – End-to-end server-side tracking via Meta`],
        ['Events Sent', 'Registration, Attendance, Video %, Book, Purchase, ROAS Tags'],
        ['CRM Integration', 'GHL → ZinoTrack → Meta CAPI (Server-Side)'],
        ['Repeat Buyers', 'Re-market via paid/organic sequences from GHL/Audience list']
      ],
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin }
    })

    y = doc.lastAutoTable.finalY + 10

    addSubheading("What We're Building")
    addBulletPoint('1. Complete GHL funnel with ad pages, forms, and automation')
    addBulletPoint(`2. Full event tracking: ${stages.map(s => s.name).join(', ')}, High Ticket`)
    addBulletPoint('3. Layer 1 + Layer 2 campaign setup in Ads Manager')
    addBulletPoint('4. ZinoTrack integration for CAPI + attribution')
    addBulletPoint('5. Custom dashboard for ROI/ROAS monitoring')
    addBulletPoint('6. Scaling SOP document with benchmarks')

    // ============================================
    // SECTION 8: SUMMARY
    // ============================================
    doc.addPage()
    y = margin

    addSectionHeader(8, 'Summary')

    // Problem vs Solution table
    autoTable(doc, {
      startY: y,
      head: [['THE PROBLEM', 'THE SOLUTION']],
      body: [
        [
          '• Meta only optimizing for FB regs\n• No tracking of high-value events\n• Algorithm attracts low-ticket buyers\n• Scaling = cost spikes',
          `• Deep event optimization (₹${data.stage3_price || data.stage1_price}+)\n• Full funnel tracking via ${data.tracking_tool || 'ZinoTrack'}\n• Educational Layer 2 for warm traffic\n• Systematic scaling with benchmarks`
        ]
      ],
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold' },
      columnStyles: {
        0: { fillColor: [254, 226, 226], textColor: [185, 28, 28] },
        1: { fillColor: [209, 250, 229], textColor: [4, 120, 87] }
      },
      margin: { left: margin, right: margin }
    })

    y = doc.lastAutoTable.finalY + 15

    // Key numbers box
    doc.setFillColor(...COLORS.primary)
    doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...COLORS.white)
    doc.text('KEY NUMBERS TO REMEMBER', pageWidth / 2, y + 6, { align: 'center' })
    y += 10

    doc.setFillColor(...COLORS.light)
    doc.rect(margin, y, pageWidth - 2 * margin, 30, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.dark)

    const col1X = margin + 5
    const col2X = pageWidth / 2 + 5
    doc.text(`Layer 1 Creatives: ${data.layer1_creatives_count}`, col1X, y + 8)
    doc.text(`Layer 2 Creatives: ${data.layer2_creatives_count}`, col1X, y + 15)
    doc.text(`Current Budget: ${formatIndianNumber(data.current_daily_spend)}/day`, col1X, y + 22)

    doc.setTextColor(...COLORS.success)
    doc.setFont('helvetica', 'bold')
    doc.text(`Goal Target: ${formatLakhs(metrics.totalRevenue)}/mo`, col2X, y + 8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.dark)
    doc.text(`Scale Budget: ${formatIndianNumber(data.target_daily_spend)}/day`, col2X, y + 15)
    doc.text(`Timeline: ${scaling.totalDaysMin}-${scaling.totalDaysMax} days`, col2X, y + 22)

    y += 40

    // Closing
    doc.setFont('helvetica', 'bolditalic')
    doc.setFontSize(14)
    doc.setTextColor(...COLORS.primary)
    doc.text('Ready to scale profitably.', pageWidth / 2, y, { align: 'center' })

    y += 10
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.secondary)
    doc.text('— End of Meta Ads Plan —', pageWidth / 2, y, { align: 'center' })

    // Save the PDF
    const filename = `${data.client_name.replace(/\s+/g, '_')}_Meta_Ads_Plan_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(filename)

    return { success: true, filename }
  } catch (error) {
    console.error('Error generating PDF:', error)
    return { success: false, error: error.message }
  }
}
