/**
 * Evidence Report
 *
 * Shown AFTER generation
 * Displays: sources found vs planned, claims coverage, citations, conflicts
 */

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Globe,
  Database,
  Newspaper,
} from 'lucide-react';
import type {
  EvidenceStatus,
  ClaimWithEvidence,
  RealSource,
  EvidenceConflict,
} from '@/lib/evidence/types';

interface EvidenceReportProps {
  generationId: string;
  functionName: string;
  sourcesPlanned: number;
  sourcesFound: number;
  sources: RealSource[];
  claims: ClaimWithEvidence[];
  evidenceStatus: EvidenceStatus;
  coveragePercentage: number;
  conflicts: EvidenceConflict[];
  searchDurationMs: number;
}

export function EvidenceReport({
  generationId,
  functionName,
  sourcesPlanned,
  sourcesFound,
  sources,
  claims,
  evidenceStatus,
  coveragePercentage,
  conflicts,
  searchDurationMs,
}: EvidenceReportProps) {
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null);
  const [expandedSource, setExpandedSource] = useState<string | null>(null);

  // Get status color and icon
  function getStatusInfo(status: EvidenceStatus) {
    switch (status) {
      case 'evidence_backed':
        return {
          color: 'text-green-500',
          bg: 'bg-green-500/10',
          icon: CheckCircle2,
          label: 'Evidence Backed',
        };
      case 'partial_evidence':
        return {
          color: 'text-yellow-500',
          bg: 'bg-yellow-500/10',
          icon: AlertTriangle,
          label: 'Partial Evidence',
        };
      case 'no_evidence':
        return {
          color: 'text-gray-500',
          bg: 'bg-gray-500/10',
          icon: XCircle,
          label: 'No Evidence (Hypothesis)',
        };
      case 'conflicting':
        return {
          color: 'text-red-500',
          bg: 'bg-red-500/10',
          icon: AlertTriangle,
          label: 'Conflicting Evidence',
        };
    }
  }

  const statusInfo = getStatusInfo(evidenceStatus);
  const StatusIcon = statusInfo.icon;

  // Get claim status color
  function getClaimStatusColor(status: string) {
    switch (status) {
      case 'supported':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'weak':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'unsupported':
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  }

  // Get tier icon
  function getTierIcon(type: string) {
    switch (type) {
      case 'user_document':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'official_api':
        return <Globe className="h-4 w-4 text-green-500" />;
      case 'business_data':
        return <Database className="h-4 w-4 text-purple-500" />;
      case 'news':
        return <Newspaper className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  }

  const claimsSupported = claims.filter((c) => c.status === 'supported').length;
  const claimsWeak = claims.filter((c) => c.status === 'weak').length;
  const claimsUnsupported = claims.filter((c) => c.status === 'unsupported').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Evidence Report</CardTitle>
              <CardDescription>
                Generation ID: {generationId.slice(0, 8)}... • Search completed in{' '}
                {(searchDurationMs / 1000).toFixed(1)}s
              </CardDescription>
            </div>
            <div className={`flex items-center gap-2 ${statusInfo.bg} px-3 py-1.5 rounded-full`}>
              <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
              <span className={`text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Coverage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Evidence Coverage</span>
              <span className="text-muted-foreground">{coveragePercentage}%</span>
            </div>
            <Progress value={coveragePercentage} className="h-2" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{sourcesFound}</p>
              <p className="text-xs text-muted-foreground">Sources Found</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-green-600">{claimsSupported}</p>
              <p className="text-xs text-muted-foreground">Supported</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{claimsWeak}</p>
              <p className="text-xs text-muted-foreground">Weak</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-gray-600">{claimsUnsupported}</p>
              <p className="text-xs text-muted-foreground">Unsupported</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claims */}
      <Card>
        <CardHeader>
          <CardTitle>Claims ({claims.length})</CardTitle>
          <CardDescription>Evidence-backed claims from generation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {claims.map((claim) => (
            <Collapsible
              key={claim.claim_id}
              open={expandedClaim === claim.claim_id}
              onOpenChange={() =>
                setExpandedClaim(
                  expandedClaim === claim.claim_id ? null : claim.claim_id
                )
              }
            >
              <div
                className={`border rounded-lg p-4 ${getClaimStatusColor(claim.status)}`}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full p-0 h-auto hover:bg-transparent"
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="flex-1 text-left space-y-1">
                        <p className="font-medium text-sm">{claim.claim_text}</p>
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant="outline" className="capitalize">
                            {claim.status}
                          </Badge>
                          <span className="text-muted-foreground">
                            {claim.citations.length} source
                            {claim.citations.length !== 1 ? 's' : ''}
                          </span>
                          {claim.independent_domains.length > 0 && (
                            <span className="text-muted-foreground">
                              • {claim.independent_domains.length} domain
                              {claim.independent_domains.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      {expandedClaim === claim.claim_id ? (
                        <ChevronUp className="h-4 w-4 flex-shrink-0 ml-2" />
                      ) : (
                        <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-3 space-y-2">
                  <div className="pl-4 border-l-2 border-muted-foreground/20">
                    <p className="text-sm font-medium mb-2">Value: {claim.value}</p>

                    {claim.citations.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground">
                          Citations:
                        </p>
                        {claim.citations.map((citation, idx) => (
                          <div
                            key={idx}
                            className="bg-background p-2 rounded text-xs space-y-1"
                          >
                            <div className="flex items-center gap-2">
                              {getTierIcon(citation.source_type)}
                              <span className="font-medium">{citation.source_name}</span>
                              <Badge variant="outline" className="text-xs">
                                {citation.quote_level}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground italic">"{citation.quote}"</p>
                            <div className="flex items-center gap-2">
                              <a
                                href={citation.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-1"
                              >
                                View source
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              {citation.location.page && (
                                <span className="text-muted-foreground">
                                  • Page {citation.location.page}
                                </span>
                              )}
                              {citation.location.row && (
                                <span className="text-muted-foreground">
                                  • Row {citation.location.row}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </CardContent>
      </Card>

      {/* Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Sources ({sources.length})</CardTitle>
          <CardDescription>All sources used in this generation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {sources.map((source) => (
            <div
              key={source.id}
              className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              {getTierIcon(source.type)}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{source.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {source.summary}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    Reliability: {source.reliability_score}
                  </Badge>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    View
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Conflicts (if any) */}
      {conflicts.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader>
            <CardTitle className="text-yellow-700">Conflicts Detected</CardTitle>
            <CardDescription>Sources provide conflicting information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {conflicts.map((conflict, idx) => (
              <div key={idx} className="p-3 bg-yellow-500/10 rounded-lg">
                <p className="font-medium text-sm mb-2">Claim: {conflict.claim_id}</p>
                <div className="space-y-2">
                  {conflict.conflicting_values.map((cv, cvIdx) => (
                    <div key={cvIdx} className="text-sm">
                      <p className="font-medium">{cv.value}</p>
                      <p className="text-xs text-muted-foreground">
                        {cv.citations.length} source{cv.citations.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  ))}
                </div>
                {conflict.resolution && (
                  <div className="mt-2 pt-2 border-t border-yellow-500/20">
                    <p className="text-xs font-semibold">Resolution ({conflict.resolution_type}):</p>
                    <p className="text-sm">{conflict.resolution}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
