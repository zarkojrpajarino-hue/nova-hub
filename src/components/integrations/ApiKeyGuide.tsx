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
 * - Botón trigger: "¿Dónde está mi API Key?" junto al input
 * - Modal con: zona de GIF (placeholder hasta que exista el asset) + instrucciones texto
 *
 * GIF_PLACEHOLDER: reemplazar el bloque marcado con <img src="...gif" /> cuando
 * exista el asset. El texto funciona sin el GIF — no es una dependencia bloqueante.
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ExternalLink, HelpCircle } from 'lucide-react'

interface Step {
  n: number
  title: string
  detail: string
  code?: string       // fragmento de código/texto a copiar o identificar
  warning?: string    // aviso importante en ese paso
}

interface ProviderGuide {
  provider: string
  title: string
  url: string
  urlLabel: string
  steps: Step[]
  warning: string    // aviso global (aplica a todo el proceso)
}

const GUIDES: Record<string, ProviderGuide> = {
  stripe: {
    provider: 'stripe',
    title: 'Cómo obtener tu Secret Key de Stripe',
    url: 'https://dashboard.stripe.com/apikeys',
    urlLabel: 'dashboard.stripe.com/apikeys',
    steps: [
      {
        n: 1,
        title: 'Ve a la sección API Keys',
        detail: 'En tu Dashboard de Stripe, ve a Developers → API Keys. O usa el enlace directo de arriba.',
      },
      {
        n: 2,
        title: 'Localiza la "Secret key"',
        detail: 'Verás dos claves: una Publishable key (empieza con pk_) y una Secret key (empieza con sk_). Necesitas la Secret key.',
        code: 'sk_live_... o sk_test_...',
      },
      {
        n: 3,
        title: 'Revela y copia la clave',
        detail: 'Haz clic en "Reveal live key" (o "Reveal test key" si usas el entorno de test). La clave aparecerá por unos segundos — cópiala inmediatamente.',
        warning: 'Stripe solo muestra la clave una vez después de "Reveal". Si cierras antes de copiarla, tendrás que generar una nueva en "Roll key".',
      },
      {
        n: 4,
        title: 'Pega la clave en Optimus',
        detail: 'Vuelve a esta pantalla, pega la clave en el campo "Secret Key (sk_...)" y pulsa Conectar Stripe.',
      },
    ],
    warning: 'Usa la clave de test (sk_test_...) durante pruebas. Solo pasa a la clave live (sk_live_...) cuando quieras datos reales de producción.',
  },
  holded: {
    provider: 'holded',
    title: 'Cómo obtener tu API Key de Holded',
    url: 'https://app.holded.com/settings/api',
    urlLabel: 'app.holded.com/settings/api',
    steps: [
      {
        n: 1,
        title: 'Ve a Configuración → API',
        detail: 'En Holded, accede al menú de usuario (esquina superior derecha) → Configuración → API.',
      },
      {
        n: 2,
        title: 'Genera una nueva API Key',
        detail: 'Haz clic en "Generar nueva API Key". Holded creará una clave única para tu cuenta.',
      },
      {
        n: 3,
        title: 'Copia la clave generada',
        detail: 'La clave aparece en pantalla. Cópiala antes de salir — Holded no la mostrará de nuevo.',
        warning: 'Guarda la clave en un lugar seguro. Si la pierdes, tendrás que generar otra (la antigua quedará inactiva).',
      },
      {
        n: 4,
        title: 'Pega la clave en Optimus',
        detail: 'Vuelve a esta pantalla, pega la clave en el campo "API Key" y pulsa Conectar Holded.',
      },
    ],
    warning: 'La API Key de Holded da acceso completo a tu facturación. Trátala como una contraseña — no la compartas.',
  },
}

interface ApiKeyGuideProps {
  provider: 'stripe' | 'holded'
}

export function ApiKeyGuide({ provider }: ApiKeyGuideProps) {
  const guide = GUIDES[provider]
  if (!guide) return null

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1">
          <HelpCircle size={13} />
          ¿Dónde está mi API Key?
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">{guide.title}</DialogTitle>
        </DialogHeader>

        {/* GIF_PLACEHOLDER — reemplazar con <img> cuando exista el asset */}
        <div className="rounded-lg bg-muted/50 border border-dashed border-border/60 h-36 flex items-center justify-center">
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground font-medium">GIF próximamente</p>
            <p className="text-xs text-muted-foreground">Screencast de ~15s mostrando los pasos</p>
          </div>
        </div>
        {/* END GIF_PLACEHOLDER */}

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
