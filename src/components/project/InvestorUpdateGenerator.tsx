/**
 * V4.8.1 — InvestorUpdateGenerator
 *
 * Button + modal that calls the generate-investor-update edge function
 * to produce a monthly investor update email.
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FileText, Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface InvestorUpdate {
  subject: string;
  body_html: string;
  body_text: string;
  highlights: string[];
  metrics_summary: Record<string, unknown>;
}

export function InvestorUpdateGenerator() {
  const { t } = useTranslation();
  const { currentProject } = useCurrentProject();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('generate-investor-update', {
        body: { project_id: currentProject?.id },
      });

      if (response.error) throw new Error(response.error.message);
      return response.data as InvestorUpdate;
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleCopy = async () => {
    if (!mutation.data) return;
    try {
      await navigator.clipboard.writeText(mutation.data.body_text);
      setCopied(true);
      toast.success(t('project.investorUpdateCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('project.investorUpdateCopyFailed'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          {t('project.investorUpdate')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('project.investorUpdateTitle')}</DialogTitle>
        </DialogHeader>

        {!mutation.data && !mutation.isPending && (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              {t('project.investorUpdateDesc')}
            </p>
            <Button onClick={() => mutation.mutate()} className="gap-2">
              <FileText className="h-4 w-4" />
              {t('project.investorUpdateGenerate')}
            </Button>
          </div>
        )}

        {mutation.isPending && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              {t('project.investorUpdateGenerating')}
            </span>
          </div>
        )}

        {mutation.data && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {t('project.investorUpdateSubject')}
              </p>
              <p className="font-medium">{mutation.data.subject}</p>
            </div>

            {mutation.data.highlights?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t('project.investorUpdateHighlights')}
                </p>
                <ul className="text-sm space-y-1">
                  {mutation.data.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {t('project.investorUpdatePreview')}
              </p>
              <div
                className="border rounded-lg p-4 bg-white text-sm prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: mutation.data.body_html }}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCopy} variant="outline" className="gap-2">
                <Copy className="h-4 w-4" />
                {copied ? t('project.investorUpdateCopiedBtn') : t('project.investorUpdateCopyBtn')}
              </Button>
              <Button onClick={() => mutation.mutate()} variant="ghost" size="sm">
                {t('project.investorUpdateRegenerate')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
