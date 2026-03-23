/**
 * EMAIL PITCH GENERATOR
 *
 * Genera emails de prospección personalizados con IA
 * Conecta con edge function: generate-email-pitch
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, Copy, Download, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { EvidenceAIGenerator } from '@/components/evidence';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';

import { useTranslation } from 'react-i18next';
interface GeneratedEmail {
  subject: string;
  body: string;
  follow_up_suggestions: string[];
  tone: string;
  estimated_response_rate: number;
}

export function EmailPitchGenerator() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currentProject } = useCurrentProject();

  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null);

  // Form state
  const [recipientName, setRecipientName] = useState('');
  const [recipientCompany, setRecipientCompany] = useState('');
  const [recipientRole, setRecipientRole] = useState('');
  const [yourProduct, setYourProduct] = useState('');
  const [painPoints, setPainPoints] = useState('');
  const [tone, setTone] = useState('professional');
  const [callToAction, setCallToAction] = useState('');

  const handleCopy = () => {
    if (!generatedEmail) return;

    const text = `Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`;
    navigator.clipboard.writeText(text);
    toast.success(t('crm.emailCopiadoAlPortapapeles'));
  };

  const handleDownload = () => {
    if (!generatedEmail) return;

    const text = `Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}\n\n---\n\nFollow-up Suggestions:\n${generatedEmail.follow_up_suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-pitch-${recipientName.replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('crm.emailDescargado'));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl optimus-gradient flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle>{t('crm.emailPitchGenerator')}</CardTitle>
              <CardDescription>
                Genera emails de prospección personalizados y persuasivos con IA
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('crm.informaciónDelDestinatario')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recipientName">Nombre del destinatario *</Label>
              <Input
                id="recipientName"
                placeholder={t('crm.ejMaríaGarcía')}
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientRole">{t('crm.cargo')}</Label>
              <Input
                id="recipientRole"
                placeholder={t('crm.ejHeadOfMarketing')}
                value={recipientRole}
                onChange={(e) => setRecipientRole(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipientCompany">{t('crm.empresa')}</Label>
            <Input
              id="recipientCompany"
              placeholder={t('crm.ejAcmeCorp')}
              value={recipientCompany}
              onChange={(e) => setRecipientCompany(e.target.value)}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="yourProduct">Tu producto/servicio *</Label>
            <Textarea
              id="yourProduct"
              placeholder={t('crm.ejPlataformaDeAutomatización')}
              value={yourProduct}
              onChange={(e) => setYourProduct(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="painPoints">{t('crm.painPointsQueResuelves')}</Label>
            <Textarea
              id="painPoints"
              placeholder={t('crm.ejReduceTiempoManual')}
              value={painPoints}
              onChange={(e) => setPainPoints(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tone">{t('crm.tonoDelEmail')}</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger id="tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">{t('crm.profesional')}</SelectItem>
                  <SelectItem value="friendly">{t('crm.amigable')}</SelectItem>
                  <SelectItem value="casual">{t('crm.casual')}</SelectItem>
                  <SelectItem value="formal">{t('crm.formal')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="callToAction">{t('crm.callToAction')}</Label>
              <Select value={callToAction} onValueChange={setCallToAction}>
                <SelectTrigger id="callToAction">
                  <SelectValue placeholder={t('crm.seleccionaCta')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('crm.dejarQueIaDecida')}</SelectItem>
                  <SelectItem value="schedule-call">{t('crm.agendarLlamada')}</SelectItem>
                  <SelectItem value="demo">{t('crm.solicitarDemo')}</SelectItem>
                  <SelectItem value="more-info">{t('crm.másInformación')}</SelectItem>
                  <SelectItem value="trial">{t('crm.pruebaGratuita')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <EvidenceAIGenerator
            functionName="generate-email-pitch"
            projectId={currentProject?.id || ''}
            userId={user?.id || ''}
            buttonLabel="✉️ Generar Email Pitch con Evidencias"
            buttonSize="lg"
            additionalParams={{
              recipient_name: recipientName,
              recipient_company: recipientCompany,
              recipient_role: recipientRole,
              your_product: yourProduct,
              pain_points: painPoints,
              tone: tone,
              call_to_action: callToAction,
            }}
            onGenerationComplete={(result) => {
              if (result.content?.email) {
                setGeneratedEmail(result.content.email);
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Generated Email */}
      {generatedEmail && (
        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <CardTitle className="text-base">{t('crm.emailGenerado')}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500">
                  ~{generatedEmail.estimated_response_rate}% tasa de respuesta esperada
                </Badge>
                <Button onClick={handleCopy} variant="outline" size="sm" className="gap-2">
                  <Copy size={14} />{t('crm.copiar')}</Button>
                <Button onClick={handleDownload} variant="outline" size="sm" className="gap-2">
                  <Download size={14} />{t('crm.descargar')}</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Subject Line */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">{t('crm.asunto')}</Label>
              <div className="p-3 rounded-lg bg-background border font-semibold">
                {generatedEmail.subject}
              </div>
            </div>

            <Separator />

            {/* Email Body */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">{t('crm.cuerpoDelEmail')}</Label>
              <div className="p-4 rounded-lg bg-background border">
                <pre className="whitespace-pre-wrap text-sm font-sans">{generatedEmail.body}</pre>
              </div>
            </div>

            <Separator />

            {/* Follow-up Suggestions */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">{t('crm.sugerenciasDeSeguimiento')}</Label>
              <ul className="space-y-2">
                {generatedEmail.follow_up_suggestions.map((suggestion, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="pt-0.5">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tone Badge */}
            <div className="flex items-center gap-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Tono:</Label>
              <Badge variant="outline">{generatedEmail.tone}</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
