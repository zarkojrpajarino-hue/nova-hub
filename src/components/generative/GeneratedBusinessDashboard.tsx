/**
 * GENERATED BUSINESS DASHBOARD
 *
 * Muestra el negocio completo ya generado y aplicado:
 * - Branding (logo, colores, tipografía)
 * - Productos (nombre, descripción, pricing)
 * - Buyer Persona principal
 * - Website deployado (link)
 * - Experimentos de validación sugeridos
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import {
  ExternalLink,
  Palette,
  Package,
  Users,
  Target,
  Sparkles,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrandGuidelines {
  tone_attributes: string[];
  preferred_words: string[];
  color_primary: string;
  color_secondary: string;
  color_accent: string;
  font_heading: string;
  font_body: string;
  logo_url?: string;
}

interface Product {
  id: string;
  product_name: string;
  description: string;
  pricing_model: string;
  price: number;
  features: string[];
}

interface BuyerPersona {
  id: string;
  persona_name: string;
  age_range: string;
  role: string;
  pain_points: any[];
  budget_min: number;
  budget_max: number;
}

interface ValidationExperiment {
  id: string;
  experiment_name: string;
  hypothesis: string;
  success_criteria: string;
  status: string;
}

export function GeneratedBusinessDashboard() {
  const { projectId } = useParams();
  const [loading, setLoading] = useState(true);
  const [brandGuidelines, setBrandGuidelines] = useState<BrandGuidelines | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [buyerPersona, setBuyerPersona] = useState<BuyerPersona | null>(null);
  const [validationExperiments, setValidationExperiments] = useState<ValidationExperiment[]>([]);
  const [websiteUrl, setWebsiteUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const loadBusinessData = async () => {
      setLoading(true);

      // Load brand guidelines and website
      const { data: companyAssets } = await supabase
        .from('company_assets')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (companyAssets) {
        setWebsiteUrl(companyAssets.website_url);
      }

      // Load brand guidelines
      const { data: brand } = await supabase
        .from('brand_guidelines')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (brand) {
        setBrandGuidelines(brand as any);
      }

      // Load products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })
        .limit(5);

      if (productsData) {
        setProducts(productsData as any);
      }

      // Load primary buyer persona
      const { data: persona } = await supabase
        .from('buyer_personas')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (persona) {
        setBuyerPersona(persona as any);
      }

      // Load validation experiments
      const { data: experiments } = await supabase
        .from('validation_experiments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })
        .limit(3);

      if (experiments) {
        setValidationExperiments(experiments as any);
      }

      setLoading(false);
    };

    loadBusinessData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!brandGuidelines && products.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Negocio no generado aún</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Usa el wizard de Generative Onboarding para crear tu negocio completo con IA
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Tu Negocio Generado
          </h2>
          <p className="text-muted-foreground">Generado con IA en menos de 10 minutos</p>
        </div>
        {websiteUrl && (
          <Button asChild>
            <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver Website
            </a>
          </Button>
        )}
      </div>

      {/* Branding Section */}
      {brandGuidelines && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Branding
            </CardTitle>
            <CardDescription>Identidad visual de tu marca</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo */}
            {brandGuidelines.logo_url && (
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  <img
                    src={brandGuidelines.logo_url}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold">Logo</h4>
                  <p className="text-sm text-muted-foreground">Generado con DALL-E 3</p>
                </div>
              </div>
            )}

            {/* Colors */}
            <div>
              <h4 className="font-semibold mb-3">Paleta de colores</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <div
                    className="h-20 rounded-lg border"
                    style={{ backgroundColor: brandGuidelines.color_primary }}
                  />
                  <div className="text-center">
                    <p className="text-xs font-semibold">Primario</p>
                    <p className="text-xs text-muted-foreground">{brandGuidelines.color_primary}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div
                    className="h-20 rounded-lg border"
                    style={{ backgroundColor: brandGuidelines.color_secondary }}
                  />
                  <div className="text-center">
                    <p className="text-xs font-semibold">Secundario</p>
                    <p className="text-xs text-muted-foreground">
                      {brandGuidelines.color_secondary}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div
                    className="h-20 rounded-lg border"
                    style={{ backgroundColor: brandGuidelines.color_accent }}
                  />
                  <div className="text-center">
                    <p className="text-xs font-semibold">Acento</p>
                    <p className="text-xs text-muted-foreground">{brandGuidelines.color_accent}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div>
              <h4 className="font-semibold mb-3">Tipografía</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Títulos</p>
                  <p className="text-lg font-bold" style={{ fontFamily: brandGuidelines.font_heading }}>
                    {brandGuidelines.font_heading}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Cuerpo</p>
                  <p className="text-lg" style={{ fontFamily: brandGuidelines.font_body }}>
                    {brandGuidelines.font_body}
                  </p>
                </div>
              </div>
            </div>

            {/* Tone attributes */}
            {brandGuidelines.tone_attributes && brandGuidelines.tone_attributes.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Tono de comunicación</h4>
                <div className="flex flex-wrap gap-2">
                  {brandGuidelines.tone_attributes.map((attr: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {attr}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Products Section */}
      {products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Productos y Pricing
            </CardTitle>
            <CardDescription>Servicios generados por IA con precios estratégicos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-lg">{product.product_name}</h4>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-2xl font-bold">
                        <DollarSign className="h-5 w-5" />
                        {product.price}
                      </div>
                      <p className="text-xs text-muted-foreground">{product.pricing_model}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
                  {product.features && product.features.length > 0 && (
                    <div className="space-y-1">
                      {product.features.slice(0, 3).map((feature: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                      {product.features.length > 3 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          +{product.features.length - 3} características más
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Buyer Persona Section */}
      {buyerPersona && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Cliente Ideal
            </CardTitle>
            <CardDescription>Buyer persona principal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-2xl text-white font-bold">
                {buyerPersona.persona_name.charAt(0)}
              </div>
              <div>
                <h4 className="font-semibold text-lg">{buyerPersona.persona_name}</h4>
                <p className="text-sm text-muted-foreground">
                  {buyerPersona.role} · {buyerPersona.age_range} años
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Presupuesto mínimo</p>
                <p className="text-xl font-bold">${buyerPersona.budget_min}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Presupuesto máximo</p>
                <p className="text-xl font-bold">${buyerPersona.budget_max}</p>
              </div>
            </div>

            {buyerPersona.pain_points && buyerPersona.pain_points.length > 0 && (
              <div>
                <h5 className="font-semibold mb-2 text-sm">Pain points principales:</h5>
                <div className="space-y-2">
                  {buyerPersona.pain_points.slice(0, 3).map((pain: any, index: number) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <Badge variant="destructive" className="mt-0.5">
                        {pain.severity || 'high'}
                      </Badge>
                      <span>{pain.pain || pain}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Validation Experiments Section */}
      {validationExperiments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Experimentos de Validación
            </CardTitle>
            <CardDescription>
              Siguientes pasos para validar tu idea (Lean Startup)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {validationExperiments.map((experiment, index) => (
                <div key={experiment.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <h4 className="font-semibold">{experiment.experiment_name}</h4>
                    </div>
                    <Badge
                      variant={
                        experiment.status === 'completed'
                          ? 'default'
                          : experiment.status === 'in_progress'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {experiment.status}
                    </Badge>
                  </div>
                  <div className="ml-10 space-y-2 text-sm">
                    <div>
                      <span className="font-semibold">Hipótesis:</span> {experiment.hypothesis}
                    </div>
                    <div>
                      <span className="font-semibold">Criterio de éxito:</span>{' '}
                      {experiment.success_criteria}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
