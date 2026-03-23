/**
 * AI LEAD FINDER
 *
 * Herramienta para generar leads automáticamente usando IA
 * Conecta con edge function: ai-lead-finder
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Sparkles, Building2, MapPin, DollarSign, Users, Mail, Phone, Plus, CheckCircle2, ExternalLink, Globe, Shield, AlertTriangle, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';

import { useTranslation } from 'react-i18next';
interface DataSource {
  type: 'google_maps' | 'linkedin' | 'website' | 'email_finder' | 'manual' | 'simulated';
  url?: string;
  confidence: 'high' | 'medium' | 'low';
  data_extracted: string[];
}

interface VerificationLinks {
  website?: string;
  google_maps?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
}

interface RawLeadFromAPI {
  business_name?: string;
  industry?: string;
  location?: { country?: string; city?: string; address?: string; coordinates?: { lat: number; lng: number } } | string;
  source?: string;
  sources?: DataSource[];
  website?: string;
  linkedin_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  estimated_value?: number;
  estimated_size?: 'micro' | 'small' | 'medium' | 'large';
  phone?: string;
  contact_info?: { name?: string; title?: string; email?: string; phone?: string };
  suggested_pitch?: { pain_points?: string[]; why_fit?: string; talking_points?: string[] };
}

interface GeneratedLead {
  company_name: string;
  industry: string;
  location: {
    country: string;
    city: string;
    address: string;
    coordinates: { lat: number; lng: number };
  } | string; // Support both object and string
  estimated_revenue: string;
  employee_count: string;
  contact_name: string;
  contact_title: string;
  contact_email: string;
  contact_phone?: string;
  pain_points?: string[];
  why_good_fit: string;
  talking_points?: string[];
  // Evidence System fields
  sources?: DataSource[];
  verification_links?: VerificationLinks;
  is_verified?: boolean;
  confidence_score?: number; // 0-100
}

export function AILeadFinder() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currentProject } = useCurrentProject();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedLeads, setGeneratedLeads] = useState<GeneratedLead[]>([]);

  // Form state
  const [targetIndustry, setTargetIndustry] = useState('');
  const [targetLocation, setTargetLocation] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [revenueRange, setRevenueRange] = useState('');
  const [idealCustomerProfile, setIdealCustomerProfile] = useState('');
  const [yourProductService, setYourProductService] = useState('');
  const [leadCount, setLeadCount] = useState('10');

  const handleGenerate = async () => {
    if (!targetIndustry || !yourProductService) {
      toast.error(t('crm.porFavorCompletaAl'));
      return;
    }

    if (!user?.id || !currentProject?.id) {
      toast.error(t('crm.usuarioOProyectoNo'));
      return;
    }

    setIsGenerating(true);
    try {
      // Usar fetch directamente para evitar problemas de CORS del cliente Supabase
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-lead-finder`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            user_id: user.id,
            project_id: currentProject.id,
            evidence_mode: 'balanced',
            search_params: {
              industry: targetIndustry,
              location_override: targetLocation ? { country: targetLocation } : undefined,
              quantity: parseInt(leadCount),
          },
            criteria: {
              industry: targetIndustry,
              companySize: companySize === 'any' ? 'Cualquiera': companySize || t('crm.cualquiera1'),
              revenueRange: revenueRange === 'any' ? 'Cualquiera': revenueRange || t('crm.cualquiera1'),
              idealCustomerProfile,
              productService: yourProductService,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // Transform backend structure to frontend structure
      const transformedLeads: GeneratedLead[] = (data.suggested_leads || []).map((lead: RawLeadFromAPI) => {
        // Build verification links
        const locationObj = typeof lead.location === 'object' ? lead.location : null;
        const googleMapsUrl = locationObj?.coordinates
          ? `https://www.google.com/maps/search/?api=1&query=${locationObj.coordinates.lat},${locationObj.coordinates.lng}`
          : undefined;

        // Determine if data is simulated or real
        const isSimulated = lead.source === 'google_maps_api' ? false : true; // Mock data doesn't have real source
        const sources: DataSource[] = lead.sources || [
          {
            type: lead.source === 'google_maps_api' ? 'google_maps' : 'simulated',
            url: googleMapsUrl,
            confidence: isSimulated ? 'low' : 'high',
            data_extracted: ['company_name', 'location', 'phone', 'rating'],
          },
        ];

        if (lead.website) {
          sources.push({
            type: 'website',
            url: lead.website,
            confidence: isSimulated ? 'low' : 'medium',
            data_extracted: ['contact_email', 'company_info'],
          });
        }

        return {
          company_name: lead.business_name || t('crm.unknownCompany'),
          industry: lead.industry || t('crm.unknown'),
          location: lead.location || t('crm.unknown'),
          estimated_revenue: lead.estimated_value ? `€${lead.estimated_value.toLocaleString()}` : '€50,000 - €100,000',
          employee_count: lead.estimated_size === 'micro' ? '1-10' :
                         lead.estimated_size === 'small' ? '11-50' :
                         lead.estimated_size === 'medium' ? '51-200' : '10-50',
          contact_name: lead.contact_info?.name || t('crm.managerGeneral'),
          contact_title: lead.contact_info?.title || t('crm.director'),
          contact_email: lead.contact_info?.email || 'info@company.com',
          contact_phone: lead.contact_info?.phone || lead.phone,
          pain_points: lead.suggested_pitch?.pain_points || [t('crm.necesitaOptimizarProcesos'), t('crm.buscaMejorarResultados')],
          why_good_fit: lead.suggested_pitch?.why_fit || t('crm.perfilIdealSegúnCriterios'),
          talking_points: lead.suggested_pitch?.talking_points || [t('crm.experienciaEnElSector'), t('crm.soluciónAdaptadaASus')],
          // Evidence System fields
          sources: sources,
          verification_links: {
            website: lead.website,
            google_maps: googleMapsUrl,
            linkedin: lead.linkedin_url,
            facebook: lead.facebook_url,
            instagram: lead.instagram_url,
          },
          is_verified: !isSimulated,
          confidence_score: isSimulated ? 30 : 85, // 30% for mock data, 85% for real data
        };
      });

      setGeneratedLeads(transformedLeads);
      toast.success(`${transformedLeads.length} leads generados exitosamente`);

      // Verificar en Supabase si se guardó la métrica
      setTimeout(() => {
        toast.info('Verifica en Supabase: SELECT COUNT(*) FROM evidence_generation_metrics');
      }, 2000);
    } catch (_error) {
      toast.error('Error al generar leads: ' + (error instanceof Error ? error.message : t('crm.errorDesconocido')));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveLead = async (lead: GeneratedLead) => {
    if (!user?.id || !currentProject?.id) {
      toast.error(t('crm.usuarioOProyectoNo'));
      return;
    }

    setIsSaving(true);
    try {
      // Format location string
      const locationStr = typeof lead.location === 'string'
        ? lead.location
        : `${lead.location.city}, ${lead.location.country}`;

      // Format notes
      const painPoints = lead.pain_points?.join(', ') || 'N/A';
      const notes = `Pain Points: ${painPoints}\n\nPor qué es buen fit: ${lead.why_good_fit}`;

      const { error } = await supabase.from('leads').insert({
        project_id: currentProject.id,
        nombre_empresa: lead.company_name,
        nombre_contacto: lead.contact_name,
        cargo: lead.contact_title,
        email: lead.contact_email,
        telefono: lead.contact_phone,
        industria: lead.industry,
        ubicacion: locationStr,
        estado: 'nuevo',
        fuente: t('crm.aiLeadFinder2'),
        notas: notes,
      });

      if (error) throw error;

      toast.success(`Lead "${lead.company_name}" guardado en CRM`);
    } catch (_error) {
      toast.error('Error al guardar: ' + (error instanceof Error ? error.message : t('crm.errorDesconocido')));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAll = async () => {
    if (!user?.id || !currentProject?.id) {
      toast.error(t('crm.usuarioOProyectoNo'));
      return;
    }

    setIsSaving(true);
    try {
      const leadsToInsert = generatedLeads.map(lead => {
        // Format location string
        const locationStr = typeof lead.location === 'string'
          ? lead.location
          : `${lead.location.city}, ${lead.location.country}`;

        // Format notes
        const painPoints = lead.pain_points?.join(', ') || 'N/A';
        const notes = `Pain Points: ${painPoints}\n\nPor qué es buen fit: ${lead.why_good_fit}`;

        return {
          project_id: currentProject.id,
          nombre_empresa: lead.company_name,
          nombre_contacto: lead.contact_name,
          cargo: lead.contact_title,
          email: lead.contact_email,
          telefono: lead.contact_phone,
          industria: lead.industry,
          ubicacion: locationStr,
          estado: 'nuevo',
          fuente: t('crm.aiLeadFinder2'),
          notas: notes,
        };
      });

      const { error } = await supabase.from('leads').insert(leadsToInsert);

      if (error) throw error;

      toast.success(`${leadsToInsert.length} leads guardados en CRM`);
      setGeneratedLeads([]);
    } catch (_error) {
      toast.error('Error al guardar: ' + (error instanceof Error ? error.message : t('crm.errorDesconocido')));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl optimus-gradient flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle>{t('crm.aiLeadFinder')}</CardTitle>
              <CardDescription>
                Genera leads cualificados automáticamente con IA basándose en tu ICP
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Criteria Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('crm.criteriosDeBúsqueda')}</CardTitle>
          <CardDescription>{t('crm.defineTuClienteIdeal')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product/Service */}
          <div className="space-y-2">
            <Label htmlFor="productService">Tu producto/servicio *</Label>
            <Textarea
              id="productService"
              placeholder={t('crm.ejSoftwareDeGestión')}
              value={yourProductService}
              onChange={(e) => setYourProductService(e.target.value)}
              disabled={isGenerating}
              rows={2}
            />
            <p className="text-xs text-muted-foreground">{t('crm.describeBrevementeQuéVendes')}</p>
          </div>

          {/* Target Industry */}
          <div className="space-y-2">
            <Label htmlFor="targetIndustry">Industria objetivo *</Label>
            <Input
              id="targetIndustry"
              placeholder={t('crm.ejSaasEcommerceMarketing')}
              value={targetIndustry}
              onChange={(e) => setTargetIndustry(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          {/* Location & Company Size */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetLocation">{t('crm.ubicación')}</Label>
              <Input
                id="targetLocation"
                placeholder={t('crm.ejEspañaLatamUsa')}
                value={targetLocation}
                onChange={(e) => setTargetLocation(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companySize">{t('crm.tamañoDeEmpresa')}</Label>
              <Select
                value={companySize}
                onValueChange={setCompanySize}
                disabled={isGenerating}
              >
                <SelectTrigger id="companySize">
                  <SelectValue placeholder={t('crm.cualquiera1')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{t('crm.cualquiera')}</SelectItem>
                  <SelectItem value="1-10">1-10 empleados</SelectItem>
                  <SelectItem value="11-50">11-50 empleados</SelectItem>
                  <SelectItem value="51-200">51-200 empleados</SelectItem>
                  <SelectItem value="201-500">201-500 empleados</SelectItem>
                  <SelectItem value="500+">500+ empleados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Revenue & Lead Count */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="revenueRange">{t('crm.rangoDeFacturación')}</Label>
              <Select
                value={revenueRange}
                onValueChange={setRevenueRange}
                disabled={isGenerating}
              >
                <SelectTrigger id="revenueRange">
                  <SelectValue placeholder={t('crm.cualquiera1')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{t('crm.cualquiera')}</SelectItem>
                  <SelectItem value="0-100k">$0 - $100k</SelectItem>
                  <SelectItem value="100k-500k">$100k - $500k</SelectItem>
                  <SelectItem value="500k-1M">$500k - $1M</SelectItem>
                  <SelectItem value="1M-5M">$1M - $5M</SelectItem>
                  <SelectItem value="5M+">$5M+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="leadCount">{t('crm.cantidadDeLeads')}</Label>
              <Select
                value={leadCount}
                onValueChange={setLeadCount}
                disabled={isGenerating}
              >
                <SelectTrigger id="leadCount">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 leads</SelectItem>
                  <SelectItem value="10">10 leads</SelectItem>
                  <SelectItem value="20">20 leads</SelectItem>
                  <SelectItem value="50">50 leads</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ICP Description */}
          <div className="space-y-2">
            <Label htmlFor="idealCustomerProfile">Perfil de cliente ideal (ICP)</Label>
            <Textarea
              id="idealCustomerProfile"
              placeholder={t('crm.ejStartupsTecnológicasEn')}
              value={idealCustomerProfile}
              onChange={(e) => setIdealCustomerProfile(e.target.value)}
              disabled={isGenerating}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">{t('crm.opcionalAñadeDetallesAdicionales')}</p>
          </div>

          {/* Generate Button - Simple Direct Call */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            size="lg"
            className="w-full gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />{t('crm.generandoLeads')}</>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                🔍 Generar Leads con IA (Test Evidence System)
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">{t('crm.estaFunciónEstáInstrumentada')}</p>
        </CardContent>
      </Card>

      {/* Generated Leads */}
      {generatedLeads.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Leads generados ({generatedLeads.length})</CardTitle>
                <CardDescription>Revisa los leads y guárdalos en tu CRM</CardDescription>
              </div>
              <Button
                onClick={handleSaveAll}
                disabled={isSaving}
                variant="outline"
                className="gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Guardar todos en CRM
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedLeads.map((lead, index) => (
              <Card key={index} className="border-2">
                <CardContent className="pt-6 space-y-4">
                  {/* Company Info */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-lg">{lead.company_name}</h4>
                        {lead.is_verified ? (
                          <Badge variant="default" className="gap-1 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                            <Shield size={12} />{t('crm.verificado')}</Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
                            <AlertTriangle size={12} />{t('crm.datosSimulados')}</Badge>
                        )}
                        {lead.confidence_score && (
                          <span className="text-xs text-muted-foreground">
                            {lead.confidence_score}% confianza
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 size={14} />
                          {lead.industry}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {typeof lead.location === 'string'
                            ? lead.location
                            : `${lead.location.city}, ${lead.location.country}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {lead.employee_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign size={14} />
                          {lead.estimated_revenue}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleSaveLead(lead)}
                      disabled={isSaving}
                      size="sm"
                      className="gap-2"
                    >
                      <Plus size={14} />
                      Guardar en CRM
                    </Button>
                  </div>

                  <Separator />

                  {/* Contact Info */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Contacto:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <strong>{lead.contact_name}</strong>
                        <p className="text-muted-foreground text-xs">{lead.contact_title}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs">
                          <Mail size={12} />
                          {lead.contact_email}
                        </div>
                        {lead.contact_phone && (
                          <div className="flex items-center gap-1 text-xs">
                            <Phone size={12} />
                            {lead.contact_phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Verification Links */}
                  {lead.verification_links && (
                    <div className="flex flex-wrap gap-2">
                      {lead.verification_links.website && (
                        <a
                          href={lead.verification_links.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <Globe size={12} />{t('crm.website')}<ExternalLink size={10} />
                        </a>
                      )}
                      {lead.verification_links.google_maps && (
                        <a
                          href={lead.verification_links.google_maps}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <MapPin size={12} />{t('crm.verEnGoogleMaps')}<ExternalLink size={10} />
                        </a>
                      )}
                      {lead.verification_links.linkedin && (
                        <a
                          href={lead.verification_links.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >{t('crm.linkedin')}<ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  )}

                  <Separator />

                  {/* Pain Points */}
                  {lead.pain_points && lead.pain_points.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Pain Points identificados:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {lead.pain_points.map((point, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {point}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Why Good Fit */}
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-sm">
                      <strong className="text-green-700 dark:text-green-400">Por qué es buen fit:</strong>{' '}
                      {lead.why_good_fit}
                    </p>
                  </div>

                  {/* Talking Points */}
                  {lead.talking_points && lead.talking_points.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Puntos de conversación sugeridos:</p>
                      <ul className="space-y-1">
                        {lead.talking_points.map((point, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <CheckCircle2 size={14} className="text-primary mt-0.5 flex-shrink-0" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Data Sources - Evidence System */}
                  {lead.sources && lead.sources.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2 p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Database size={14} className="text-muted-foreground" />
                          <p className="text-xs font-semibold text-muted-foreground">
                            Fuentes de datos (Evidence System)
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          {lead.sources.map((source, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs">
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 ${
                                  source.confidence === 'high'
                                    ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
                                    : source.confidence === 'medium'
                                    ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20'
                                    : 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
                                }`}
                              >
                                {source.confidence === 'high' ? 'HIGH' : source.confidence === 'medium' ? 'MED' : 'LOW'}{' '}
                                {source.type.replace('_', ' ').toUpperCase()}
                              </Badge>
                              <div className="flex-1">
                                <p className="text-muted-foreground">
                                  Datos extraídos: {source.data_extracted.join(', ')}
                                </p>
                                {source.url && (
                                  <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline inline-flex items-center gap-1"
                                  >{t('crm.verFuente')}<ExternalLink size={10} />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
