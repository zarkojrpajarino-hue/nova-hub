/**
 * Landing Page — OPTIMUS-K
 *
 * i18n: ES/EN via react-i18next
 * Theme: auto light/dark via CSS variables
 * Paleta: #0D0A1A, #2E1065, #7C3AED, #C4B5FD, #F5F3FF
 */

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Check, BarChart3, Target, Users, Zap, Shield, TrendingUp, Layers, Sparkles } from 'lucide-react';
import { ThemeToggle, LanguageToggle } from '@/components/ui/theme-toggle';

export default function LandingPage() {
  const { t } = useTranslation();

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
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ─── NAV ─── */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-lg font-extrabold tracking-tight">OPTIMUS-K</span>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">{t('nav.features')}</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">{t('nav.pricing')}</a>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              {t('nav.signIn')}
            </Link>
            <Link
              to="/auth?tab=signup"
              className="text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {t('nav.startFree')}
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground bg-secondary border border-border rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {t('landing.badge')}
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
            {t('landing.heroTitle1')}
            <br />
            <span className="text-primary">{t('landing.heroTitle2')}</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('landing.heroSub')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth?tab=signup"
              className="group flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3.5 rounded-lg font-semibold text-base transition-all"
            >
              {t('landing.ctaPrimary')}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="#how"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground px-8 py-3.5 rounded-lg font-medium text-base border border-border hover:border-primary/30 transition-all"
            >
              {t('landing.ctaSecondary')}
            </a>
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF ─── */}
      <section className="py-12 border-y border-border/50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '5', label: t('landing.stat1') },
              { value: '90d', label: t('landing.stat2') },
              { value: '8+', label: t('landing.stat3') },
              { value: '14d', label: t('landing.stat4') },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PATHS ─── */}
      <section id="how" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('landing.pathsTitle')}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t('landing.pathsSub')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {paths.map((path) => (
              <div
                key={path.title}
                className={`rounded-xl p-6 border transition-all hover:-translate-y-1 ${
                  path.highlight
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-card border-border'
                }`}
              >
                <path.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-lg font-bold mb-2">{path.title}</h3>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{path.desc}</p>
                <ul className="space-y-2 mb-6">
                  {path.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/auth?tab=signup"
                  className={`block text-center text-sm font-medium py-2.5 rounded-lg transition-colors ${
                    path.highlight
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                      : 'border border-border hover:border-primary/30 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {path.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-24 px-6 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('landing.featuresTitle')}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t('landing.featuresSub')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feat) => (
              <div key={feat.title} className="rounded-xl p-5 border border-border hover:border-primary/20 transition-colors bg-card">
                <feat.icon className="h-5 w-5 text-primary mb-3" />
                <h3 className="font-semibold text-sm mb-1.5">{feat.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('landing.pricingTitle')}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t('landing.pricingSub')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-6 relative ${
                  plan.highlight
                    ? 'border-2 border-primary/50 bg-primary/5'
                    : 'border border-border'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold bg-primary text-primary-foreground px-3 py-0.5 rounded-full">
                    {t('landing.popular')}
                  </div>
                )}
                <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-3xl font-bold">{plan.price}€</span>
                  <span className="text-muted-foreground text-sm">{t('landing.perMonth')}</span>
                </div>
                <ul className="space-y-2.5 mb-6 text-sm">
                  {plan.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-primary" /> {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/auth?tab=signup"
                  className={`block text-center text-sm font-medium py-2.5 rounded-lg transition-colors ${
                    plan.highlight
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                      : 'border border-border hover:border-primary/30 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('landing.finalTitle')}</h2>
          <p className="text-muted-foreground mb-8">{t('landing.finalSub')}</p>
          <Link
            to="/auth?tab=signup"
            className="group inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3.5 rounded-lg font-semibold text-base transition-all"
          >
            {t('landing.finalCta')}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm font-bold tracking-tight">OPTIMUS-K</span>
          <span className="text-xs text-muted-foreground">
            {t('landing.copyright', { year: new Date().getFullYear() })}
          </span>
        </div>
      </footer>
    </div>
  );
}
