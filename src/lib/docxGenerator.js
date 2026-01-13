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
  VerticalAlign,
  PageBreak
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
  primary: '1E3A8A', // Dark Blue
  secondary: '3B82F6', // Blue
  accent: '60A5FA', // Light Blue
  dark: '1F2937',
  light: 'F3F4F6',
  lighterBlue: 'DBEAFE',
  white: 'FFFFFF',
  success: '10B981',
  successLight: 'D1FAE5',
  warning: 'F59E0B',
  warningLight: 'FEF3C7',
  danger: 'EF4444',
  dangerLight: 'FEE2E2',
  purple: '7C3AED',
  purpleLight: 'EDE9FE'
}

// Helper to format lakhs
function formatLakhs(amount) {
  const lakhs = amount / 100000
  if (lakhs >= 1) {
    return `₹${lakhs.toFixed(0)} Lakhs`
  }
  return formatIndianNumber(amount)
}

// Common styles
const createHeading = (text, number = null) => {
  const displayText = number ? `${number}. ${text.toUpperCase()}` : text.toUpperCase()
  return new Paragraph({
    children: [
      new TextRun({
        text: displayText,
        bold: true,
        color: COLORS.primary,
        size: 28
      })
    ],
    spacing: { before: 400, after: 200 },
    shading: { fill: COLORS.lighterBlue, type: ShadingType.SOLID },
    indent: { left: 100, right: 100 }
  })
}

const createSubheading = (text, color = COLORS.dark) => {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        color: color,
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

const createNumberedPoint = (number, text, options = {}) => {
  return new Paragraph({
    children: [
      new TextRun({
        text: `${number}. ${text}`,
        size: 22,
        color: COLORS.dark,
        ...options
      })
    ],
    spacing: { before: 50, after: 50 },
    indent: { left: 400 }
  })
}

const createHighlightBox = (title, content, bgColor = COLORS.warningLight, textColor = COLORS.dark) => {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 22,
          color: textColor
        })
      ],
      shading: { fill: bgColor, type: ShadingType.SOLID },
      spacing: { before: 200, after: 0 },
      indent: { left: 200, right: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: content,
          size: 20,
          color: textColor
        })
      ],
      shading: { fill: bgColor, type: ShadingType.SOLID },
      spacing: { before: 0, after: 200 },
      indent: { left: 200, right: 200 }
    })
  ]
}

const createTableCell = (text, options = {}) => {
  const {
    bold = false,
    header = false,
    alignment = AlignmentType.LEFT,
    shading = null,
    color = COLORS.dark,
    fontSize = 20
  } = options

  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: String(text),
            bold: bold || header,
            size: fontSize,
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

const createStatusCell = (status, isTracked = false) => {
  const bgColor = isTracked ? COLORS.successLight : COLORS.dangerLight
  const textColor = isTracked ? '047857' : 'B91C1C'
  const text = isTracked ? `${status} ✓` : status

  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: true,
            size: 18,
            color: textColor
          })
        ],
        alignment: AlignmentType.CENTER
      })
    ],
    shading: { fill: bgColor, type: ShadingType.SOLID },
    verticalAlign: VerticalAlign.CENTER,
    margins: {
      top: convertInchesToTwip(0.03),
      bottom: convertInchesToTwip(0.03),
      left: convertInchesToTwip(0.05),
      right: convertInchesToTwip(0.05)
    }
  })
}

// ============================================
// SECTION 1: TITLE PAGE
// ============================================
function generateTitlePage(data, metrics) {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: 'META ADS PLAN',
          bold: true,
          color: COLORS.primary,
          size: 56
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${data.client_name}'s ${data.business_name}`,
          bold: true,
          size: 36,
          color: COLORS.dark
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: data.strategy_subtitle || 'Deep Event Optimization + Educational Layer Strategy',
          italics: true,
          color: COLORS.secondary,
          size: 24
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),
    // Key metrics boxes
    new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Current Spend', size: 18, color: COLORS.dark })
                  ],
                  alignment: AlignmentType.CENTER
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: formatIndianNumber(data.current_daily_spend) + '/day', bold: true, size: 28, color: COLORS.primary })
                  ],
                  alignment: AlignmentType.CENTER
                })
              ],
              shading: { fill: COLORS.lighterBlue, type: ShadingType.SOLID },
              margins: { top: 100, bottom: 100, left: 100, right: 100 }
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Target Spend', size: 18, color: COLORS.dark })
                  ],
                  alignment: AlignmentType.CENTER
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: formatIndianNumber(data.target_daily_spend) + '/day', bold: true, size: 28, color: COLORS.primary })
                  ],
                  alignment: AlignmentType.CENTER
                })
              ],
              shading: { fill: COLORS.lighterBlue, type: ShadingType.SOLID },
              margins: { top: 100, bottom: 100, left: 100, right: 100 }
            })
          ]
        })
      ],
      width: { size: 100, type: WidthType.PERCENTAGE }
    }),
    new Paragraph({ text: '', spacing: { after: 200 } }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Revenue Target: ${formatLakhs(metrics.totalRevenue)}/Month`,
          bold: true,
          size: 32,
          color: COLORS.success
        })
      ],
      alignment: AlignmentType.CENTER,
      shading: { fill: COLORS.successLight, type: ShadingType.SOLID },
      spacing: { before: 100, after: 400 }
    }),
    new Paragraph({ children: [new PageBreak()] })
  ]
}

// ============================================
// SECTION 2: CURRENT STATE ANALYSIS
// ============================================
function generateCurrentStateSection(data, metrics) {
  const stages = getStageNames(data.funnel_type, data)

  // Build funnel flow table data
  const funnelFlowRows = []
  let previousVolume = metrics.volumes[0]

  stages.forEach((stage, index) => {
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

    funnelFlowRows.push([
      stage.name,
      priceDisplay,
      convRate,
      volume.toString(),
      cpa
    ])
  })

  // Calculation breakdown
  const stage1Name = stages[0]?.name || 'Registration'
  const calcBreakdown = `Cost/${stage1Name}: ₹${data.current_cpa_stage1} (current) → ₹${data.cpa_stage1_kill_range} (kill range)
Kill Range: CPR = ${formatIndianNumber(data.cpa_stage1_kill_range)} (Cost per ${stage1Name} where lifetime customer value > CPA)`

  return [
    createHeading('CURRENT STATE ANALYSIS', 1),
    createSubheading('Current Funnel Flow & Unit Economics'),
    createTable(
      ['STAGE', 'PRICE', 'CONV %', 'VOLUME', 'CPA NOW'],
      funnelFlowRows
    ),
    new Paragraph({ text: '', spacing: { after: 200 } }),
    createSubheading('CALCULATION BREAKDOWN'),
    createParagraph(calcBreakdown, { size: 20 }),
    new Paragraph({ text: '', spacing: { after: 200 } }),
    createSubheading('Current Problems', COLORS.danger),
    createBulletPoint(`Meta ONLY optimizing for FB ${stages[0]?.name?.toLowerCase() || 'registrations'}`),
    createBulletPoint(`Low quality leads – people who register for FREE / ultra-low-cost (₹${data.stage1_price || 0}) / who converted to ₹${data.stage1_price || 0}k`),
    createBulletPoint('Algorithm not tuned to high-value actions'),
    createBulletPoint('Scale attempts fail – costs spike, quality drops'),
    new Paragraph({ text: '', spacing: { after: 300 } }),
    new Paragraph({ children: [new PageBreak()] })
  ]
}

// ============================================
// SECTION 3: THE STRATEGY - PHASE 1
// ============================================
function generateStrategySection(data, metrics) {
  const stages = getStageNames(data.funnel_type, data)
  const optimizationEvent = data.stage3_enabled && data.stage3_is_paid
    ? `${data.stage3_name} (₹${data.stage3_price})`
    : data.stage1_is_paid
    ? `${data.stage1_name} (₹${data.stage1_price})`
    : data.stage1_name

  // Build event tracking table
  const eventRows = []

  // Stage 1 event
  eventRows.push({
    event: `FB ${stages[0]?.name || 'Registration'}`,
    currentStatus: 'ROOT Tracked',
    currentTracked: true,
    newStatus: 'ROOT Tracked',
    newTracked: true
  })

  // Stage 2 event
  eventRows.push({
    event: stages[1]?.name || 'Attendance',
    currentStatus: 'NOT Tracked',
    currentTracked: false,
    newStatus: 'TRACKED',
    newTracked: true
  })

  // Stage 3 event (if enabled)
  if (data.stage3_enabled) {
    const stage3Label = data.stage3_is_paid
      ? `₹${data.stage3_price} ${data.stage3_name}`
      : data.stage3_name
    eventRows.push({
      event: stage3Label,
      currentStatus: 'ROOT Tracked',
      currentTracked: true,
      newStatus: 'TRACKED + OPTIMIZED',
      newTracked: true
    })
  }

  // Stage 4 event (if enabled)
  if (data.stage4_enabled) {
    eventRows.push({
      event: data.stage4_name || 'Call Attended',
      currentStatus: 'NOT Tracked',
      currentTracked: false,
      newStatus: 'TRACKED',
      newTracked: true
    })
  }

  // High ticket event
  eventRows.push({
    event: `₹${data.high_ticket_price.toLocaleString()} High Ticket`,
    currentStatus: 'NOT Tracked',
    currentTracked: false,
    newStatus: 'TRACKED',
    newTracked: true
  })

  // Create event tracking table
  const eventTrackingTable = new Table({
    rows: [
      new TableRow({
        children: [
          createTableCell('EVENT', { header: true, alignment: AlignmentType.CENTER }),
          createTableCell('CURRENT STATUS', { header: true, alignment: AlignmentType.CENTER }),
          createTableCell('NEW STATUS', { header: true, alignment: AlignmentType.CENTER })
        ],
        tableHeader: true
      }),
      ...eventRows.map((row, index) =>
        new TableRow({
          children: [
            createTableCell(row.event, { shading: index % 2 === 0 ? COLORS.light : null }),
            createStatusCell(row.currentStatus, row.currentTracked),
            createStatusCell(row.newStatus, row.newTracked)
          ]
        })
      )
    ],
    width: { size: 100, type: WidthType.PERCENTAGE }
  })

  return [
    createHeading('THE STRATEGY - PHASE 1', 2),
    createSubheading('2-LAYER CAMPAIGN ARCHITECTURE'),
    new Paragraph({
      children: [
        new TextRun({ text: 'Layer 1: ', bold: true, size: 22, color: COLORS.primary }),
        new TextRun({ text: `${stages[0]?.name || 'Registration'} Ads (Conversion Optimized)`, size: 22 })
      ],
      spacing: { before: 100, after: 50 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Layer 2: ', bold: true, size: 22, color: COLORS.secondary }),
        new TextRun({ text: 'Educational Brand Lift Ads (ThruPlay)', size: 22 })
      ],
      spacing: { after: 50 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: '+ Deep Event Optimization via ', bold: true, size: 22, color: COLORS.success }),
        new TextRun({ text: data.tracking_tool || 'ZinoTrack', bold: true, size: 22, color: COLORS.success })
      ],
      spacing: { after: 200 }
    }),
    createSubheading('Step 1: Deep Event Optimization'),
    createParagraph(`You're targeting an event on HIGH VALUE buyers, not just registrations:`),
    new Paragraph({ text: '', spacing: { after: 100 } }),
    eventTrackingTable,
    new Paragraph({ text: '', spacing: { after: 200 } }),
    ...createHighlightBox(
      'KEY INSIGHT:',
      `Optimize for ${optimizationEvent} event as primary of FB ${stages[0]?.name?.toLowerCase() || 'registration'}. The audience Meta finds with deep tracking is 85%+ more qualified than cold ₹${data.stage1_price || 0} opt-ins!`,
      COLORS.warningLight,
      COLORS.dark
    ),
    new Paragraph({ text: '', spacing: { after: 200 } }),
    createSubheading('Step 2: Educational Relief BAM Ads (Layer 2)'),
    createTable(
      ['Parameter', 'Value'],
      [
        ['Format', '15-30 second videos (1 min max)'],
        ['Objective', 'ThruPlay (Video Views)'],
        ['Est. Cost Per View', `~₹${data.layer2_cost_per_view || 0.30} (in post)`],
        ['Purpose', 'Build authority with beliefs; warm the audience']
      ]
    ),
    new Paragraph({ text: '', spacing: { after: 200 } }),
    createSubheading('Layer 2 Targeting Logic'),
    createBulletPoint(`Audience Size: Fresh/Warm (Ads Retgt)`),
    createBulletPoint(`Lookalike on webinar / course / call page`),
    createBulletPoint(`Past ${formatIndianNumber(100000)} already Converted – look alike`),
    createBulletPoint(`Flat TOF/A roll`),
    new Paragraph({ text: '', spacing: { after: 300 } }),
    new Paragraph({ children: [new PageBreak()] })
  ]
}

// ============================================
// SECTION 4: CAMPAIGN STRUCTURE
// ============================================
function generateCampaignSection(data) {
  const stages = getStageNames(data.funnel_type, data)
  const optimizationEvent = data.stage3_enabled && data.stage3_is_paid
    ? `${data.stage3_name} (₹${data.stage3_price})`
    : stages[0]?.name || 'Registration'

  return [
    createHeading('CAMPAIGN STRUCTURE', 3),
    createSubheading('Layer 1: Webinar Registration Campaign'),
    createTable(
      ['Parameter', 'Value'],
      [
        ['Objective', `Conversions (optimized for ₹${data.stage3_is_paid ? data.stage3_price : data.stage1_price} purchases)`],
        ['Number of Creatives', `${data.layer1_creatives_count} static/video ads`],
        ['Target Daily Budget', `${formatIndianNumber(data.current_daily_spend)}/day`],
        ['Target CPA', 'On or Below Ad Spend Based on LTV']
      ]
    ),
    new Paragraph({ text: '', spacing: { after: 200 } }),
    createSubheading('Layer 2: Educational Ads Campaign'),
    createTable(
      ['Parameter', 'Value'],
      [
        ['Objective', data.layer2_objective || 'ThruPlay (Video Views)'],
        ['Number of Creatives', `${data.layer2_creatives_count} (short videos) (+mix)`],
        ['Cost Per View', `~₹${data.layer2_cost_per_view || 0.30} (in post)`],
        ['Audience', 'Warm (cold is an option – ROAS to guide)']
      ]
    ),
    new Paragraph({ text: '', spacing: { after: 300 } }),
    new Paragraph({ children: [new PageBreak()] })
  ]
}

// ============================================
// SECTION 5: FUNNEL FLOW VISUALIZATION
// ============================================
function generateFunnelVisualization(data, metrics) {
  const stages = getStageNames(data.funnel_type, data)

  const flowElements = []

  flowElements.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'COLD AUDIENCE', bold: true, size: 20, color: COLORS.white })
      ],
      alignment: AlignmentType.CENTER,
      shading: { fill: COLORS.dark, type: ShadingType.SOLID },
      spacing: { before: 100, after: 50 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Sees Layer 1 ${stages[0]?.name || 'Webinar'} Ads (${data.layer1_creatives_count} creatives)`, size: 18, color: COLORS.dark })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: '↓', size: 24, color: COLORS.secondary })
      ],
      alignment: AlignmentType.CENTER
    })
  )

  // Add each stage
  stages.forEach((stage, index) => {
    const priceText = stage.isPaid && stage.price > 0 ? ` → ₹${stage.price}` : ''
    let convText = ''

    if (index === 1) {
      convText = ` → ${data.stage2_conversion_rate}%`
    } else if (index === 2 && data.stage3_enabled) {
      convText = ` → ${data.stage3_conversion_rate}%`
    } else if (index === 3 && data.stage4_enabled) {
      convText = ` → ${data.stage4_conversion_rate}%`
    } else if (index === stages.length - 1) {
      convText = ` → ${data.high_ticket_conversion_rate}%`
    }

    const bgColor = index === stages.length - 1 ? COLORS.successLight : COLORS.lighterBlue
    const textColor = index === stages.length - 1 ? COLORS.success : COLORS.primary

    flowElements.push(
      new Paragraph({
        children: [
          new TextRun({ text: stage.name.toUpperCase(), bold: true, size: 22, color: textColor }),
          new TextRun({ text: priceText + convText, size: 20, color: COLORS.dark })
        ],
        alignment: AlignmentType.CENTER,
        shading: { fill: bgColor, type: ShadingType.SOLID },
        spacing: { before: 50, after: 50 }
      })
    )

    // Add layer 2 note after first stage
    if (index === 0) {
      flowElements.push(
        new Paragraph({
          children: [
            new TextRun({ text: '(First-hand BAM Ads / Layer 2 Ads here)', italics: true, size: 18, color: COLORS.secondary })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 50 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '+ Layer 2 Edu Ads Start', bold: true, size: 18, color: COLORS.success })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 50 }
        })
      )
    }

    if (index < stages.length - 1) {
      flowElements.push(
        new Paragraph({
          children: [
            new TextRun({ text: '↓', size: 24, color: COLORS.secondary })
          ],
          alignment: AlignmentType.CENTER
        })
      )
    }
  })

  // Final conversion note
  flowElements.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${data.high_ticket_conversion_rate}% of calls converts = Current State (All ads)`,
          italics: true,
          size: 18,
          color: COLORS.dark
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 200 }
    })
  )

  return [
    createHeading('FUNNEL FLOW VISUALIZATION', 4),
    ...flowElements,
    new Paragraph({ text: '', spacing: { after: 200 } }),
    new Paragraph({ children: [new PageBreak()] })
  ]
}

// ============================================
// SECTION 6: NUMBERS & PROJECTIONS
// ============================================
function generateProjectionsSection(data, metrics) {
  const stages = getStageNames(data.funnel_type, data)
  const breakdown = calculateRevenueBreakdown(data, metrics.volumes)

  // Current vs Target metrics
  const metricsComparison = [
    ['Daily Ad Spend', formatIndianNumber(data.current_daily_spend), formatIndianNumber(data.target_daily_spend)],
    ['Cost Per Registration', `${formatIndianNumber(data.current_cpa_stage1)}`, `${formatIndianNumber(data.cpa_stage1_kill_range)} (Kill Target Max)`],
    [`₹${data.stage3_price || data.stage1_price} Conversion Rate`, 'Same', `→ ${formatLakhs(metrics.totalRevenue)}`],
    ['Monthly Revenue', '-', formatLakhs(metrics.totalRevenue)],
    ['ROI Target', '-', `${data.target_roi || 2}x ROI`]
  ]

  // Revenue math breakdown
  const monthlySpend = data.target_daily_spend * 30
  const registrations = Math.round(monthlySpend / data.cpa_stage1_kill_range)

  return [
    createHeading('NUMBERS & PROJECTIONS', 5),
    createSubheading('Current vs Target Metrics'),
    createTable(['METRIC', 'NOW', 'TARGET'], metricsComparison),
    new Paragraph({ text: '', spacing: { after: 200 } }),
    createSubheading('Revenue Math (at Kill Range CPA)', COLORS.success),
    new Paragraph({
      children: [
        new TextRun({ text: `Monthly Ad Spend: ${formatIndianNumber(data.target_daily_spend)} x 30 = `, size: 22 }),
        new TextRun({ text: formatIndianNumber(monthlySpend), bold: true, size: 22, color: COLORS.primary })
      ],
      spacing: { before: 100, after: 50 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Registrations: ${formatIndianNumber(monthlySpend)} / ${formatIndianNumber(data.cpa_stage1_kill_range)} = `, size: 22 }),
        new TextRun({ text: registrations.toString(), bold: true, size: 22, color: COLORS.primary })
      ],
      spacing: { after: 50 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `High Ticket Sales: `, size: 22 }),
        new TextRun({ text: `${registrations} × ${data.stage2_conversion_rate}% × ${data.stage3_enabled ? data.stage3_conversion_rate + '% × ' : ''}${data.stage4_enabled ? data.stage4_conversion_rate + '% × ' : ''}${data.high_ticket_conversion_rate}% = `, size: 22 }),
        new TextRun({ text: `~${metrics.highTicketSales}`, bold: true, size: 22, color: COLORS.success })
      ],
      spacing: { after: 100 }
    }),
    new Paragraph({ text: '', spacing: { after: 100 } }),
    createSubheading('Revenue Breakdown'),
    ...breakdown.map((item) =>
      new Paragraph({
        children: [
          new TextRun({ text: `${item.stage}: `, size: 22 }),
          new TextRun({ text: `${item.volume} × ${formatIndianNumber(item.price)} = `, size: 22 }),
          new TextRun({ text: formatIndianNumber(item.revenue), bold: true, size: 22, color: COLORS.success })
        ],
        spacing: { after: 50 }
      })
    ),
    new Paragraph({ text: '', spacing: { after: 100 } }),
    new Paragraph({
      children: [
        new TextRun({ text: `Total Revenue = ${formatLakhs(metrics.totalRevenue)} = `, bold: true, size: 24 }),
        new TextRun({ text: `${metrics.roi.toFixed(1)}x ROI`, bold: true, size: 24, color: COLORS.success })
      ],
      shading: { fill: COLORS.successLight, type: ShadingType.SOLID },
      spacing: { before: 100, after: 300 }
    }),
    new Paragraph({ children: [new PageBreak()] })
  ]
}

// ============================================
// SECTION 7: SCALING TIMELINE
// ============================================
function generateScalingSection(data) {
  const scaling = calculateScalingTimeline(
    data.current_daily_spend,
    data.target_daily_spend,
    data.scaling_increment_percent || 20,
    data.scaling_frequency_days_min || 3,
    data.scaling_frequency_days_max || 4
  )

  const scalingRows = scaling.steps.map((step, index) => {
    const increment = index === 0 ? '-' : `+${data.scaling_increment_percent || 20}%`
    return [
      (index + 1).toString(),
      formatIndianNumber(step.budget),
      increment,
      step.daysMin.toString(),
      step.daysMax.toString()
    ]
  })

  return [
    createHeading('SCALING TIMELINE', 6),
    new Paragraph({
      children: [
        new TextRun({ text: `${formatIndianNumber(data.current_daily_spend)}/day`, bold: true, size: 24, color: COLORS.primary }),
        new TextRun({ text: ' → ', size: 24 }),
        new TextRun({ text: `${formatIndianNumber(data.target_daily_spend)}/day`, bold: true, size: 24, color: COLORS.success })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 50 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `${data.scaling_increment_percent || 20}% budget increments every ${data.scaling_frequency_days_min || 3}-${data.scaling_frequency_days_max || 4} days`, size: 20, color: COLORS.dark })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),
    createSubheading('Budget Scaling Steps'),
    createTable(['ROUND', 'BUDGET', 'INCREMENT %', 'DAY MIN', 'DAY MAX'], scalingRows),
    new Paragraph({ text: '', spacing: { after: 200 } }),
    // Timeline boxes
    new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'MINIMUM TIMELINE', bold: true, size: 20, color: COLORS.dark })
                  ],
                  alignment: AlignmentType.CENTER
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: `${scaling.totalDaysMin} Days`, bold: true, size: 32, color: COLORS.primary })
                  ],
                  alignment: AlignmentType.CENTER
                })
              ],
              shading: { fill: COLORS.lighterBlue, type: ShadingType.SOLID },
              margins: { top: 100, bottom: 100, left: 100, right: 100 }
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'MAXIMUM TIMELINE', bold: true, size: 20, color: COLORS.dark })
                  ],
                  alignment: AlignmentType.CENTER
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: `${scaling.totalDaysMax} Days`, bold: true, size: 32, color: COLORS.primary })
                  ],
                  alignment: AlignmentType.CENTER
                })
              ],
              shading: { fill: COLORS.lighterBlue, type: ShadingType.SOLID },
              margins: { top: 100, bottom: 100, left: 100, right: 100 }
            })
          ]
        })
      ],
      width: { size: 100, type: WidthType.PERCENTAGE }
    }),
    new Paragraph({ text: '', spacing: { after: 200 } }),
    ...createHighlightBox(
      'Note:',
      `If CPA spikes above ₹${data.cpa_stage1_kill_range.toLocaleString()} during any increment, pause scaling and optimize creatives before continuing.`,
      COLORS.warningLight,
      COLORS.dark
    ),
    new Paragraph({ text: '', spacing: { after: 200 } }),
    new Paragraph({ children: [new PageBreak()] })
  ]
}

// ============================================
// SECTION 8: TECH STACK & IMPLEMENTATION
// ============================================
function generateTechSection(data) {
  const stages = getStageNames(data.funnel_type, data)

  const eventsList = stages.map(s => s.name).join(', ')

  return [
    createHeading('TECH STACK & IMPLEMENTATION', 7),
    createTable(
      ['COMPONENT', 'SOLUTION'],
      [
        ['Funnel Platform', `${data.funnel_platform || 'GoHighLevel (GHL)'} – Funnels with full session & attribution`],
        ['Tracking & Attribution', `${data.tracking_tool || 'ZinoTrack'} – End-to-end server-side tracking via Meta`],
        ['Events Sent', `Registration, Attendance, Video %, Book, Purchase, ROAS Tags`],
        ['CRM Integration', 'GHL → ZinoTrack → Meta CAPI (Server-Side)'],
        ['Repeat Buyers', 'Re-market via paid/organic sequences from GHL/Audience list']
      ]
    ),
    new Paragraph({ text: '', spacing: { after: 200 } }),
    createSubheading('What We\'re Building'),
    createNumberedPoint(1, `Complete GHL funnel with ad pages, forms, and automation`),
    createNumberedPoint(2, `Full event tracking: ${eventsList}, High Ticket`),
    createNumberedPoint(3, `Layer 1 + Layer 2 campaign setup in Ads Manager`),
    createNumberedPoint(4, `ZinoTrack integration for CAPI + attribution`),
    createNumberedPoint(5, `Custom dashboard for ROI/ROAS monitoring`),
    createNumberedPoint(6, `Scaling SOP document with benchmarks`),
    new Paragraph({ text: '', spacing: { after: 200 } }),
    new Paragraph({ children: [new PageBreak()] })
  ]
}

// ============================================
// SECTION 9: SUMMARY
// ============================================
function generateSummarySection(data, metrics) {
  const scaling = calculateScalingTimeline(
    data.current_daily_spend,
    data.target_daily_spend,
    data.scaling_increment_percent || 20,
    data.scaling_frequency_days_min || 3,
    data.scaling_frequency_days_max || 4
  )

  return [
    createHeading('SUMMARY', 8),
    new Table({
      rows: [
        new TableRow({
          children: [
            createTableCell('THE PROBLEM', { header: true, alignment: AlignmentType.CENTER }),
            createTableCell('THE SOLUTION', { header: true, alignment: AlignmentType.CENTER })
          ],
          tableHeader: true
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: '• Meta only optimizing for FB regs', size: 20, color: COLORS.dark })],
                  spacing: { after: 50 }
                }),
                new Paragraph({
                  children: [new TextRun({ text: '• No tracking of high-value events', size: 20, color: COLORS.dark })],
                  spacing: { after: 50 }
                }),
                new Paragraph({
                  children: [new TextRun({ text: '• Algorithm attracts low-ticket buyers', size: 20, color: COLORS.dark })],
                  spacing: { after: 50 }
                }),
                new Paragraph({
                  children: [new TextRun({ text: '• Scaling = cost spikes', size: 20, color: COLORS.dark })]
                })
              ],
              shading: { fill: COLORS.dangerLight, type: ShadingType.SOLID },
              margins: { top: 100, bottom: 100, left: 100, right: 100 }
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: '• Deep event optimization (₹999+)', size: 20, color: COLORS.dark })],
                  spacing: { after: 50 }
                }),
                new Paragraph({
                  children: [new TextRun({ text: '• Full funnel tracking via ZinoTrack', size: 20, color: COLORS.dark })],
                  spacing: { after: 50 }
                }),
                new Paragraph({
                  children: [new TextRun({ text: '• Educational Layer 2 for warm traffic', size: 20, color: COLORS.dark })],
                  spacing: { after: 50 }
                }),
                new Paragraph({
                  children: [new TextRun({ text: '• Systematic scaling with benchmarks', size: 20, color: COLORS.dark })]
                })
              ],
              shading: { fill: COLORS.successLight, type: ShadingType.SOLID },
              margins: { top: 100, bottom: 100, left: 100, right: 100 }
            })
          ]
        })
      ],
      width: { size: 100, type: WidthType.PERCENTAGE }
    }),
    new Paragraph({ text: '', spacing: { after: 300 } }),
    // Key numbers box
    new Paragraph({
      children: [
        new TextRun({ text: 'KEY NUMBERS TO REMEMBER', bold: true, size: 24, color: COLORS.white })
      ],
      alignment: AlignmentType.CENTER,
      shading: { fill: COLORS.primary, type: ShadingType.SOLID },
      spacing: { before: 100, after: 0 }
    }),
    new Table({
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: `Layer 1 Creatives: ${data.layer1_creatives_count}`, size: 20 })
                  ]
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: `Layer 2 Creatives: ${data.layer2_creatives_count}`, size: 20 })
                  ]
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: `Current Budget: ${formatIndianNumber(data.current_daily_spend)}/day`, size: 20 })
                  ]
                })
              ],
              shading: { fill: COLORS.lighterBlue, type: ShadingType.SOLID },
              margins: { top: 100, bottom: 100, left: 100, right: 100 }
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: `Goal Target: ${formatLakhs(metrics.totalRevenue)}/mo`, size: 20, bold: true, color: COLORS.success })
                  ]
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: `Scale Budget: ${formatIndianNumber(data.target_daily_spend)}/day`, size: 20 })
                  ]
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: `Timeline: ${scaling.totalDaysMin}-${scaling.totalDaysMax} days`, size: 20 })
                  ]
                })
              ],
              shading: { fill: COLORS.lighterBlue, type: ShadingType.SOLID },
              margins: { top: 100, bottom: 100, left: 100, right: 100 }
            })
          ]
        })
      ],
      width: { size: 100, type: WidthType.PERCENTAGE }
    }),
    new Paragraph({ text: '', spacing: { after: 300 } }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Ready to scale profitably.',
          bold: true,
          italics: true,
          size: 28,
          color: COLORS.primary
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '— End of Meta Ads Plan —',
          italics: true,
          color: COLORS.secondary,
          size: 22
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 200 }
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
    ...generateStrategySection(data, metrics),
    ...generateCampaignSection(data),
    ...generateFunnelVisualization(data, metrics),
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
              top: convertInchesToTwip(0.75),
              right: convertInchesToTwip(0.75),
              bottom: convertInchesToTwip(0.75),
              left: convertInchesToTwip(0.75)
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

    const filename = `${data.client_name.replace(/\s+/g, '_')}_Meta_Ads_Plan_${
      new Date().toISOString().split('T')[0]
    }.docx`

    saveAs(blob, filename)
    return { success: true, filename }
  } catch (error) {
    console.error('Error generating warmap:', error)
    return { success: false, error: error.message }
  }
}
