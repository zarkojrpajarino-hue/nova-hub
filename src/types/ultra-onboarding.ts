/**
 * ULTRA PERSONALIZED ONBOARDING TYPES
 */

export type OnboardingType = 'generative' | 'idea' | 'existing';

export type OnboardingPhase = 'essentials' | 'deep_dive' | 'continuous';

export interface OnboardingSession {
  id: string;
  project_id: string;
  onboarding_type: OnboardingType;
  phase: OnboardingPhase;
  completion_percentage: number;
  answers: Record<string, unknown>;

  // Geo-Intelligence (Capa 1)
  location_city?: string;
  location_country?: string;
  location_coordinates?: { lat: number; lng: number };
  target_market?: string[];

  // Founder Profiling (Capa 3)
  founder_background?: string;
  founder_skills?: string[];
  linkedin_data?: Record<string, unknown>;

  // Collaborative (Capa 7)
  has_cofounder: boolean;
  cofounder_session_id?: string;
  alignment_score?: number;

  started_at: string;
  completed_at?: string;
  updated_at: string;
}

export interface GeoIntelligence {
  location_key: string;
  local_competitors: LocalCompetitor[];
  local_investors: LocalInvestor[];
  operational_costs: OperationalCosts;
  regulations: Regulation[];
  local_events: LocalEvent[];
  accelerators: Accelerator[];
  grants: Grant[];
  market_size: MarketSize;
  cost_of_living: number;
  insights: string[];
  last_updated: string;
}

export interface LocalCompetitor {
  name: string;
  description: string;
  size: string;
  funding: string;
  url: string;
}

export interface LocalInvestor {
  name: string;
  type: 'VC' | 'Angel' | 'Accelerator';
  fund_size: string;
  notable_investments: string[];
  focus_areas: string[];
  contact: string;
}

export interface OperationalCosts {
  dev_salary_min: number;
  dev_salary_max: number;
  marketing_salary_min: number;
  marketing_salary_max: number;
  sales_salary_min: number;
  sales_salary_max: number;
  coworking_monthly: number;
  office_sqm_monthly: number;
  currency: 'EUR' | 'USD' | 'GBP';
}

export interface Regulation {
  title: string;
  description: string;
  impact: 'critical' | 'important' | 'minor';
  deadline?: string;
}

export interface LocalEvent {
  name: string;
  type: 'conference' | 'meetup' | 'hackathon';
  frequency: 'monthly' | 'quarterly' | 'annual';
  url: string;
}

export interface Accelerator {
  name: string;
  ticket_size: string;
  duration: string;
  focus: string;
  application_url: string;
}

export interface Grant {
  name: string;
  amount: string;
  type: 'non-dilutive' | 'loan' | 'equity';
  eligibility: string;
  url: string;
}

export interface MarketSize {
  population: number;
  gdp_per_capita: number;
  startup_ecosystem_rank: number;
  description: string;
}

// GENERATIVE ONBOARDING
export interface BusinessOption {
  title: string;
  description: string;
  fit_score: number;
  reasoning: string;
  business_model: {
    type: string;
    target_customer: string;
    value_proposition: string;
    revenue_model: string;
  };
  pros: string[];
  cons: string[];
  financial_projections: {
    initial_investment: number;
    monthly_costs: number;
    breakeven_months: number;
    year_1_revenue: number;
    year_1_profit: number;
    scalability: 'high' | 'medium' | 'low';
  };
  implementation_roadmap: RoadmapPhase[];
  competitive_landscape: {
    main_competitors: string[];
    your_differentiation: string;
  };
  risks: Risk[];
  first_steps: string[];
}

export interface RoadmapPhase {
  phase: string;
  duration_weeks: number;
  key_tasks: string[];
  deliverable: string;
}

export interface Risk {
  risk: string;
  severity: 'high' | 'medium' | 'low';
  mitigation: string;
}

// IDEA ONBOARDING
export interface CompetitiveAnalysis {
  competitors: Competitor[];
  swot: SWOT;
  market_gaps: MarketGap[];
  competitive_positioning: {
    your_unique_value: string;
    target_segment: string;
    why_customers_will_switch: string;
    pricing_strategy: string;
    barriers_to_entry: string[];
  };
  recommended_strategy: {
    positioning: string;
    differentiation: string[];
    go_to_market: {
      phase_1: GTMPhase;
      phase_2: GTMPhase;
    };
    david_vs_goliath_tactics: string[];
  };
  red_flags: RedFlag[];
  key_questions_to_validate: string[];
}

export interface Competitor {
  name: string;
  type: 'direct' | 'indirect' | 'substitute';
  url: string;
  description: string;
  size: {
    valuation?: string;
    employees?: string;
    customers?: string;
    revenue?: string;
  };
  pricing: {
    model: string;
    price_range: string;
    details: string;
  };
  strengths: string[];
  weaknesses: string[];
  market_position: 'Leader' | 'Challenger' | 'Niche player';
  threat_level: 'high' | 'medium' | 'low';
}

export interface SWOT {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface MarketGap {
  gap: string;
  opportunity_score: number;
  reasoning: string;
  how_to_exploit: string;
  validation_needed: string;
}

export interface GTMPhase {
  focus: string;
  channels: string[];
  timeline: string;
  success_metrics?: string[];
}

export interface RedFlag {
  flag: string;
  severity: 'critical' | 'important' | 'minor';
  what_to_do: string;
}

// EXISTING ONBOARDING
export interface GrowthPlaybook {
  diagnosis: {
    actual_bottleneck: string;
    founder_was_right: boolean;
    explanation: string;
    health_score: number;
    critical_issues: CriticalIssue[];
    current_phase_assessment: string;
  };
  action_plan: ActionItem[];
  scenarios: {
    status_quo: Scenario;
    fix_retention?: Scenario;
    growth_mode?: Scenario;
  };
  benchmarks_vs_industry: {
    your_metrics: Record<string, unknown>;
    industry_average: Record<string, unknown>;
    best_in_class: Record<string, unknown>;
    your_standing: string;
  };
  key_metrics: string[];
  quick_wins: QuickWin[];
  when_to_fundraise: {
    ready_now: boolean;
    reasoning: string;
    milestones_needed: string[];
    recommended_amount: string;
    what_to_use_it_for: string;
  };
}

export interface CriticalIssue {
  issue: string;
  severity: 'critical' | 'important' | 'minor';
  impact: string;
  evidence: string;
}

export interface ActionItem {
  priority: number;
  category: 'retention' | 'acquisition' | 'product' | 'ops' | 'fundraising';
  action: string;
  reasoning: string;
  expected_impact: string;
  timeline: string;
  steps: ActionStep[];
  resources_needed: {
    budget: number;
    people: string;
    tools: string[];
  };
  success_metrics: string[];
}

export interface ActionStep {
  step: string;
  owner: string;
  duration: string;
  deliverable: string;
}

export interface Scenario {
  description: string;
  month_3_mrr: number;
  month_6_mrr: number;
  month_12_mrr: number;
  key_assumption: string;
  value_vs_status_quo?: string;
  required_investment?: number;
  warning?: string;
}

export interface QuickWin {
  win: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
}

// COFOUNDER ALIGNMENT
export interface CofounderAlignment {
  alignment_score: number;
  vision_alignment: number;
  strategy_alignment: number;
  commitment_alignment: number;
  values_alignment: number;
  misalignments: Misalignment[];
  discussion_topics: DiscussionTopic[];
  recommendations: {
    overall_verdict: 'proceed_with_caution' | 'strong_partnership' | 'high_risk' | 'recommend_split';
    reasoning: string;
    if_proceed?: {
      immediate_actions: string[];
      topics_to_codify: string[];
    };
    red_flags: RedFlag[];
    green_flags: string[];
  };
  compatibility_strengths: string[];
  suggested_exercises: Exercise[];
}

export interface Misalignment {
  category: 'vision' | 'strategy' | 'commitment' | 'values';
  severity: 'critical' | 'important' | 'minor';
  topic: string;
  founder_a_position: string;
  founder_b_position: string;
  impact: string;
  why_it_matters: string;
}

export interface DiscussionTopic {
  topic: string;
  question: string;
  sub_questions: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  reasoning: string;
}

export interface Exercise {
  exercise: string;
  description: string;
  goal: string;
  duration: string;
}

// LEARNING PATH
export interface LearningPath {
  skill_gaps: string[];
  resources: LearningResource[];
  learning_roadmap: {
    phase_1_immediate: LearningPhase;
    phase_2_building: LearningPhase;
    phase_3_growth: LearningPhase;
  };
  skills_you_already_have: ExistingSkill[];
  recommended_mentors: MentorProfile[];
  common_mistakes_to_avoid: string[];
}

export interface LearningResource {
  id: string;
  title: string;
  type: 'book' | 'course' | 'video' | 'article' | 'tool';
  url: string;
  skill: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimated_time: string;
  cost: string;
  reasoning: string;
  key_takeaways: string[];
  when_to_do_it: string;
  how_to_apply: string;
}

export interface LearningPhase {
  duration: string;
  focus: string;
  resources: string[];
  outcome: string;
}

export interface ExistingSkill {
  skill: string;
  why_valuable: string;
}

export interface MentorProfile {
  name: string;
  why: string;
  where_to_find: string;
}

// ═══════════════════════════════════════════════════════════
// PHASE 1: QUICK WINS - NEW TYPES
// ═══════════════════════════════════════════════════════════

// 1.1 Reality Check & Commitment
export interface RealityCheckAnswers {
  time_commitment: 'full_time' | 'part_time' | 'side_project';
  hours_per_week: number;
  financial_runway_months: number;
  is_first_startup: boolean;
  entrepreneurial_experience: 'first_time' | 'failed_before' | 'sold_before' | 'serial';
  family_support: 'full_support' | 'neutral' | 'have_doubts' | 'not_applicable';
  competition_for_attention: Array<'full_time_job' | 'freelancing' | 'other_projects' | 'family_kids' | 'studying' | 'nothing'>;
  willing_to_work_60h_weeks: boolean;
  can_handle_public_failure: boolean;
}

// 1.2 Team Structure & Co-founder
export interface TeamStructure {
  mode: 'solo' | 'has_1_cofounder' | 'has_2plus_cofounders' | 'seeking_cofounder';
  cofounder_emails?: string[];
  cofounder_session_ids?: string[];
  cofounder_alignment_score?: number;
  roles_defined: boolean;
  equity_split_agreed?: boolean;
}

export interface CofounderInvite {
  id: string;
  onboarding_session_id: string;
  sender_email: string;
  invitee_email: string;
  status: 'pending' | 'accepted' | 'rejected';
  invite_token: string;
  sent_at: string;
  expires_at: string;
  accepted_at?: string;
}

// 1.3 Exit Strategy & Goals
export interface GoalsAndStrategy {
  final_goal: 'lifestyle_business' | 'acquisition' | 'ipo_unicorn' | 'social_impact' | 'experiment_learn';
  funding_strategy: 'bootstrap' | 'raise_seed' | 'raise_series_a' | 'not_sure';
  fundraise_timeline?: 'next_3_months' | '6_12_months' | 'after_traction';
  target_revenue_annual?: number;
  exit_timeline_years?: number;
  why_this_matters: string;
}

// 1.4 Motivational Context
export interface EmotionalContext {
  why_entrepreneurship: Array<
    'financial_freedom' |
    'time_location_freedom' |
    'solve_frustrating_problem' |
    'social_impact' |
    'build_legacy' |
    'escape_corporate' |
    'make_money' |
    'prove_myself' |
    'work_on_passion' |
    'other'
  >;
  personal_pain_point?: string;
  passion_level: number; // 1-10
  main_motivation: string;
}

// ═══════════════════════════════════════════════════════════
// PHASE 2: PERSONALIZATION BOOST - NEW TYPES
// ═══════════════════════════════════════════════════════════

// 2.1 Founder-Idea Fit (IDEA type)
export interface FounderIdeaFit {
  unfair_advantages: Array<
    'industry_experience' |
    'know_problem_personally' |
    'access_early_adopters' |
    'network_in_industry' |
    'unique_technical_skills' |
    'capital_to_invest' |
    'complementary_cofounder' |
    'none'
  >;
  years_industry_experience?: number;
  access_to_early_adopters: 'yes_20plus' | 'yes_5_10' | 'can_get_access' | 'no_cold_start';
  domain_expertise_level: 'expert' | 'intermediate' | 'beginner' | 'none';
  personal_connection_to_problem: string;
}

// 2.2 Current Validation Status (IDEA type)
export interface ValidationStatus {
  validation_completed: Array<
    'talked_5_10_people' |
    'talked_20plus' |
    'have_landing_page' |
    'have_waitlist' |
    'have_mvp' |
    'have_beta_users' |
    'someone_paid' |
    'nothing'
  >;
  waitlist_signups?: number;
  beta_users_count?: number;
  revenue_to_date?: number;
  interviews_completed?: number;
  validation_stage: 'idea_only' | 'problem_validated' | 'solution_validated' | 'has_traction';
}

// 2.3 Timing Analysis (IDEA type)
export interface TimingAnalysis {
  why_now_factors: Array<
    'new_technology' |
    'regulatory_change' |
    'consumer_behavior_shift' |
    'global_crisis_event' |
    'competitor_failed' |
    'new_platform' |
    'nothing_specific'
  >;
  timing_explanation: string;
  window_of_opportunity_years?: number;
  competitive_timing: 'too_early' | 'perfect' | 'late' | 'too_late';
  market_timing?: 'perfect_timing' | 'good_timing' | 'early' | 'late';
  market_catalysts?: Array<
    'tech_breakthrough' |
    'regulation_change' |
    'behavior_shift' |
    'market_gap' |
    'cost_decrease' |
    'demographic_shift'
  >;
}

// 2.4 Industry-Specific Context
export type Industry =
  | 'saas_b2b'
  | 'saas_b2c'
  | 'marketplace'
  | 'ecommerce'
  | 'services_agency'
  | 'hardware_iot'
  | 'fintech'
  | 'healthtech'
  | 'edtech'
  | 'content_media'
  | 'other';

export interface SaaSSpecificAnswers {
  pricing_model: 'per_seat' | 'usage_based' | 'flat_fee' | 'freemium';
  motion: 'product_led' | 'sales_led' | 'hybrid';
  contract_length: 'monthly' | 'annual' | 'multi_year';
  acv_target: 'smb' | 'mid_market' | 'enterprise';
  target_acv_amount?: number;
}

export interface MarketplaceSpecificAnswers {
  marketplace_type: 'product' | 'service' | 'rental';
  chicken_egg_strategy: 'start_supply' | 'start_demand' | 'fake_supply' | 'not_sure';
  take_rate_target: number;
  supply_side_acquisition: string;
  demand_side_acquisition: string;
}

export interface EcommerceSpecificAnswers {
  product_type: 'physical' | 'digital' | 'both';
  average_order_value: number;
  repeat_purchase_rate_target: number;
  inventory_model: 'hold_inventory' | 'dropshipping' | 'print_on_demand';
  customer_acquisition_channel: string[];
}

export type IndustrySpecificAnswers =
  | SaaSSpecificAnswers
  | MarketplaceSpecificAnswers
  | EcommerceSpecificAnswers
  | Record<string, unknown>;

// ═══════════════════════════════════════════════════════════
// PHASE 3: ADVANCED ANALYSIS - NEW TYPES
// ═══════════════════════════════════════════════════════════

// 3.1 Deep Unit Economics (EXISTING type)
export interface DeepMetrics {
  cac_payback_period_months: number;
  cohort_retention_6_months: number;
  net_revenue_retention: number;
  magic_number: number;
  rule_of_40_score: number;
  gross_margin_percent: number;
  sales_efficiency: number;
}

// 3.2 Product-Market Fit Score (EXISTING type)
export interface PMFAssessment {
  very_disappointed_percent: number;
  somewhat_disappointed_percent: number;
  not_disappointed_percent: number;
  has_pmf: boolean;
  nps_score?: number;
  pmf_confidence_level: 'strong' | 'moderate' | 'weak' | 'none';
  retention_signal?: 'high_retention' | 'growing' | 'stable' | 'declining';
  organic_growth?: 'high_viral' | 'some_organic' | 'mostly_paid' | 'no_organic';
  user_love_signal?: 'evangelists' | 'positive' | 'neutral' | 'complaints';
  market_pull?: 'strong_pull' | 'some_pull' | 'push_needed' | 'no_pull';
}

// 3.3 Competitive Dynamics (EXISTING type)
export interface CompetitiveLandscape {
  top_competitor_name: string;
  why_winning: string;
  recent_funding_events: FundingEvent[];
  what_they_do_better: string;
  what_you_do_better: string;
  industry_trend: string;
  threat_level: 'existential' | 'significant' | 'moderate' | 'low';
}

export interface FundingEvent {
  company: string;
  amount: number;
  round: string;
  date: string;
  lead_investor: string;
}

// 3.4 Moat Analysis
export interface MoatAnalysis {
  moat_types: Array<
    'network_effects' |
    'switching_costs' |
    'proprietary_data' |
    'data_moat' |
    'brand' |
    'regulatory' |
    'patents_ip' |
    'ip_patents' |
    'economies_of_scale' |
    'none'
  >;
  time_to_replicate_months: number;
  moat_strength_score: number; // 0-100
  defensibility_level: 'strong' | 'moderate' | 'weak' | 'none';
  moat_building_plan?: string[];
  copyability?: 'impossible' | 'hard' | 'medium' | 'easy';
  time_to_moat?: 'already' | '6_months' | '12_months' | '24_plus';
  moat_building_strategy?: string;
  biggest_vulnerability?: string;
}

// 3.5 Network Access
export interface NetworkAccess {
  industry_connections: 'work_in_industry' | 'have_network' | 'second_degree' | 'cold_start';
  early_adopter_access: 'know_50plus' | 'know_10_20' | 'less_than_10' | 'none';
  has_advisors: boolean;
  knows_influencers: 'close_relationship' | 'can_activate' | 'none';
  network_score: number; // 0-100
  network_level: 'fast_track' | 'viable' | 'hard_mode';
  has_access_to?: Array<'angel_investors' | 'industry_experts' | 'potential_customers' | 'technical_cofounders' | 'accelerators' | 'media_press' | 'strategic_partners'>;
  network_notes?: string;
}

// 3.6 Fundraising History (EXISTING type)
export interface FundraisingHistory {
  has_raised: boolean;
  funding_stage?: 'bootstrapped' | 'friends_family' | 'angel' | 'seed' | 'series_a_plus';
  amount_raised?: number;
  investors?: string[];
  last_round_date?: string;
  runway_months?: number;
  investor_pressure_level?: 'high' | 'moderate' | 'none';
  funding_impact_on_strategy: string;
}

// 3.7 Team Dynamics (EXISTING type)
export interface TeamBreakdown {
  engineering_count: number;
  product_count: number;
  sales_count: number;
  marketing_count: number;
  customer_success_count: number;
  operations_count: number;
  engineering_velocity: number; // features per week
  sales_productivity: number; // deals per rep per month
  cs_productivity: number; // customers per CS rep
  team_health_score: number; // 0-100
  tech_capability?: 'strong_inhouse' | 'some_tech' | 'outsourced' | 'no_code';
  business_capability?: 'experienced' | 'learning' | 'hired_experts';
  growth_capability?: string;
  team_gaps?: string;
}

// ═══════════════════════════════════════════════════════════
// PHASE 4: UX POLISH - NEW TYPES
// ═══════════════════════════════════════════════════════════

export interface DetectedRedFlag {
  id: string;
  flag_type: string;
  severity: 'critical' | 'important' | 'minor';
  description: string;
  why_risky: string;
  recommendation: string;
  acknowledged: boolean;
}

export interface FirstTimerWarning {
  warning_type: string;
  trigger: string;
  message: string;
  better_approach: string;
  show_in_step: string;
}

// ═══════════════════════════════════════════════════════════
// EXTENDED ONBOARDING SESSION
// ═══════════════════════════════════════════════════════════

export interface ExtendedOnboardingSession extends OnboardingSession {
  // Phase 1
  reality_check?: RealityCheckAnswers;
  team_structure?: TeamStructure;
  goals_and_strategy?: GoalsAndStrategy;
  emotional_context?: EmotionalContext;

  // Phase 2
  founder_idea_fit?: FounderIdeaFit;
  validation_status?: ValidationStatus;
  timing_analysis?: TimingAnalysis;
  industry?: Industry;
  industry_specific_answers?: IndustrySpecificAnswers;

  // Phase 3
  deep_metrics?: DeepMetrics;
  pmf_assessment?: PMFAssessment;
  competitive_landscape?: CompetitiveLandscape;
  moat_analysis?: MoatAnalysis;
  network_access?: NetworkAccess;
  fundraising_history?: FundraisingHistory;
  team_breakdown?: TeamBreakdown;

  // Phase 4
  detected_red_flags?: DetectedRedFlag[];
  first_timer_warnings?: FirstTimerWarning[];
}

// ═══════════════════════════════════════════════════════════
// MISSING TYPES - Added to fix TypeScript imports
// ═══════════════════════════════════════════════════════════

// YourWhy - Emotional context / motivation step
export interface YourWhy {
  primary_motivation: 'solve_problem' | 'financial_freedom' | 'autonomy' | 'impact' | 'challenge' | 'prove_myself' | 'other';
  personal_story: string;
  problem_passion: string;
  who_benefits: string;
  success_vision: string;
}

// YourEdge - Founder unfair advantages step
export interface YourEdge {
  unfair_advantages: Array<'domain_expertise' | 'network' | 'technical' | 'audience' | 'insider_knowledge' | 'unfair_access' | 'capital'>;
  unique_insight: string;
  why_you_specifically: string;
  secret_weapon?: string;
}

// CurrentTraction - Validation status & early traction
export interface CurrentTraction {
  current_stage: 'pre_idea' | 'idea_stage' | 'validating' | 'mvp_built' | 'early_traction' | 'revenue' | 'scaling';
  validation_completed: string[];
  total_users?: number;
  active_users?: number;
  paying_customers?: number;
  monthly_revenue?: number;
  waitlist_size?: number;
  growth_trend: 'flat' | 'growing' | 'declining' | 'hockey_stick';
}

// IndustrySelection - Industry vertical selection
export interface IndustrySelection {
  industry_vertical: 'saas_b2b' | 'ecommerce' | 'consumer_app' | 'health_wellness' | 'education_edtech' | 'fintech' | 'travel_hospitality' | 'real_estate_proptech' | 'professional_services' | 'other';
  industry_notes?: string;
}

// SaaSB2BAnswers - SaaS B2B specific answers
export interface SaaSB2BAnswers {
  icp_description: string;
  target_company_size: 'smb' | 'mid_market' | 'enterprise' | 'all';
  annual_contract_value?: number;
  pricing_model: 'per_seat' | 'usage_based' | 'flat_rate' | 'freemium' | 'other';
  has_freemium: boolean;
  growth_motion: 'product_led' | 'sales_led' | 'marketing_led' | 'hybrid';
  sales_cycle_length: 'days' | 'weeks' | 'months' | 'quarters';
}

// EcommerceAnswers - Ecommerce specific answers
export interface EcommerceAnswers {
  business_model: 'b2c_owned' | 'marketplace_seller' | 'dropshipping' | 'd2c_brand' | 'subscription_box';
  product_category: string;
  average_order_value?: number;
  cost_of_goods?: number;
  shipping_cost?: number;
  target_margin?: number;
  fulfillment_strategy: 'self_fulfill' | 'third_party_3pl' | 'dropship' | 'print_on_demand';
  acquisition_channel: 'paid_social' | 'seo_content' | 'influencer' | 'marketplace' | 'email' | 'referral';
}

// ConsumerAppAnswers - Consumer app specific answers
export interface ConsumerAppAnswers {
  platforms: Array<'ios' | 'android' | 'web' | 'all'>;
  monetization_model: 'freemium' | 'subscription' | 'ads' | 'in_app_purchases' | 'transaction_fee' | 'free_first';
  engagement_loop: string;
  retention_driver: 'habit_building' | 'content' | 'social' | 'utility' | 'progress';
  target_dau_mau?: number;
  viral_mechanism: 'word_of_mouth' | 'invite_system' | 'content_sharing' | 'network_effects' | 'no_viral';
  target_k_factor?: number;
  target_cpi?: number;
  target_arpu?: number;
}

// HealthWellnessAnswers - Health & Wellness specific answers
export interface HealthWellnessAnswers {
  health_category: 'mental_health' | 'fitness' | 'nutrition' | 'telemedicine' | 'sleep';
  requires_hipaa?: boolean;
  requires_gdpr?: boolean;
  needs_medical_certification?: boolean;
  distribution_channel: 'b2c_direct' | 'b2b2c_employers' | 'b2b2c_insurance' | 'healthcare_providers';
  clinical_evidence: string;
}

// EdTechAnswers - EdTech specific answers
export interface EdTechAnswers {
  target_audience: 'k12_students' | 'university' | 'professionals' | 'lifelong_learners' | 'teachers';
  edtech_model: 'b2c_direct' | 'b2b_schools' | 'b2b_corporate' | 'marketplace';
  content_source: 'proprietary' | 'instructor_created' | 'ai_generated' | 'user_generated';
  learning_format: string;
  certification_type: 'accredited' | 'platform_certificate' | 'skills_only';
  target_completion_rate?: number;
}

// FinTechAnswers - FinTech specific answers
export interface FinTechAnswers {
  fintech_category: 'payments' | 'banking' | 'lending' | 'investing' | 'insurance' | 'crypto' | 'accounting';
  licensing_strategy: 'partner_bank' | 'own_license' | 'no_license';
  regulations: Array<'PSD2' | 'KYC_AML' | 'SOC2' | 'PCI_DSS' | 'GDPR'>;
  revenue_model: 'transaction_fee' | 'subscription' | 'interchange' | 'interest' | 'aum_fee';
  unit_economics_explanation: string;
}

// TravelHospitalityAnswers - Travel & Hospitality specific answers
export interface TravelHospitalityAnswers {
  travel_category: 'accommodations' | 'flights' | 'experiences' | 'full_package' | 'travel_tech';
  business_model: 'aggregator' | 'own_inventory' | 'marketplace' | 'saas_b2b';
  revenue_model: 'commission' | 'booking_fee' | 'subscription' | 'markup';
  average_commission_rate?: number;
  average_booking_value?: number;
  supply_strategy: string;
}

// RealEstatePropTechAnswers - Real Estate / PropTech specific answers
export interface RealEstatePropTechAnswers {
  proptech_category: 'marketplace' | 'property_management' | 'ibuyer' | 'rentals' | 'construction_tech' | 'agent_tools';
  target_market: 'residential_buyers' | 'investors' | 'agents' | 'landlords' | 'developers';
  revenue_model: 'commission' | 'subscription' | 'lead_gen' | 'transaction_fee' | 'spread';
  competitive_advantage: string;
  geographic_focus: string;
}

// ProfessionalServicesAnswers - Professional Services specific answers
export interface ProfessionalServicesAnswers {
  service_type: 'consulting' | 'agency' | 'fractional' | 'freelance_marketplace' | 'training' | 'legal_accounting';
  target_client: 'startups' | 'smbs' | 'mid_market' | 'enterprise';
  pricing_models: Array<'hourly' | 'project_based' | 'retainer' | 'value_based' | 'commission'>;
  hourly_rate?: number;
  average_project_value?: number;
  sales_motion: 'inbound' | 'outbound' | 'referrals_only' | 'partnerships' | 'platform_marketplace';
  scalability: 'productized' | 'custom_scaling' | 'software_enabled' | 'marketplace_model';
  differentiation: string;
}
