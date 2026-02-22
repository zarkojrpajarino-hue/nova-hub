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
          <DialogTitle>AI Generation with Evidence</DialogTitle>
          <DialogDescription>
            Configure evidence sources before generating {functionName}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="simple" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simple">Simple</TabsTrigger>
            <TabsTrigger value="advanced">
              <Settings2 className="h-4 w-4 mr-2" />
              Advanced
            </TabsTrigger>
          </TabsList>

          {/* SIMPLE MODE */}
          <TabsContent value="simple" className="space-y-4 mt-4">
            {/* Evidence Mode */}
            <div className="space-y-3">
              <Label>Evidence Mode</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={evidenceMode === 'strict' ? 'default' : 'outline'}
                  onClick={() => setEvidenceMode('strict')}
                  className="flex flex-col h-auto py-3"
                >
                  <span className="font-semibold">Strict</span>
                  <span className="text-xs opacity-80">Requires evidence</span>
                </Button>
                <Button
                  variant={evidenceMode === 'balanced' ? 'default' : 'outline'}
                  onClick={() => setEvidenceMode('balanced')}
                  className="flex flex-col h-auto py-3"
                >
                  <span className="font-semibold">Balanced</span>
                  <span className="text-xs opacity-80">Recommended</span>
                </Button>
                <Button
                  variant={evidenceMode === 'hypothesis' ? 'default' : 'outline'}
                  onClick={() => setEvidenceMode('hypothesis')}
                  className="flex flex-col h-auto py-3"
                >
                  <span className="font-semibold">Hypothesis</span>
                  <span className="text-xs opacity-80">Fast, no evidence</span>
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
                <Label>Evidence Sources</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium text-sm">Your Documents</p>
                        <p className="text-xs text-muted-foreground">
                          Tier 1 • Highest priority
                        </p>
                      </div>
                    </div>
                    <Switch checked={tier1Enabled} onCheckedChange={setTier1Enabled} />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium text-sm">Official APIs</p>
                        <p className="text-xs text-muted-foreground">
                          Tier 2 • SEC, World Bank, Census
                        </p>
                      </div>
                    </div>
                    <Switch checked={tier2Enabled} onCheckedChange={setTier2Enabled} />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="font-medium text-sm">Business Data</p>
                        <p className="text-xs text-muted-foreground">
                          Tier 3 • Crunchbase, PitchBook
                        </p>
                      </div>
                    </div>
                    <Switch checked={tier3Enabled} onCheckedChange={setTier3Enabled} />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Newspaper className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="font-medium text-sm">News Sources</p>
                        <p className="text-xs text-muted-foreground">
                          Tier 4 • Needs confirmation
                        </p>
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
                              if (t === 'user_document') return 'Your Documents';
                              if (t === 'official_api') return 'Official APIs';
                              if (t === 'business_data') return 'Business Data';
                              if (t === 'news') return 'News';
                              return t;
                            })
                            .join(', ')
                        : 'None (please enable at least one source)'}
                    </p>
                    <p className="text-muted-foreground text-xs mt-2">
                      ⚠️ Source availability: <strong>Unknown until search completes</strong>
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
                  placeholder="No limit"
                  value={maxSourceAgeDays || ''}
                  onChange={(e) =>
                    setMaxSourceAgeDays(
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Only use sources published within this many days. Leave empty for no limit.
                </p>
              </div>

              {/* Blocked Domains */}
              <div className="space-y-2">
                <Label>Blocked Domains</Label>
                <Input
                  placeholder="example.com, competitor.com"
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
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of domains to exclude from evidence
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={
              evidenceMode !== 'hypothesis' && plannedSources.length === 0
            }
          >
            {evidenceMode === 'hypothesis' ? 'Generate (No Evidence)' : 'Search & Generate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
