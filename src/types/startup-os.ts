/**
 * STARTUP OS - Type Definitions
 *
 * El Operating System completo para founders
 */

// ============================================================================
// STRATEGY LAYER
// ============================================================================

export interface CompetitorSnapshot {
  id: string;
  competitor_id: string;
  captured_at: string;
  pricing: any;
  features: string[];
  screenshot_url?: string;
  changes_detected: string[];
  alert_sent: boolean;
}

export interface MarketIntelligence {
  id: string;
  project_id: string;
  trends_data: any;
  social_mentions: any;
  market_size: any;
  last_updated: string;
}

export interface OKR {
  id: string;
  project_id: string;
  objective: string;
  key_results: Array<{
    metric: string;
    target: number;
    current: number;
    unit: string;
  }>;
  quarter: string; // Q1 2026, Q2 2026, etc.
  status: 'on_track' | 'at_risk' | 'off_track';
  owner?: string;
}

// ============================================================================
// EXECUTION LAYER
// ============================================================================

export interface ContentIdea {
  id: string;
  title: string;
  type: 'blog_post' | 'twitter_thread' | 'linkedin_post' | 'video_script';
  keywords: string[];
  search_volume: number;
  seo_difficulty: 'easy' | 'medium' | 'hard';
  relevance_score: number;
  outline?: string[];
  status: 'idea' | 'draft' | 'published';
  scheduled_date?: string;
  ai_draft?: string;
}

export interface ContentCalendar {
  id: string;
  project_id: string;
  ideas: ContentIdea[];
  created_at: string;
}

export interface LaunchChecklistItem {
  id: string;
  category: 'legal' | 'tech' | 'marketing' | 'design' | 'analytics' | 'finance';
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'done';
  resources: Array<{
    title: string;
    url: string;
  }>;
  estimated_time?: string;
  dependencies?: string[]; // IDs of other items
}

export interface LaunchChecklist {
  id: string;
  project_id: string;
  items: LaunchChecklistItem[];
  progress: number; // 0-100
  estimated_launch_date?: string;
}

export interface BetaTester {
  id: string;
  project_id: string;
  name: string;
  email: string;
  company?: string;
  role?: string;
  invited_at: string;
  signed_up_at?: string;
  feedback_submitted_at?: string;
  feedback?: string;
  rating?: number; // 1-5
  testimonial_draft?: string;
  testimonial_approved?: boolean;
}

// ============================================================================
// METRICS LAYER
// ============================================================================

export interface FinancialProjection {
  id: string;
  project_id: string;
  year: number;
  month: number;

  // Revenue
  revenue: number;
  mrr?: number;
  new_customers: number;
  churned_customers: number;

  // Costs
  cogs: number; // Cost of Goods Sold
  payroll: number;
  marketing_spend: number;
  infrastructure: number;
  other_costs: number;

  // Calculated
  gross_profit: number;
  gross_margin: number;
  net_profit: number;
  cash_balance: number;
  burn_rate: number;
  runway_months: number;
}

export interface KeyMetrics {
  id: string;
  project_id: string;
  date: string;

  // Growth
  mrr: number;
  arr: number;
  mrr_growth_rate: number; // percentage

  // Customers
  total_customers: number;
  new_customers: number;
  churned_customers: number;
  churn_rate: number; // percentage

  // Economics
  cac: number; // Customer Acquisition Cost
  ltv: number; // Lifetime Value
  ltv_cac_ratio: number;

  // Engagement
  dau?: number; // Daily Active Users
  mau?: number; // Monthly Active Users

  // Financial
  cash_balance: number;
  burn_rate: number;
  runway_months: number;
}

export interface MetricAlert {
  id: string;
  project_id: string;
  metric: string;
  threshold: number;
  operator: 'above' | 'below';
  current_value: number;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  created_at: string;
  acknowledged: boolean;
}

// ============================================================================
// INTELLIGENCE LAYER
// ============================================================================

export interface AIRecommendation {
  id: string;
  project_id: string;
  category: 'pricing' | 'marketing' | 'product' | 'hiring' | 'fundraising';
  title: string;
  description: string;
  reasoning: string;
  confidence: number; // 0-100
  priority: 'critical' | 'high' | 'medium' | 'low';
  data_sources: string[]; // What data was used to make this recommendation
  action_items: string[];
  created_at: string;
  dismissed: boolean;
  implemented: boolean;
}

export interface WeeklyInsight {
  id: string;
  project_id: string;
  week_start: string;
  week_end: string;

  summary: string;

  highlights: string[]; // Good news
  concerns: string[]; // Red flags

  competitor_changes: Array<{
    competitor: string;
    change: string;
    impact: 'high' | 'medium' | 'low';
  }>;

  recommendations: AIRecommendation[];

  next_week_priorities: string[];

  sent_at?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  sources?: Array<{
    type: 'metric' | 'competitor' | 'market_research' | 'okr';
    data: any;
  }>;
}

export interface AdvisorChat {
  id: string;
  project_id: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

// ============================================================================
// STARTUP OS MAIN INTERFACE
// ============================================================================

export interface StartupOS {
  project_id: string;

  // Strategy
  okrs: OKR[];
  market_intelligence: MarketIntelligence;
  competitor_snapshots: CompetitorSnapshot[];

  // Execution
  content_calendar: ContentCalendar;
  launch_checklist: LaunchChecklist;
  beta_testers: BetaTester[];

  // Metrics
  financial_projections: FinancialProjection[];
  key_metrics: KeyMetrics[];
  metric_alerts: MetricAlert[];

  // Intelligence
  ai_recommendations: AIRecommendation[];
  weekly_insights: WeeklyInsight[];
  advisor_chat: AdvisorChat;

  // Meta
  last_updated: string;
  health_score: number; // 0-100, overall health of startup
}

// ============================================================================
// DASHBOARD VIEWS
// ============================================================================

export type StartupOSView =
  | 'overview'
  | 'strategy'
  | 'execution'
  | 'metrics'
  | 'intelligence';

export interface DashboardConfig {
  view: StartupOSView;
  widgets: Array<{
    id: string;
    type: string;
    position: { x: number; y: number; w: number; h: number };
    config: any;
  }>;
}
