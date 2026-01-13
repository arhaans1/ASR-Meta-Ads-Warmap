/**
 * Funnel type configuration presets
 */

export const FUNNEL_TYPES = {
  webinar: {
    id: 'webinar',
    name: 'Webinar Funnel',
    description: 'Registration → Attendance → Sale',
    icon: '🎥',
    useCase: 'Best for: Course launches, group programs, direct webinar sales'
  },
  webinar_to_call: {
    id: 'webinar_to_call',
    name: 'Webinar-to-Call Funnel',
    description: 'Registration → Attendance → Call → Sale',
    icon: '🎥📞',
    useCase: 'Best for: High-ticket with consultation, coaching programs'
  },
  direct_call: {
    id: 'direct_call',
    name: 'Direct Call Funnel',
    description: 'Opt-in → Call Booking → Sale',
    icon: '📞',
    useCase: 'Best for: Strategy calls, applications, lead magnets'
  }
}

/**
 * Get default values for a specific funnel type
 */
export function getDefaultsForFunnelType(funnelType) {
  const commonDefaults = {
    strategy_subtitle: 'Deep Event Optimization + Educational Layer Strategy',
    layer1_creatives_count: '10-12',
    layer1_objective: 'Conversions',
    layer1_daily_budget: 10000,
    layer2_enabled: true,
    layer2_creatives_count: '18-20',
    layer2_objective: 'ThruPlay (Video Views)',
    layer2_cost_per_view: 0.50,
    scaling_increment_percent: 20,
    scaling_frequency_days_min: 3,
    scaling_frequency_days_max: 4,
    target_roi: 2,
    funnel_platform: 'GoHighLevel (GHL)',
    tracking_tool: 'ZinoTrack'
  }

  switch (funnelType) {
    case 'webinar':
      return {
        ...commonDefaults,
        funnel_type: 'webinar',
        stage1_name: 'Webinar Registration',
        stage1_price: 0,
        stage1_is_paid: false,
        landing_page_conversion_rate: 7,
        stage2_name: 'Webinar Attendance',
        stage2_price: 0,
        stage2_is_paid: false,
        stage2_conversion_rate: 70,
        stage3_enabled: false,
        stage3_name: null,
        stage3_price: 0,
        stage3_is_paid: false,
        stage3_conversion_rate: null,
        stage4_enabled: false,
        stage4_name: null,
        stage4_conversion_rate: null,
        high_ticket_conversion_rate: 30,
        layer1_optimization_event: 'Registration'
      }

    case 'webinar_to_call':
      return {
        ...commonDefaults,
        funnel_type: 'webinar_to_call',
        stage1_name: 'Webinar Registration',
        stage1_price: 99,
        stage1_is_paid: true,
        landing_page_conversion_rate: 7,
        stage2_name: 'Webinar Attendance',
        stage2_price: 0,
        stage2_is_paid: false,
        stage2_conversion_rate: 70,
        stage3_enabled: true,
        stage3_name: '1-1 Call Booking',
        stage3_price: 999,
        stage3_is_paid: true,
        stage3_conversion_rate: 20,
        stage4_enabled: true,
        stage4_name: 'Call Attendance',
        stage4_conversion_rate: 80,
        high_ticket_conversion_rate: 30,
        layer1_optimization_event: 'Call Booking (₹999)'
      }

    case 'direct_call':
      return {
        ...commonDefaults,
        funnel_type: 'direct_call',
        stage1_name: 'Opt-In / Lead',
        stage1_price: 0,
        stage1_is_paid: false,
        landing_page_conversion_rate: 15,
        stage2_name: 'Call Booking',
        stage2_price: 0,
        stage2_is_paid: false,
        stage2_conversion_rate: 30,
        stage3_enabled: true,
        stage3_name: 'Call Attendance',
        stage3_price: 0,
        stage3_is_paid: false,
        stage3_conversion_rate: 80,
        stage4_enabled: false,
        stage4_name: null,
        stage4_conversion_rate: null,
        high_ticket_conversion_rate: 25,
        layer1_optimization_event: 'Call Booking'
      }

    default:
      return commonDefaults
  }
}

/**
 * Get form field configuration for a funnel type
 */
export function getFormFieldsForFunnelType(funnelType) {
  const commonFields = [
    { section: 'Client Info', fields: ['client_name', 'business_name'] },
    { section: 'Ad Spend', fields: ['current_daily_spend', 'target_daily_spend'] },
    { section: 'High Ticket', fields: ['high_ticket_price', 'high_ticket_conversion_rate'] },
    { section: 'Campaign', fields: ['layer1_creatives_count', 'layer2_creatives_count', 'layer2_cost_per_view'] },
    { section: 'Scaling', fields: ['scaling_increment_percent', 'scaling_frequency_days_min', 'scaling_frequency_days_max'] },
    { section: 'Tech', fields: ['funnel_platform', 'tracking_tool', 'target_roi'] }
  ]

  switch (funnelType) {
    case 'webinar':
      return [
        {
          section: 'Stage 1: Webinar Registration',
          fields: [
            'stage1_is_paid',
            'stage1_price',
            'landing_page_conversion_rate',
            'current_cpa_stage1',
            'cpa_stage1_at_scale',
            'cpa_stage1_kill_range'
          ]
        },
        {
          section: 'Stage 2: Webinar Attendance',
          fields: ['stage2_conversion_rate']
        },
        ...commonFields
      ]

    case 'webinar_to_call':
      return [
        {
          section: 'Stage 1: Webinar Registration',
          fields: [
            'stage1_is_paid',
            'stage1_price',
            'landing_page_conversion_rate',
            'current_cpa_stage1',
            'cpa_stage1_at_scale',
            'cpa_stage1_kill_range'
          ]
        },
        {
          section: 'Stage 2: Webinar Attendance',
          fields: ['stage2_conversion_rate']
        },
        {
          section: 'Stage 3: Call Booking',
          fields: ['stage3_is_paid', 'stage3_price', 'stage3_conversion_rate']
        },
        {
          section: 'Stage 4: Call Attendance',
          fields: ['stage4_conversion_rate']
        },
        ...commonFields
      ]

    case 'direct_call':
      return [
        {
          section: 'Stage 1: Opt-In / Lead',
          fields: [
            'stage1_is_paid',
            'stage1_price',
            'landing_page_conversion_rate',
            'current_cpa_stage1',
            'cpa_stage1_at_scale',
            'cpa_stage1_kill_range'
          ]
        },
        {
          section: 'Stage 2: Call Booking',
          fields: ['stage2_is_paid', 'stage2_price', 'stage2_conversion_rate']
        },
        {
          section: 'Stage 3: Call Attendance',
          fields: ['stage3_conversion_rate']
        },
        ...commonFields
      ]

    default:
      return commonFields
  }
}

/**
 * Field metadata for form rendering
 */
export const FIELD_METADATA = {
  client_name: { label: 'Client Name', type: 'text', required: true },
  business_name: { label: 'Business Name', type: 'text', required: true },

  current_daily_spend: { label: 'Current Daily Spend (₹)', type: 'number', required: true, min: 0 },
  target_daily_spend: { label: 'Target Daily Spend (₹)', type: 'number', required: true, min: 0 },

  stage1_is_paid: { label: 'Is Paid?', type: 'checkbox' },
  stage1_price: { label: 'Price (₹)', type: 'number', min: 0, conditional: 'stage1_is_paid' },
  landing_page_conversion_rate: { label: 'Landing Page Conversion Rate (%)', type: 'number', min: 0, max: 100 },
  current_cpa_stage1: { label: 'Current CPA (₹)', type: 'number', required: true, min: 0 },
  cpa_stage1_at_scale: { label: 'CPA at Scale (₹)', type: 'number', min: 0 },
  cpa_stage1_kill_range: { label: 'CPA Kill Range (₹)', type: 'number', required: true, min: 0 },

  stage2_is_paid: { label: 'Is Paid?', type: 'checkbox' },
  stage2_price: { label: 'Price (₹)', type: 'number', min: 0, conditional: 'stage2_is_paid' },
  stage2_conversion_rate: { label: 'Conversion Rate (%)', type: 'number', required: true, min: 0, max: 100 },

  stage3_is_paid: { label: 'Is Paid?', type: 'checkbox' },
  stage3_price: { label: 'Price (₹)', type: 'number', min: 0, conditional: 'stage3_is_paid' },
  stage3_conversion_rate: { label: 'Conversion Rate (%)', type: 'number', required: true, min: 0, max: 100 },

  stage4_conversion_rate: { label: 'Show-up Rate (%)', type: 'number', required: true, min: 0, max: 100 },

  high_ticket_price: { label: 'High Ticket Price (₹)', type: 'number', required: true, min: 0 },
  high_ticket_conversion_rate: { label: 'Conversion Rate (%)', type: 'number', required: true, min: 0, max: 100 },

  layer1_creatives_count: { label: 'Layer 1 Creatives Count', type: 'text' },
  layer2_creatives_count: { label: 'Layer 2 Creatives Count', type: 'text' },
  layer2_cost_per_view: { label: 'Layer 2 Cost Per View (₹)', type: 'number', min: 0 },

  scaling_increment_percent: { label: 'Scaling Increment (%)', type: 'number', min: 0, max: 100 },
  scaling_frequency_days_min: { label: 'Min Days Between Scaling', type: 'number', min: 1 },
  scaling_frequency_days_max: { label: 'Max Days Between Scaling', type: 'number', min: 1 },

  funnel_platform: { label: 'Funnel Platform', type: 'text' },
  tracking_tool: { label: 'Tracking Tool', type: 'text' },
  target_roi: { label: 'Target ROI', type: 'number', min: 0 }
}

/**
 * Sample data for testing
 */
export const SAMPLE_DATA = {
  webinar: {
    client_name: 'Rahul',
    business_name: 'Business Coaching',
    funnel_type: 'webinar',
    current_daily_spend: 5000,
    target_daily_spend: 30000,
    stage1_is_paid: true,
    stage1_price: 199,
    landing_page_conversion_rate: 8,
    current_cpa_stage1: 800,
    cpa_stage1_kill_range: 1500,
    stage2_conversion_rate: 65,
    high_ticket_price: 50000,
    high_ticket_conversion_rate: 25
  },

  webinar_to_call: {
    client_name: 'Shraddha',
    business_name: 'Fertility Coaching',
    funnel_type: 'webinar_to_call',
    current_daily_spend: 4000,
    target_daily_spend: 50000,
    stage1_is_paid: true,
    stage1_price: 99,
    landing_page_conversion_rate: 7,
    current_cpa_stage1: 600,
    cpa_stage1_kill_range: 2000,
    stage2_conversion_rate: 70,
    stage3_enabled: true,
    stage3_is_paid: true,
    stage3_price: 999,
    stage3_conversion_rate: 20,
    stage4_enabled: true,
    stage4_conversion_rate: 80,
    high_ticket_price: 89000,
    high_ticket_conversion_rate: 30
  },

  direct_call: {
    client_name: 'Priya',
    business_name: 'Executive Coaching',
    funnel_type: 'direct_call',
    current_daily_spend: 3000,
    target_daily_spend: 25000,
    stage1_is_paid: false,
    stage1_price: 0,
    landing_page_conversion_rate: 20,
    current_cpa_stage1: 150,
    cpa_stage1_kill_range: 400,
    stage2_is_paid: false,
    stage2_price: 0,
    stage2_conversion_rate: 25,
    stage3_enabled: true,
    stage3_conversion_rate: 75,
    high_ticket_price: 200000,
    high_ticket_conversion_rate: 20
  }
}
