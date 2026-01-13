import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  convertInchesToTwip,
  ShadingType,
  VerticalAlign
} from 'docx'
import { saveAs } from 'file-saver'
import {
  calculateFunnelMetrics,
  calculateScalingTimeline,
  formatIndianNumber,
  getStageNames,
  calculateRevenueBreakdown
} from './calculations'
import { FUNNEL_TYPES } from './funnelConfigs'

// Color scheme
const COLORS = {
  primary: '1E40AF', // Blue
  secondary: '3B82F6',
  accent: '60A5FA',
  dark: '1F2937',
  light: 'F3F4F6',
  white: 'FFFFFF',
  success: '10B981',
  warning: 'F59E0B'
}

// Common styles
const createHeading = (text, level = HeadingLevel.HEADING_1) => {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        color: COLORS.primary,
        size: level === HeadingLevel.HEADING_1 ? 32 : 28
      })
    ],
    spacing: { before: 400, after: 200 },
    heading: level
  })
}

const createSubheading = (text) => {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        color: COLORS.dark,
        size: 24
      })
    ],
    spacing: { before: 300, after: 150 }
  })
}

const createParagraph = (text, options = {}) => {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        size: 22,
        color: COLORS.dark,
        ...options
      })
    ],
    spacing: { before: 100, after: 100 }
  })
}

const createBulletPoint = (text, options = {}) => {
  return new Paragraph({
    children: [
      new TextRun({
        text: '• ' + text,
        size: 22,
        color: COLORS.dark,
        ...options
      })
    ],
    spacing: { before: 50, after: 50 },
    indent: { left: 400 }
  })
}

const createTableCell = (text, options = {}) => {
  const {
    bold = false,
    header = false,
    alignment = AlignmentType.LEFT,
    shading = null,
    color = COLORS.dark
  } = options

  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: String(text),
            bold: bold || header,
            size: 20,
            color: header ? COLORS.white : color
          })
        ],
        alignment
      })
    ],
    shading: header
      ? { fill: COLORS.primary, type: ShadingType.SOLID }
      : shading
      ? { fill: shading, type: ShadingType.SOLID }
      : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: {
      top: convertInchesToTwip(0.05),
      bottom: convertInchesToTwip(0.05),
      left: convertInchesToTwip(0.1),
      right: convertInchesToTwip(0.1)
    }
  })
}

const createTable = (headers, rows, options = {}) => {
  const { columnWidths = null } = options

  const headerRow = new TableRow({
    children: headers.map((header) =>
      createTableCell(header, { header: true, alignment: AlignmentType.CENTER })
    ),
    tableHeader: true
  })

  const dataRows = rows.map(
    (row, index) =>
      new TableRow({
        children: row.map((cell, cellIndex) =>
          createTableCell(cell, {
            alignment: cellIndex === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
            shading: index % 2 === 0 ? COLORS.light : null
          })
        )
      })
  )

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: columnWidths
      ? columnWidths.map((w) => convertInchesToTwip(w))
      : undefined
  })
}

// Generate title page section
function generateTitlePage(data, metrics) {
  const funnelInfo = FUNNEL_TYPES[data.funnel_type]

  return [
    new Paragraph({
      children: [
        new TextRun({
          text: 'META ADS WARMAP',
          bold: true,
          color: COLORS.primary,
          size: 48
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: data.strategy_subtitle || 'Deep Event Optimization + Educational Layer Strategy',
          italics: true,
          color: COLORS.secondary,
          size: 28
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `For: ${data.client_name}`,
          bold: true,
          size: 32,
          color: COLORS.dark
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: data.business_name,
          size: 28,
          color: COLORS.dark
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Funnel Type: ${funnelInfo?.name || data.funnel_type}`,
          size: 24,
          color: COLORS.secondary
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),
    createTable(
      ['Metric', 'Value'],
      [
        ['Current Daily Spend', formatIndianNumber(data.current_daily_spend)],
        ['Target Daily Spend', formatIndianNumber(data.target_daily_spend)],
        ['Target Monthly Spend', formatIndianNumber(data.target_daily_spend * 30)],
        ['Projected Monthly Revenue', formatIndianNumber(metrics.totalRevenue)],
        ['Target ROI', `${metrics.roi.toFixed(1)}x`]
      ]
    ),
    new Paragraph({ text: '', spacing: { after: 400 } })
  ]
}

// Generate current state analysis section
function generateCurrentStateSection(data, metrics) {
  const stages = getStageNames(data.funnel_type, data)
  const stageLabels = stages.map((s) => s.name)

  // Build CPA rows based on funnel type
  const cpaRows = []

  // Current CPA row
  const currentCPARow = ['Current CPA', formatIndianNumber(data.current_cpa_stage1)]
  metrics.cpasAtCurrentCPA.forEach((cpa) => {
    currentCPARow.push(formatIndianNumber(cpa))
  })
  cpaRows.push(currentCPARow)

  // At Scale CPA row (if available)
  if (data.cpa_stage1_at_scale && metrics.cpasAtScale) {
    const atScaleRow = ['CPA at Scale', formatIndianNumber(data.cpa_stage1_at_scale)]
    metrics.cpasAtScale.forEach((cpa) => {
      atScaleRow.push(formatIndianNumber(cpa))
    })
    cpaRows.push(atScaleRow)
  }

  // Kill Range CPA row
  const killRangeRow = ['Kill Range CPA', formatIndianNumber(data.cpa_stage1_kill_range)]
  metrics.cpasAtKillRange.forEach((cpa) => {
    killRangeRow.push(formatIndianNumber(cpa))
  })
  cpaRows.push(killRangeRow)

  return [
    createHeading('1. Current State Analysis'),
    createParagraph(
      `Below is the analysis of ${data.client_name}'s current funnel performance and unit economics.`
    ),
    createSubheading('Funnel Flow'),
    createParagraph(stages.map((s) => s.name).join(' → ')),
    createSubheading('Unit Economics'),
    createTable(['Metric', 'Stage 1 CPA', ...stageLabels.slice(1).map((s) => `Cost/${s.split(' ')[0]}`)], cpaRows),
    new Paragraph({ text: '', spacing: { after: 200 } }),
    createSubheading('Conversion Rates'),
    createTable(
      ['Stage', 'Conversion Rate'],
      [
        [stages[1]?.name || 'Stage 2', `${data.stage2_conversion_rate}%`],
        ...(data.stage3_enabled
          ? [[stages[2]?.name || 'Stage 3', `${data.stage3_conversion_rate}%`]]
          : []),
        ...(data.stage4_enabled
          ? [[stages[3]?.name || 'Stage 4', `${data.stage4_conversion_rate}%`]]
          : []),
        ['High Ticket Conversion', `${data.high_ticket_conversion_rate}%`]
      ]
    ),
    new Paragraph({ text: '', spacing: { after: 400 } })
  ]
}

// Generate strategy section
function generateStrategySection(data) {
  const optimizationEvent =
    data.layer1_optimization_event ||
    (data.stage3_enabled && data.stage3_is_paid
      ? `${data.stage3_name} (₹${data.stage3_price})`
      : data.stage1_is_paid
      ? `${data.stage1_name} (₹${data.stage1_price})`
      : data.stage1_name)

  return [
    createHeading('2. The Strategy'),
    createSubheading('Deep Event Optimization'),
    createParagraph(
      'Instead of optimizing for top-of-funnel events like registrations, we optimize for the deepest possible event in the funnel. This trains Meta\'s algorithm to find higher-quality leads who are more likely to convert.'
    ),
    createBulletPoint(
      `Primary Optimization Event: ${optimizationEvent}`,
      { bold: true }
    ),
    createBulletPoint(
      'This approach may increase cost per registration, but dramatically improves cost per customer.'
    ),
    createBulletPoint(
      'Meta\'s AI learns from conversion signals at deeper funnel stages.'
    ),
    createSubheading('Educational Layer (Layer 2)'),
    createParagraph(
      'A separate campaign running educational content to warm up cold audiences before they enter the main funnel.'
    ),
    createBulletPoint(`Creative Count: ${data.layer2_creatives_count} videos`),
    createBulletPoint(`Objective: ${data.layer2_objective || 'ThruPlay (Video Views)'}`),
    createBulletPoint(`Target Cost Per View: ₹${data.layer2_cost_per_view || 0.5}`),
    new Paragraph({ text: '', spacing: { after: 400 } })
  ]
}

// Generate campaign structure section
function generateCampaignSection(data) {
  return [
    createHeading('3. Campaign Structure'),
    createSubheading('Layer 1: Conversion Campaign'),
    createTable(
      ['Parameter', 'Value'],
      [
        ['Objective', data.layer1_objective || 'Conversions'],
        ['Creative Count', data.layer1_creatives_count],
        ['Daily Budget (Initial)', formatIndianNumber(data.layer1_daily_budget || 10000)],
        ['Optimization Event', data.layer1_optimization_event || 'Deep Funnel Event']
      ]
    ),
    new Paragraph({ text: '', spacing: { after: 200 } }),
    createSubheading('Layer 2: Educational Campaign'),
    createTable(
      ['Parameter', 'Value'],
      [
        ['Objective', data.layer2_objective || 'ThruPlay (Video Views)'],
        ['Creative Count', data.layer2_creatives_count],
        ['Target Cost Per View', `₹${data.layer2_cost_per_view || 0.5}`],
        ['Budget Allocation', '10-15% of total budget']
      ]
    ),
    new Paragraph({ text: '', spacing: { after: 400 } })
  ]
}

// Generate funnel visualization section
function generateFunnelVisualization(data) {
  const stages = getStageNames(data.funnel_type, data)

  const flowParts = stages.map((stage, index) => {
    let label = stage.name
    if (stage.isPaid && stage.price > 0) {
      label += ` (₹${stage.price})`
    }
    return label
  })

  return [
    createHeading('4. Funnel Flow'),
    new Paragraph({
      children: [
        new TextRun({
          text: flowParts.join(' → '),
          size: 24,
          color: COLORS.primary,
          bold: true
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 }
    }),
    createTable(
      ['Stage', 'Type', 'Price'],
      stages.map((stage) => [
        stage.name,
        stage.isPaid ? 'Paid' : 'Free',
        stage.isPaid && stage.price > 0 ? formatIndianNumber(stage.price) : '-'
      ])
    ),
    new Paragraph({ text: '', spacing: { after: 400 } })
  ]
}

// Generate projections section
function generateProjectionsSection(data, metrics) {
  const breakdown = calculateRevenueBreakdown(data, metrics.volumes)

  return [
    createHeading('5. Numbers & Projections'),
    createSubheading('Monthly Projections (at Kill Range CPA)'),
    createTable(
      ['Metric', 'Value'],
      [
        ['Monthly Ad Spend', formatIndianNumber(metrics.monthlyAdSpend)],
        ['Stage 1 Volume (Registrations/Leads)', Math.round(metrics.volumes[0]).toString()],
        ['High Ticket Sales', metrics.highTicketSales.toString()],
        ['Total Revenue', formatIndianNumber(metrics.totalRevenue)],
        ['ROI', `${metrics.roi.toFixed(2)}x`],
        ['Cost Per Customer', formatIndianNumber(metrics.costPerCustomer_kill)]
      ]
    ),
    new Paragraph({ text: '', spacing: { after: 200 } }),
    createSubheading('Revenue Breakdown'),
    createTable(
      ['Source', 'Volume', 'Price', 'Revenue'],
      breakdown.map((item) => [
        item.stage,
        item.volume.toString(),
        formatIndianNumber(item.price),
        formatIndianNumber(item.revenue)
      ])
    ),
    new Paragraph({ text: '', spacing: { after: 400 } })
  ]
}

// Generate scaling timeline section
function generateScalingSection(data) {
  const scaling = calculateScalingTimeline(
    data.current_daily_spend,
    data.target_daily_spend,
    data.scaling_increment_percent || 20,
    data.scaling_frequency_days_min || 3,
    data.scaling_frequency_days_max || 4
  )

  return [
    createHeading('6. Scaling Timeline'),
    createParagraph(
      `Scaling from ${formatIndianNumber(data.current_daily_spend)}/day to ${formatIndianNumber(
        data.target_daily_spend
      )}/day with ${data.scaling_increment_percent || 20}% increments every ${
        data.scaling_frequency_days_min || 3
      }-${data.scaling_frequency_days_max || 4} days.`
    ),
    createTable(
      ['Step', 'Daily Budget', 'Days (Min)', 'Days (Max)'],
      scaling.steps.map((step) => [
        step.isStart ? 'Start' : step.isTarget ? 'Target' : `Step ${step.step}`,
        formatIndianNumber(step.budget),
        step.daysMin.toString(),
        step.daysMax.toString()
      ])
    ),
    new Paragraph({ text: '', spacing: { after: 200 } }),
    createParagraph(
      `Total Steps: ${scaling.totalSteps} | Estimated Duration: ${scaling.totalDaysMin}-${scaling.totalDaysMax} days`,
      { bold: true }
    ),
    new Paragraph({ text: '', spacing: { after: 400 } })
  ]
}

// Generate tech stack section
function generateTechSection(data) {
  return [
    createHeading('7. Tech Stack'),
    createTable(
      ['Component', 'Tool'],
      [
        ['Funnel Platform', data.funnel_platform || 'GoHighLevel (GHL)'],
        ['Tracking Tool', data.tracking_tool || 'ZinoTrack'],
        ['Ad Platform', 'Meta Ads (Facebook/Instagram)'],
        ['Analytics', 'Meta Events Manager + Custom Dashboard']
      ]
    ),
    new Paragraph({ text: '', spacing: { after: 400 } })
  ]
}

// Generate summary section
function generateSummarySection(data, metrics) {
  return [
    createHeading('8. Summary'),
    createSubheading('Problem → Solution'),
    createTable(
      ['Problem', 'Solution'],
      [
        [
          'Optimizing for registrations brings low-quality leads',
          'Deep event optimization for qualified prospects'
        ],
        [
          'High cost per customer',
          `Reduced to ${formatIndianNumber(metrics.costPerCustomer_kill)}`
        ],
        [
          'Limited scale capability',
          `Scaling to ${formatIndianNumber(data.target_daily_spend)}/day`
        ],
        [
          'Unpredictable revenue',
          `Projected ${formatIndianNumber(metrics.totalRevenue)}/month at ${metrics.roi.toFixed(1)}x ROI`
        ]
      ]
    ),
    new Paragraph({ text: '', spacing: { after: 200 } }),
    createSubheading('Key Actions'),
    createBulletPoint('Implement deep event tracking on all funnel stages'),
    createBulletPoint('Set up Layer 1 (Conversion) and Layer 2 (Educational) campaigns'),
    createBulletPoint('Monitor and optimize based on deep funnel metrics'),
    createBulletPoint('Scale budget systematically following the timeline'),
    new Paragraph({ text: '', spacing: { after: 400 } }),
    new Paragraph({
      children: [
        new TextRun({
          text: '— End of Warmap —',
          italics: true,
          color: COLORS.secondary,
          size: 22
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 }
    })
  ]
}

/**
 * Generate the complete warmap document
 */
export async function generateWarmapDocument(data) {
  // Calculate metrics
  const metrics = calculateFunnelMetrics(data)

  // Build document sections
  const sections = [
    ...generateTitlePage(data, metrics),
    ...generateCurrentStateSection(data, metrics),
    ...generateStrategySection(data),
    ...generateCampaignSection(data),
    ...generateFunnelVisualization(data),
    ...generateProjectionsSection(data, metrics),
    ...generateScalingSection(data),
    ...generateTechSection(data),
    ...generateSummarySection(data, metrics)
  ]

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1)
            }
          }
        },
        children: sections
      }
    ]
  })

  return doc
}

/**
 * Download the warmap as a .docx file
 */
export async function downloadWarmap(data) {
  try {
    const doc = await generateWarmapDocument(data)
    const blob = await Packer.toBlob(doc)

    const filename = `${data.client_name.replace(/\s+/g, '_')}_Warmap_${
      new Date().toISOString().split('T')[0]
    }.docx`

    saveAs(blob, filename)
    return { success: true, filename }
  } catch (error) {
    console.error('Error generating warmap:', error)
    return { success: false, error: error.message }
  }
}
