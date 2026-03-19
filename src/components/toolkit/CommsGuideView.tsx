/**
 * CommsGuideView — F21.7b
 */

import { useState } from 'react';
import { Copy, Check, Mail, Linkedin, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Canal {
  canal: 'email' | 'linkedin' | 'whatsapp';
  tono_especifico: string;
  plantilla_primer_contacto: string;
  senales_funcionando: string[];
}

interface CommsGuideOutput {
  canales: Canal[];
}

const CANAL_CONFIG = {
  email:    { icon: Mail,          label: 'Email',     color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-800' },
  linkedin: { icon: Linkedin,      label: 'LinkedIn',  color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/20', border: 'border-indigo-200 dark:border-indigo-800' },
  whatsapp: { icon: MessageCircle, label: 'WhatsApp',  color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-950/20', border: 'border-green-200 dark:border-green-800' },
};

function CanalCard({ canal }: { canal: Canal }) {
  const [copied, setCopied] = useState(false);
  const cfg = CANAL_CONFIG[canal.canal] ?? CANAL_CONFIG.email;
  const Icon = cfg.icon;

  const handleCopy = () => {
    navigator.clipboard.writeText(canal.plantilla_primer_contacto);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className={cn(cfg.border, cfg.bg)}>
      <CardHeader className="pb-2">
        <CardTitle className={cn('flex items-center gap-2 text-sm', cfg.color)}>
          <Icon className="h-4 w-4" />
          {cfg.label}
        </CardTitle>
        <p className="text-xs text-gray-500">{canal.tono_especifico}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Plantilla */}
        <div className="relative">
          <div className="rounded-lg bg-white dark:bg-gray-900 border border-gray-200 p-3">
            <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {canal.plantilla_primer_contacto}
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 bg-white dark:bg-gray-900 rounded px-1.5 py-0.5 border border-gray-200"
          >
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>

        {/* Señales */}
        {canal.senales_funcionando?.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Señales de que funciona
            </p>
            <ul className="space-y-1">
              {canal.senales_funcionando.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                  <span className={cn('shrink-0 font-bold', cfg.color)}>✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CommsGuideView({ output }: { output: CommsGuideOutput }) {
  const canales = output.canales ?? [];
  return (
    <div className="space-y-4">
      {canales.map((c, i) => (
        <CanalCard key={i} canal={c} />
      ))}
    </div>
  );
}
