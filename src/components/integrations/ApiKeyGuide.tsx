/**
 * ApiKeyGuide — I15.E.CONNECT_UX.guide
 *
 * Modal con instrucciones paso a paso para obtener la API key de un provider.
 * Diseñado para usuarios no técnicos que no saben dónde está la clave ni cómo copiarla.
 *
 * Contexto: usuario real tardó varios intentos en 2026-03-16 porque Stripe oculta
 * las keys una vez creadas y el flujo de "girar clave" no es obvio.
 *
 * Estructura:
 * - Botón trigger: t('integrations.dóndeEstáMiApi0') junto al input
 * - Modal con: zona de GIF (placeholder hasta que exista el asset) + instrucciones texto
 *
 * GIF_PLACEHOLDER: reemplazar el bloque marcado con <img src="...gif" /> cuando
 * exista el asset. El texto funciona sin el GIF — no es una dependencia bloqueante.
 */

import type { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ExternalLink, HelpCircle, Key, Settings, Copy, ArrowRight, Shield, Globe, BookOpen, LayoutGrid, MessageSquare } from 'lucide-react'

import { useTranslation } from 'react-i18next';
interface Step {
  n: number
  title: string
  detail: string
  code?: string
  warning?: string
}

interface ProviderGuide {
  provider: string
  title: string
  url: string
  urlLabel: string
  steps: Step[]
  warning: string
}

// ── Visual guide illustrations per provider ──────────────────────
// SVG-based step diagrams that show the key UI flow for each provider.
// These replace the GIF_PLACEHOLDER with actual visual content.

function StripeIllustration() {
  return (
    <div className="rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Globe size={12} /> dashboard.stripe.com/apikeys
      </div>
      <div className="bg-background/80 rounded-md p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key size={14} className="text-indigo-500" />
            <span className="text-xs font-medium">Secret key</span>
          </div>
          <div className="flex items-center gap-1.5">
            <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">sk_live_•••••••••</code>
            <div className="w-14 h-5 rounded bg-indigo-500 text-white text-[10px] flex items-center justify-center font-medium">Reveal</div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <ArrowRight size={10} className="text-indigo-500" />
          <span>Copia la key → pega en Optimus-K</span>
        </div>
      </div>
    </div>
  )
}

function HoldedIllustration() {
  return (
    <div className="rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Settings size={12} /> app.holded.com/settings/api
      </div>
      <div className="bg-background/80 rounded-md p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">API Keys</span>
          <div className="w-24 h-5 rounded bg-cyan-500 text-white text-[10px] flex items-center justify-center font-medium">+ Generar nueva</div>
        </div>
        <div className="border-t border-border/50 pt-2">
          <div className="flex items-center gap-2">
            <Key size={14} className="text-cyan-500" />
            <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono flex-1">hld_api_•••••••••••••</code>
            <Copy size={12} className="text-muted-foreground" />
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <ArrowRight size={10} className="text-cyan-500" />
          <span>Copia la key → pega en Optimus-K</span>
        </div>
      </div>
    </div>
  )
}

function AsanaIllustration() {
  return (
    <div className="rounded-lg bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20 p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Globe size={12} /> app.asana.com/0/my-apps
      </div>
      <div className="bg-background/80 rounded-md p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Personal Access Tokens</span>
          <div className="w-28 h-5 rounded bg-pink-500 text-white text-[10px] flex items-center justify-center font-medium">+ Create new token</div>
        </div>
        <div className="border-t border-border/50 pt-2">
          <div className="flex items-center gap-2">
            <Key size={14} className="text-pink-500" />
            <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono flex-1">1/12345678:abc•••••••</code>
            <Copy size={12} className="text-muted-foreground" />
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-amber-600">
          <Shield size={10} />
          <span>Solo se muestra una vez — copia antes de cerrar</span>
        </div>
      </div>
    </div>
  )
}

function TrelloIllustration() {
  return (
    <div className="rounded-lg bg-gradient-to-br from-sky-500/10 to-blue-500/10 border border-sky-500/20 p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <LayoutGrid size={12} /> trello.com/power-ups/admin
      </div>
      <div className="bg-background/80 rounded-md p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground">1.</span>
            <span className="text-xs font-medium">API Key</span>
          </div>
          <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">a1b2c3d4e5f6•••</code>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground">2.</span>
            <span className="text-xs font-medium">Token</span>
            <span className="text-[10px] text-sky-500 underline cursor-pointer">generar</span>
          </div>
          <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">ATTA•••••••••••</code>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <ArrowRight size={10} className="text-sky-500" />
          <span>Pega ambos en Optimus-K</span>
        </div>
      </div>
    </div>
  )
}

function SlackIllustration() {
  return (
    <div className="rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <MessageSquare size={12} /> api.slack.com/apps
      </div>
      <div className="bg-background/80 rounded-md p-3 space-y-2">
        <div className="text-xs font-medium mb-1.5">OAuth & Permissions</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px]">
            <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30 flex items-center justify-center">
              <span className="text-green-600 text-[8px]">✓</span>
            </div>
            <span className="font-mono">channels:read</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30 flex items-center justify-center">
              <span className="text-green-600 text-[8px]">✓</span>
            </div>
            <span className="font-mono">channels:history</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30 flex items-center justify-center">
              <span className="text-green-600 text-[8px]">✓</span>
            </div>
            <span className="font-mono">users:read</span>
          </div>
        </div>
        <div className="border-t border-border/50 pt-2 mt-2 flex items-center gap-2">
          <Key size={14} className="text-violet-500" />
          <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono flex-1">xoxb-•••••••••••</code>
          <Copy size={12} className="text-muted-foreground" />
        </div>
      </div>
    </div>
  )
}

function NotionIllustration() {
  return (
    <div className="rounded-lg bg-gradient-to-br from-gray-500/10 to-slate-500/10 border border-gray-500/20 p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <BookOpen size={12} /> notion.so/my-integrations
      </div>
      <div className="bg-background/80 rounded-md p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Internal Integration Token</span>
          <div className="w-24 h-5 rounded bg-gray-700 dark:bg-gray-300 text-white dark:text-gray-900 text-[10px] flex items-center justify-center font-medium">+ New integration</div>
        </div>
        <div className="border-t border-border/50 pt-2">
          <div className="flex items-center gap-2">
            <Key size={14} className="text-gray-500" />
            <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono flex-1">ntn_•••••••••••••</code>
            <Copy size={12} className="text-muted-foreground" />
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-amber-600">
          <Shield size={10} />
          <span>Comparte las páginas con la integración (Share → Invite)</span>
        </div>
      </div>
    </div>
  )
}

const PROVIDER_ILLUSTRATION: Record<string, () => ReactNode> = {
  stripe: StripeIllustration,
  holded: HoldedIllustration,
  asana: AsanaIllustration,
  trello: TrelloIllustration,
  slack: SlackIllustration,
  notion: NotionIllustration,
}

const GUIDES: Record<string, ProviderGuide> = {
  stripe: {
    provider: 'stripe',
    title: t('integrations.cómoObtenerTuSecret'),
    url: 'https://dashboard.stripe.com/apikeys',
    urlLabel: 'dashboard.stripe.com/apikeys',
    steps: [
      {
        n: 1,
        title: t('integrations.veALaSección'),
        detail: t('integrations.enTuDashboardDe'),
      },
      {
        n: 2,
        title: t('integrations.localizaLaSecretKey'),
        detail: t('integrations.verásDosClavesUna'),
        code: 'sk_live_... o sk_test_...',
      },
      {
        n: 3,
        title: t('integrations.revelaYCopiaLa'),
        detail: t('integrations.hazClicEnReveal'),
        warning: t('integrations.stripeSoloMuestra'),
      },
      {
        n: 4,
        title: t('integrations.pegaLaClaveEn'),
        detail: t('integrations.vuelveAPantallaPegaStripe'),
      },
    ],
    warning: t('integrations.usaLaClaveDe'),
  },
  holded: {
    provider: 'holded',
    title: t('integrations.cómoObtenerTuApi'),
    url: 'https://app.holded.com/settings/api',
    urlLabel: 'app.holded.com/settings/api',
    steps: [
      {
        n: 1,
        title: t('integrations.veAConfiguracionApi'),
        detail: t('integrations.enHoldedAccedeAl'),
      },
      {
        n: 2,
        title: t('integrations.generaUnaNuevaApi'),
        detail: t('integrations.hazClicEnGenerar'),
      },
      {
        n: 3,
        title: t('integrations.copiaLaClaveGenerada'),
        detail: t('integrations.laClaveApareceEn'),
        warning: t('integrations.guardaLaClaveEn'),
      },
      {
        n: 4,
        title: t('integrations.pegaLaClaveEn'),
        detail: t('integrations.vuelveAPantallaPegaHolded'),
      },
    ],
    warning: t('integrations.laApiKeyDe'),
  },
  asana: {
    provider: 'asana',
    title: t('integrations.guideAsanaTitle'),
    url: 'https://app.asana.com/0/my-apps',
    urlLabel: 'app.asana.com/0/my-apps',
    steps: [
      {
        n: 1,
        title: t('integrations.guideAsanaStep1Title'),
        detail: t('integrations.guideAsanaStep1Detail'),
      },
      {
        n: 2,
        title: t('integrations.guideAsanaStep2Title'),
        detail: t('integrations.guideAsanaStep2Detail'),
      },
      {
        n: 3,
        title: t('integrations.guideAsanaStep3Title'),
        detail: t('integrations.guideAsanaStep3Detail'),
        code: '1/12345abc...',
      },
      {
        n: 4,
        title: t('integrations.guideAsanaStep4Title'),
        detail: t('integrations.guideAsanaStep4Detail'),
      },
    ],
    warning: t('integrations.guideAsanaWarning'),
  },
  trello: {
    provider: 'trello',
    title: t('integrations.guideTrelloTitle'),
    url: 'https://trello.com/power-ups/admin',
    urlLabel: 'trello.com/power-ups/admin',
    steps: [
      {
        n: 1,
        title: t('integrations.guideTrelloStep1Title'),
        detail: t('integrations.guideTrelloStep1Detail'),
      },
      {
        n: 2,
        title: t('integrations.guideTrelloStep2Title'),
        detail: t('integrations.guideTrelloStep2Detail'),
        code: 'API Key: a1b2c3d4...',
      },
      {
        n: 3,
        title: t('integrations.guideTrelloStep3Title'),
        detail: t('integrations.guideTrelloStep3Detail'),
        warning: t('integrations.guideTrelloStep3Warning'),
      },
      {
        n: 4,
        title: t('integrations.guideTrelloStep4Title'),
        detail: t('integrations.guideTrelloStep4Detail'),
      },
    ],
    warning: t('integrations.guideTrelloWarning'),
  },
  slack: {
    provider: 'slack',
    title: t('integrations.guideSlackTitle'),
    url: 'https://api.slack.com/apps',
    urlLabel: 'api.slack.com/apps',
    steps: [
      {
        n: 1,
        title: t('integrations.guideSlackStep1Title'),
        detail: t('integrations.guideSlackStep1Detail'),
      },
      {
        n: 2,
        title: t('integrations.guideSlackStep2Title'),
        detail: t('integrations.guideSlackStep2Detail'),
        code: 'channels:read, channels:history, users:read',
      },
      {
        n: 3,
        title: t('integrations.guideSlackStep3Title'),
        detail: t('integrations.guideSlackStep3Detail'),
      },
      {
        n: 4,
        title: t('integrations.guideSlackStep4Title'),
        detail: t('integrations.guideSlackStep4Detail'),
        code: 'xoxb-...',
      },
    ],
    warning: t('integrations.guideSlackWarning'),
  },
  notion: {
    provider: 'notion',
    title: t('integrations.guideNotionTitle'),
    url: 'https://www.notion.so/my-integrations',
    urlLabel: 'notion.so/my-integrations',
    steps: [
      {
        n: 1,
        title: t('integrations.guideNotionStep1Title'),
        detail: t('integrations.guideNotionStep1Detail'),
      },
      {
        n: 2,
        title: t('integrations.guideNotionStep2Title'),
        detail: t('integrations.guideNotionStep2Detail'),
        code: 'ntn_... o secret_...',
      },
      {
        n: 3,
        title: t('integrations.guideNotionStep3Title'),
        detail: t('integrations.guideNotionStep3Detail'),
        warning: t('integrations.guideNotionStep3Warning'),
      },
      {
        n: 4,
        title: t('integrations.guideNotionStep4Title'),
        detail: t('integrations.guideNotionStep4Detail'),
      },
    ],
    warning: t('integrations.guideNotionWarning'),
  },
}

interface ApiKeyGuideProps {
  provider: 'stripe' | 'holded' | 'asana' | 'trello' | 'slack' | 'notion'
}

export function ApiKeyGuide({ provider }: ApiKeyGuideProps) {
  const { t } = useTranslation();
  const guide = GUIDES[provider]
  if (!guide) return null

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1">
          <HelpCircle size={13} />{t('integrations.dóndeEstáMiApi')}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">{guide.title}</DialogTitle>
        </DialogHeader>

        {/* Visual guide illustration — specific to each provider */}
        {(() => {
          const Illustration = PROVIDER_ILLUSTRATION[provider]
          return Illustration ? <Illustration /> : null
        })()}

        <div className="space-y-3">
          {guide.steps.map((step) => (
            <div key={step.n} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">
                {step.n}
              </span>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.detail}</p>
                {step.code && (
                  <code className="text-xs bg-muted px-2 py-0.5 rounded block w-fit">
                    {step.code}
                  </code>
                )}
                {step.warning && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    ⚠ {step.warning}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-border/50 space-y-2">
          <p className="text-xs text-muted-foreground">{guide.warning}</p>
          <a
            href={guide.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            Abrir {guide.urlLabel}
            <ExternalLink size={11} />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  )
}
