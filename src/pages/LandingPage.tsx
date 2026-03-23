/**
 * Landing Page — OPTIMUS-K
 *
 * Desktop OS aesthetic inspired by PostHog.
 * Simulates a founder's desktop with app windows, icons and dock.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Check,
  BarChart3,
  Target,
  Users,
  Zap,
  Shield,
  TrendingUp,
  Layers,
  Sparkles,
  LayoutDashboard,
  Briefcase,
  Wallet,
  Bot,
  Settings,
  FileText,
  CreditCard,
  Play,
  User,
  GraduationCap,
  Compass,
  FolderKanban,
  CheckCircle,
  Rocket,
  Brain,
  Video,
  Wrench,
  LineChart,
  Award,
} from 'lucide-react';
import { ThemeToggle, LanguageToggle } from '@/components/ui/theme-toggle';
import { OsWindow } from '@/components/ui/os-window';
import { cn } from '@/lib/utils';

// Desktop icons (left side)
const DESKTOP_ICONS = [
  { Icon: LayoutDashboard, labelKey: 'landing.iconDashboard' },
  { Icon: Briefcase, labelKey: 'landing.iconCRM' },
  { Icon: BarChart3, labelKey: 'landing.iconAnalytics' },
  { Icon: Target, labelKey: 'landing.iconOBV' },
  { Icon: Wallet, labelKey: 'landing.iconFinanciero' },
  { Icon: Bot, labelKey: 'landing.iconAI' },
  { Icon: Users, labelKey: 'landing.iconTeam' },
  { Icon: Settings, labelKey: 'landing.iconSettings' },
];

// Dock items (right side)
const DOCK_ITEMS = [
  { Icon: FileText, href: '#features', labelKey: 'landing.dockDocs' },
  { Icon: CreditCard, href: '#pricing', labelKey: 'landing.dockPricing' },
  { Icon: Play, href: '/auth?tab=signup', labelKey: 'landing.dockDemo' },
];

// Phase tabs
const PHASES = [
  { id: 'exploration', labelKey: 'landing.phaseExploration' },
  { id: 'validation', labelKey: 'landing.phaseValidation' },
  { id: 'growth', labelKey: 'landing.phaseGrowth' },
  { id: 'scale', labelKey: 'landing.phaseScale' },
] as const;

type PhaseId = (typeof PHASES)[number]['id'];

// Apps per phase
const PHASE_APPS: Record<PhaseId, { Icon: typeof LayoutDashboard; labelKey: string }[]> = {
  exploration: [
    { Icon: LayoutDashboard, labelKey: 'landing.appDashboard' },
    { Icon: User, labelKey: 'landing.appMiEspacio' },
    { Icon: GraduationCap, labelKey: 'landing.appMiDesarrollo' },
    { Icon: Compass, labelKey: 'landing.appRoleExploration' },
  ],
  validation: [
    { Icon: FolderKanban, labelKey: 'landing.appProyectos' },
    { Icon: CheckCircle, labelKey: 'landing.appValidaciones' },
    { Icon: Target, labelKey: 'landing.appOBVCenter' },
    { Icon: BarChart3, labelKey: 'landing.appKPIs' },
  ],
  growth: [
    { Icon: Rocket, labelKey: 'landing.appStartupOS' },
    { Icon: Briefcase, labelKey: 'landing.appCRM' },
    { Icon: Wallet, labelKey: 'landing.appFinanciero' },
    { Icon: Brain, labelKey: 'landing.appAIAnalysis' },
  ],
  scale: [
    { Icon: Video, labelKey: 'landing.appMeetingIntel' },
    { Icon: Wrench, labelKey: 'landing.appFounderToolkit' },
    { Icon: LineChart, labelKey: 'landing.appAnalytics' },
    { Icon: Award, labelKey: 'landing.appRankings' },
  ],
};

export default function LandingPage() {
  const { t } = useTranslation();
  const [activePhase, setActivePhase] = useState<PhaseId>('exploration');

  const paths = [
    {
      icon: Layers,
      title: t('landing.path1Title'),
      desc: t('landing.path1Desc'),
      items: t('landing.path1Items', { returnObjects: true }) as string[],
      cta: t('landing.path1Cta'),
      highlight: true,
    },
    {
      icon: Target,
      title: t('landing.path2Title'),
      desc: t('landing.path2Desc'),
      items: t('landing.path2Items', { returnObjects: true }) as string[],
      cta: t('landing.path2Cta'),
      highlight: false,
    },
    {
      icon: Sparkles,
      title: t('landing.path3Title'),
      desc: t('landing.path3Desc'),
      items: t('landing.path3Items', { returnObjects: true }) as string[],
      cta: t('landing.path3Cta'),
      highlight: false,
    },
  ];

  const features = [
    { icon: BarChart3, title: t('landing.feat1'), desc: t('landing.feat1Desc') },
    { icon: TrendingUp, title: t('landing.feat2'), desc: t('landing.feat2Desc') },
    { icon: Shield, title: t('landing.feat3'), desc: t('landing.feat3Desc') },
    { icon: Target, title: t('landing.feat4'), desc: t('landing.feat4Desc') },
    { icon: Users, title: t('landing.feat5'), desc: t('landing.feat5Desc') },
    { icon: Zap, title: t('landing.feat6'), desc: t('landing.feat6Desc') },
  ];

  const plans = [
    {
      name: 'Starter',
      desc: t('landing.starterDesc'),
      price: '29',
      items: ['25 members', '500 tasks', 'AI tasks & roles', '1,000 AI req/mo'],
      cta: t('landing.startWith', { plan: 'Starter' }),
      highlight: false,
    },
    {
      name: 'Pro',
      desc: t('landing.proDesc'),
      price: '79',
      items: ['100 members', 'Unlimited tasks & leads', 'Advanced analytics', 'API access', 'Priority support'],
      cta: t('landing.startWith', { plan: 'Pro' }),
      highlight: true,
    },
    {
      name: 'Enterprise',
      desc: t('landing.enterpriseDesc'),
      price: '299',
      items: ['Unlimited members', 'Everything unlimited', 'White label', 'Custom domain', 'Dedicated support'],
      cta: t('landing.contactSales'),
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f0ebe3] text-gray-900 overflow-x-hidden">
      {/* ─── NAV ─── */}
      <nav className="fixed top-0 w-full z-50 border-b border-black/5 bg-[#f0ebe3]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg nova-gradient flex items-center justify-center">
              <span className="text-xs font-bold text-white">O</span>
            </div>
            <span className="text-sm font-bold tracking-tight text-gray-900">OPTIMUS-K</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors">{t('nav.features')}</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">{t('nav.pricing')}</a>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Link to="/auth" className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden sm:block">
              {t('nav.signIn')}
            </Link>
            <Link
              to="/auth?tab=signup"
              className="text-sm bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-all"
            >
              {t('nav.startFree')}
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── DESKTOP AREA ─── */}
      <section className="relative os-desktop-bg os-dot-grid min-h-screen pt-14">
        <div className="relative z-10 min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12">

          {/* Desktop Icons — Left (lg+) */}
          <div className="hidden lg:flex flex-col gap-1 absolute left-6 top-24">
            {DESKTOP_ICONS.map(({ Icon, labelKey }) => (
              <Link key={labelKey} to="/auth?tab=signup" className="os-desktop-icon group">
                <div className="w-12 h-12 rounded-xl bg-white/80 border border-gray-200 shadow-sm flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/30 group-hover:shadow-md transition-all">
                  <Icon className="h-5 w-5 text-gray-600 group-hover:text-primary transition-colors" />
                </div>
                <span className="text-[10px] text-gray-500 group-hover:text-gray-800 transition-colors leading-tight font-medium">
                  {t(labelKey)}
                </span>
              </Link>
            ))}
          </div>

          {/* Dock — Right (lg+) */}
          <div className="hidden lg:flex flex-col gap-2 absolute right-6 top-1/2 -translate-y-1/2 bg-white/60 backdrop-blur-xl border border-gray-200/80 rounded-2xl p-2 shadow-lg">
            {DOCK_ITEMS.map(({ Icon, href, labelKey }) => (
              <a
                key={labelKey}
                href={href}
                className="p-2.5 rounded-xl hover:bg-primary/10 transition-all"
                title={t(labelKey)}
              >
                <Icon className="h-5 w-5 text-gray-500 hover:text-primary transition-colors" />
              </a>
            ))}
          </div>

          {/* Main OS Window — Center */}
          <div className="w-full max-w-3xl lg:max-w-4xl">
            <OsWindow
              title="optimus-k.app"
              className="bg-white border-gray-200 shadow-2xl shadow-black/10"
              contentClassName="!p-0"
            >
              <div className="p-6 md:p-10 lg:p-12 text-center">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl nova-gradient flex items-center justify-center shadow-lg shadow-primary/30">
                    <span className="text-lg font-bold text-white">O</span>
                  </div>
                  <span className="text-xl font-extrabold tracking-tight text-gray-900">OPTIMUS-K</span>
                </div>

                {/* Badge */}
                <div className="inline-flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-4 py-1.5 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  {t('landing.badge')}
                </div>

                {/* Hero */}
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] mb-5 text-gray-900">
                  {t('landing.heroTitle1')}
                  <br />
                  <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #7C3AED, #A855F7, #C084FC, #E879F9)' }}>{t('landing.heroTitle2')}</span>
                </h1>

                <p className="text-base md:text-lg text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
                  {t('landing.heroSub')}
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
                  <Link
                    to="/auth?tab=signup"
                    className="group flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-3.5 rounded-lg font-semibold text-base transition-all shadow-lg shadow-primary/25"
                  >
                    {t('landing.ctaPrimary')}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link
                    to="/auth?tab=signup"
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 px-8 py-3.5 rounded-lg font-medium text-base border border-gray-200 hover:border-gray-400 transition-all"
                  >
                    {t('landing.ctaSecondary')}
                  </Link>
                </div>

                {/* Phase Tabs */}
                <div className="inline-flex items-center gap-1 bg-gray-100 rounded-lg p-1 mb-8">
                  {PHASES.map((phase) => (
                    <button
                      key={phase.id}
                      onClick={() => setActivePhase(phase.id)}
                      className={cn(
                        'px-4 py-2 rounded-md text-sm font-medium transition-all',
                        activePhase === phase.id
                          ? 'bg-primary text-white shadow-md'
                          : 'text-gray-400 hover:text-gray-700'
                      )}
                    >
                      {t(phase.labelKey)}
                    </button>
                  ))}
                </div>

                {/* Phase Apps Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
                  {PHASE_APPS[activePhase].map(({ Icon, labelKey }) => (
                    <div
                      key={labelKey}
                      className="flex flex-col items-center gap-2.5 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:bg-primary/5 hover:border-primary/20 transition-all cursor-default group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-xs font-medium text-gray-500 group-hover:text-gray-800 transition-colors">
                        {t(labelKey)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </OsWindow>
          </div>
        </div>
      </section>

      {/* ─── PATHS ─── */}
      <section id="how" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">{t('landing.pathsTitle')}</h2>
            <p className="text-gray-500 max-w-xl mx-auto">{t('landing.pathsSub')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {paths.map((path) => (
              <OsWindow
                key={path.title}
                title={path.title}
                icon={path.icon}
                className={cn(
                  'transition-all hover:-translate-y-1',
                  path.highlight
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-gray-200 bg-white'
                )}
                contentClassName="!p-5"
              >
                <p className="text-sm text-gray-500 mb-5 leading-relaxed">{path.desc}</p>
                <ul className="space-y-2 mb-6">
                  {Array.isArray(path.items) && path.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-500">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/auth?tab=signup"
                  className={cn(
                    'block text-center text-sm font-medium py-2.5 rounded-lg transition-colors',
                    path.highlight
                      ? 'bg-primary hover:bg-primary/90 text-white'
                      : 'border border-gray-200 hover:border-primary/30 text-gray-500 hover:text-gray-900'
                  )}
                >
                  {path.cta} →
                </Link>
              </OsWindow>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">{t('landing.featuresTitle')}</h2>
            <p className="text-gray-500 max-w-xl mx-auto">{t('landing.featuresSub')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feat) => (
              <div
                key={feat.title}
                className="rounded-xl p-5 border border-gray-200 hover:border-primary/30 transition-all bg-white hover:shadow-md group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <feat.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-1.5 text-gray-900">{feat.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">{t('landing.pricingTitle')}</h2>
            <p className="text-gray-500 max-w-xl mx-auto">{t('landing.pricingSub')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <OsWindow
                key={plan.name}
                title={plan.name}
                className={cn(
                  plan.highlight
                    ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                    : 'border-gray-200 bg-white'
                )}
                contentClassName="!p-6"
              >
                {plan.highlight && (
                  <div className="flex justify-center -mt-1 mb-3">
                    <span className="text-xs font-semibold bg-primary text-white px-3 py-0.5 rounded-full">
                      {t('landing.popular')}
                    </span>
                  </div>
                )}
                <p className="text-xs text-gray-500 mb-4">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}€</span>
                  <span className="text-gray-400 text-sm">{t('landing.perMonth')}</span>
                </div>
                <ul className="space-y-2.5 mb-6 text-sm">
                  {plan.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-gray-500">
                      <Check className="h-3.5 w-3.5 text-primary" /> {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/auth?tab=signup"
                  className={cn(
                    'block text-center text-sm font-medium py-2.5 rounded-lg transition-colors',
                    plan.highlight
                      ? 'bg-primary hover:bg-primary/90 text-white'
                      : 'border border-gray-200 hover:border-primary/30 text-gray-500 hover:text-gray-900'
                  )}
                >
                  {plan.cta}
                </Link>
              </OsWindow>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">{t('landing.finalTitle')}</h2>
          <p className="text-gray-500 mb-8">{t('landing.finalSub')}</p>
          <Link
            to="/auth?tab=signup"
            className="group inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-3.5 rounded-lg font-semibold text-base transition-all shadow-lg shadow-primary/25"
          >
            {t('landing.finalCta')}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-gray-200 py-8 px-6 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md nova-gradient flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">O</span>
            </div>
            <span className="text-sm font-bold tracking-tight text-gray-900">OPTIMUS-K</span>
          </div>
          <span className="text-xs text-gray-400">
            {t('landing.copyright', { year: new Date().getFullYear() })}
          </span>
        </div>
      </footer>
    </div>
  );
}
