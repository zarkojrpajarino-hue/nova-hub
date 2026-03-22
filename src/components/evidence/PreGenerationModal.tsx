/**
 * Pre-Generation Modal
 *
 * Shows BEFORE searching for evidence
 * CRITICAL: Never promises source counts before searching
 * Shows: what we WILL search, availability unknown, user options
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, FileText, Globe, Database, Newspaper, Settings2 } from 'lucide-react';
import type { EvidenceMode, SourceTier } from '@/lib/evidence/types';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useTranslation } from 'react-i18next';
interface PreGenerationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  functionName: string;
  evidenceMode: EvidenceMode;
  onGenerate: (config: GenerationConfig) => void;
}

export interface GenerationConfig {
  evidenceMode: EvidenceMode;
  tier1Enabled: boolean;
  tier2Enabled: boolean;
  tier3Enabled: boolean;
  tier4Enabled: boolean;
  blockedDomains: string[];
  maxSourceAgeDays?: number;
}

export function PreGenerationModal({
  open,
  onOpenChange,
  functionName,
  evidenceMode: initialEvidenceMode,
  onGenerate,
}: PreGenerationModalProps) {
  const { t } = useTranslation();
  const [evidenceMode, setEvidenceMode] = useState<EvidenceMode>(initialEvidenceMode);
  const [tier1Enabled, setTier1Enabled] = useState(true);
  const [tier2Enabled, setTier2Enabled] = useState(true);
  const [tier3Enabled, setTier3Enabled] = useState(true);
  const [tier4Enabled, setTier4Enabled] = useState(false);
  const [blockedDomains, setBlockedDomains] = useState<string[]>([]);
  const [maxSourceAgeDays, setMaxSourceAgeDays] = useState<number | undefined>(undefined);

  function handleGenerate() {
    onGenerate({
      evidenceMode,
      tier1Enabled,
      tier2Enabled,
      tier3Enabled,
      tier4Enabled,
      blockedDomains,
      maxSourceAgeDays,
    });
  }

  // Calculate what will be searched
  const plannedSources: SourceTier[] = [];
  if (tier1Enabled) plannedSources.push('user_document');
  if (tier2Enabled) plannedSources.push('official_api');
  if (tier3Enabled) plannedSources.push('business_data');
  if (tier4Enabled) plannedSources.push('news');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('evidence.aiGenerationWithEvidence')}</DialogTitle>
          <DialogDescription>
            Configure evidence sources before generating {functionName}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="simple" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simple">{t('evidence.simple')}</TabsTrigger>
            <TabsTrigger value="advanced">
              <Settings2 className="h-4 w-4 mr-2" />{t('evidence.advanced')}</TabsTrigger>
          </TabsList>

          {/* SIMPLE MODE */}
          <TabsContent value="simple" className="space-y-4 mt-4">
            {/* Evidence Mode */}
            <div className="space-y-3">
              <Label>{t('evidence.evidenceMode')}</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={evidenceMode === 'strict' ? 'default' : 'outline'}
                  onClick={() => setEvidenceMode('strict')}
                  className="flex flex-col h-auto py-3"
                >
                  <span className="font-semibold">{t('evidence.strict')}</span>
                  <span className="text-xs opacity-80">{t('evidence.requiresEvidence')}</span>
                </Button>
                <Button
                  variant={evidenceMode === 'balanced' ? 'default' : 'outline'}
                  onClick={() => setEvidenceMode('balanced')}
                  className="flex flex-col h-auto py-3"
                >
                  <span className="font-semibold">{t('evidence.balanced')}</span>
                  <span className="text-xs opacity-80">{t('evidence.recommended')}</span>
                </Button>
                <Button
                  variant={evidenceMode === 'hypothesis' ? 'default' : 'outline'}
                  onClick={() => setEvidenceMode('hypothesis')}
                  className="flex flex-col h-auto py-3"
                >
                  <span className="font-semibold">{t('evidence.hypothesis')}</span>
                  <span className="text-xs opacity-80">{t('evidence.fastNoEvidence')}</span>
                </Button>
              </div>

              {evidenceMode === 'strict' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Strict mode:</strong> Generation will be blocked if evidence
                    requirements are not met. You'll have options to search more or continue
                    as hypothesis.
                  </AlertDescription>
                </Alert>
              )}

              {evidenceMode === 'hypothesis' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Hypothesis mode:</strong> Fast generation without evidence
                    search. Output will be clearly marked as unverified hypothesis.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Source Tiers */}
            {evidenceMode !== 'hypothesis' && (
              <div className="space-y-3">
                <Label>{t('evidence.evidenceSources')}</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium text-sm">{t('evidence.yourDocuments')}</p>
                        <p className="text-xs text-muted-foreground">{t('evidence.tier1HighestPriority')}</p>
                      </div>
                    </div>
                    <Switch checked={tier1Enabled} onCheckedChange={setTier1Enabled} />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium text-sm">{t('evidence.officialApis')}</p>
                        <p className="text-xs text-muted-foreground">{t('evidence.tier2SecWorld')}</p>
                      </div>
                    </div>
                    <Switch checked={tier2Enabled} onCheckedChange={setTier2Enabled} />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="font-medium text-sm">{t('evidence.businessData')}</p>
                        <p className="text-xs text-muted-foreground">{t('evidence.tier3CrunchbasePitchbook')}</p>
                      </div>
                    </div>
                    <Switch checked={tier3Enabled} onCheckedChange={setTier3Enabled} />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Newspaper className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="font-medium text-sm">{t('evidence.newsSources')}</p>
                        <p className="text-xs text-muted-foreground">{t('evidence.tier4NeedsConfirmation')}</p>
                      </div>
                    </div>
                    <Switch checked={tier4Enabled} onCheckedChange={setTier4Enabled} />
                  </div>
                </div>
              </div>
            )}

            {/* Plan Preview */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="font-semibold text-sm">Generation Plan:</p>
              <div className="text-sm space-y-1">
                {evidenceMode === 'hypothesis' ? (
                  <p>• Fast generation without evidence search</p>
                ) : (
                  <>
                    <p>• Evidence mode: <Badge variant="outline">{evidenceMode}</Badge></p>
                    <p>
                      • Will search:{' '}
                      {plannedSources.length > 0
                        ? plannedSources
                            .map((t) => {
                              if (t === 'user_document') return t('evidence.yourDocuments0');
                              if (t === 'official_api') return t('evidence.officialApis1');
                              if (t === 'business_data') return t('evidence.businessData2');
                              if (t === 'news') return t('evidence.news');
                              return t;
                            })
                            .join(', ')
                        : 'None (please enable at least one source)'}
                    </p>
                    <p className="text-muted-foreground text-xs mt-2">
                      ⚠️ Source availability: <strong>{t('evidence.unknownUntilSearchCompletes')}</strong>
                    </p>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ADVANCED MODE */}
          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="space-y-4">
              {/* Age Limit */}
              <div className="space-y-2">
                <Label>Maximum Source Age (days)</Label>
                <Input
                  type="number"
                  placeholder={t('evidence.noLimit')}
                  value={maxSourceAgeDays || ''}
                  onChange={(e) =>
                    setMaxSourceAgeDays(
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">{t('evidence.onlyUseSourcesPublished')}</p>
              </div>

              {/* Blocked Domains */}
              <div className="space-y-2">
                <Label>{t('evidence.blockedDomains')}</Label>
                <Input
                  placeholder={t('evidence.examplecomCompetitorcom')}
                  value={blockedDomains.join(', ')}
                  onChange={(e) =>
                    setBlockedDomains(
                      e.target.value
                        .split(',')
                        .map((d) => d.trim())
                        .filter(Boolean)
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">{t('evidence.commaseparatedListOfDomains')}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('evidence.cancel')}</Button>
          <Button
            onClick={handleGenerate}
            disabled={
              evidenceMode !== 'hypothesis' && plannedSources.length === 0
            }
          >
            {evidenceMode === 'hypothesis' ? 'Generate (No Evidence)' : t('evidence.searchGenerate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
