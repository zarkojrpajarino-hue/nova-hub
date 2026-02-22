/**
 * 🎯 AI PREVIEW DASHBOARD
 *
 * Shows all AI-generated artifacts for user to review/approve
 * - Business Model Canvas
 * - Buyer Personas (2-3)
 * - Sales Playbook
 * - Competitive Analysis
 * - Financial Projections
 * - Go-to-Market Plan
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Edit2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BusinessModelCanvasData {
  key_partners?: string[];
  key_activities?: string[];
  value_propositions?: string[];
  customer_relationships?: string[];
  customer_segments?: string[];
  channels?: string[];
  cost_structure?: string[];
  revenue_streams?: string[];
}

interface BuyerPersona {
  name: string;
  role: string;
  age: string | number;
  pain_points?: string[];
  goals?: string[];
}

interface ObjectionHandling {
  objection: string;
  response: string;
}

interface SalesPlaybookData {
  sales_process?: string[];
  key_messaging?: string[];
  objection_handling?: ObjectionHandling[];
}

interface AIArtifact {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'generated' | 'needs_review' | 'approved';
  data: Record<string, unknown>;
  quality_score?: number; // 0-100
}

interface AIPreviewDashboardProps {
  artifacts: AIArtifact[];
  onApproveAll: () => void;
  onEdit: (artifactId: string) => void;
  onApprove: (artifactId: string) => void;
  loading?: boolean;
}

export function AIPreviewDashboard({
  artifacts,
  onApproveAll,
  onEdit,
  onApprove,
  loading = false
}: AIPreviewDashboardProps) {
  const [expandedArtifacts, setExpandedArtifacts] = useState<string[]>([]);

  const toggleExpanded = (id: string) => {
    setExpandedArtifacts(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const allApproved = artifacts.every(a => a.status === 'approved');
  const needsReview = artifacts.filter(a => a.status === 'needs_review').length;
  const avgQuality = Math.round(
    artifacts.reduce((sum, a) => sum + (a.quality_score || 0), 0) / artifacts.length
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Sparkles className="h-12 w-12 text-purple-600 animate-pulse" />
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            ✨ IA está generando tu ecosistema completo...
          </h3>
          <p className="text-gray-700">
            Business Model Canvas, Buyer Personas, Sales Playbook y más
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <div className="h-2 w-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="h-2 w-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="h-2 w-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-purple-600" />
                Tu Ecosistema Empresarial Completo
              </CardTitle>
              <CardDescription className="text-base mt-2">
                IA ha generado {artifacts.length} documentos estratégicos basados en tu información
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-600">{avgQuality}%</div>
              <div className="text-sm text-gray-700">Calidad IA</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant="default" className="bg-green-500">
              {artifacts.filter(a => a.status === 'approved').length} Aprobados
            </Badge>
            <Badge variant="outline" className="border-orange-500 text-orange-700">
              {needsReview} Pendientes de revisión
            </Badge>
            {allApproved && (
              <Badge variant="default" className="bg-purple-600">
                ✓ Todo listo para continuar
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Artifacts Grid */}
      <div className="space-y-4">
        {artifacts.map((artifact) => {
          const Icon = artifact.icon;
          const isExpanded = expandedArtifacts.includes(artifact.id);
          const isApproved = artifact.status === 'approved';
          const needsReview = artifact.status === 'needs_review';

          return (
            <Card
              key={artifact.id}
              className={cn(
                'transition-all duration-200',
                isApproved && 'border-green-500 bg-green-50/30',
                needsReview && 'border-orange-500 bg-orange-50/30'
              )}
            >
              <CardHeader
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => toggleExpanded(artifact.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={cn(
                      'p-3 rounded-lg',
                      isApproved ? 'bg-green-100' : 'bg-purple-100'
                    )}>
                      {isApproved ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : (
                        <Icon className="h-6 w-6 text-purple-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{artifact.title}</CardTitle>
                        {artifact.quality_score && (
                          <Badge variant="outline" className="text-xs">
                            {artifact.quality_score}% confianza
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{artifact.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isApproved && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(artifact.id);
                          }}
                          className="gap-1"
                        >
                          <Edit2 className="h-3 w-3" />
                          Editar
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onApprove(artifact.id);
                          }}
                          className="gap-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Aprobar
                        </Button>
                      </>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-600" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 border-t">
                  <div className="mt-4">
                    <ArtifactPreview artifact={artifact} />
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="text-sm text-gray-700">
          {allApproved ? (
            <span className="flex items-center gap-2 text-green-600 font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              Todos los documentos aprobados
            </span>
          ) : (
            <span>
              {needsReview} documento{needsReview !== 1 ? 's' : ''} pendiente{needsReview !== 1 ? 's' : ''} de revisión
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => artifacts.forEach(a => onEdit(a.id))}
          >
            Revisar todos
          </Button>
          <Button
            onClick={onApproveAll}
            disabled={!allApproved && needsReview > 0}
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Sparkles className="h-4 w-4" />
            {allApproved ? 'Continuar al Dashboard' : 'Aprobar Todo y Continuar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Preview component for each artifact type
function ArtifactPreview({ artifact }: { artifact: AIArtifact }) {
  switch (artifact.id) {
    case 'business_model_canvas':
      return <BusinessModelCanvasPreview data={artifact.data as BusinessModelCanvasData} />;
    case 'buyer_personas':
      return <BuyerPersonasPreview data={artifact.data as unknown as BuyerPersona[]} />;
    case 'sales_playbook':
      return <SalesPlaybookPreview data={artifact.data as SalesPlaybookData} />;
    default:
      return (
        <div className="bg-gray-50 rounded-lg p-4">
          <pre className="text-sm text-gray-800 whitespace-pre-wrap">
            {JSON.stringify(artifact.data, null, 2)}
          </pre>
        </div>
      );
  }
}

function BusinessModelCanvasPreview({ data }: { data: BusinessModelCanvasData }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { title: 'Key Partners', value: data.key_partners, color: 'bg-blue-50' },
        { title: 'Key Activities', value: data.key_activities, color: 'bg-purple-50' },
        { title: 'Value Propositions', value: data.value_propositions, color: 'bg-green-50' },
        { title: 'Customer Relationships', value: data.customer_relationships, color: 'bg-yellow-50' },
        { title: 'Customer Segments', value: data.customer_segments, color: 'bg-pink-50' },
        { title: 'Channels', value: data.channels, color: 'bg-indigo-50' },
        { title: 'Cost Structure', value: data.cost_structure, color: 'bg-red-50' },
        { title: 'Revenue Streams', value: data.revenue_streams, color: 'bg-emerald-50' },
      ].map((block) => (
        <div key={block.title} className={cn('rounded-lg p-3', block.color)}>
          <h4 className="font-semibold text-sm text-gray-900 mb-2">{block.title}</h4>
          <ul className="text-xs text-gray-800 space-y-1">
            {Array.isArray(block.value) ? (
              block.value.map((item: string, idx: number) => (
                <li key={idx}>• {item}</li>
              ))
            ) : (
              <li>{block.value}</li>
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}

function BuyerPersonasPreview({ data }: { data: BuyerPersona[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((persona, idx) => (
        <div key={idx} className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {persona.name[0]}
            </div>
            <div>
              <h4 className="font-bold text-gray-900">{persona.name}</h4>
              <p className="text-sm text-gray-700">{persona.role}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-semibold text-gray-900">Edad:</span> {persona.age}
            </div>
            <div>
              <span className="font-semibold text-gray-900">Pain Points:</span>
              <ul className="ml-4 mt-1 text-gray-800">
                {persona.pain_points?.map((pain: string, i: number) => (
                  <li key={i}>• {pain}</li>
                ))}
              </ul>
            </div>
            <div>
              <span className="font-semibold text-gray-900">Goals:</span>
              <ul className="ml-4 mt-1 text-gray-800">
                {persona.goals?.map((goal: string, i: number) => (
                  <li key={i}>• {goal}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SalesPlaybookPreview({ data }: { data: SalesPlaybookData }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Sales Process</h4>
          <ol className="text-sm text-gray-800 space-y-1">
            {data.sales_process?.map((step: string, idx: number) => (
              <li key={idx}>{idx + 1}. {step}</li>
            ))}
          </ol>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Key Messaging</h4>
          <ul className="text-sm text-gray-800 space-y-1">
            {data.key_messaging?.map((msg: string, idx: number) => (
              <li key={idx}>• {msg}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="bg-purple-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">Objection Handling</h4>
        <div className="space-y-2 text-sm text-gray-800">
          {data.objection_handling?.map((obj: ObjectionHandling, idx: number) => (
            <div key={idx}>
              <span className="font-semibold">"{obj.objection}"</span>
              <p className="ml-4 text-gray-700">→ {obj.response}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
