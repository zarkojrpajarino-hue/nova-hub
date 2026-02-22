/**
 * GEO INTELLIGENCE SELECTOR (CAPA 1)
 *
 * Autocomplete de ubicación + visualización de datos locales
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, TrendingUp, Users, DollarSign, Sparkles, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { GeoIntelligence } from '@/types/ultra-onboarding';
import { EvidenceAIGenerator } from '@/components/evidence';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';

interface GeoIntelligenceSelectorProps {
  onLocationSelect: (city: string, country: string, geoData: GeoIntelligence | null) => void;
  initialCity?: string;
  initialCountry?: string;
}

export function GeoIntelligenceSelector({
  onLocationSelect,
  initialCity,
  initialCountry,
}: GeoIntelligenceSelectorProps) {
  const { user } = useAuth();
  const { currentProject } = useCurrentProject();
  const [city, setCity] = useState(initialCity || '');
  const [country, setCountry] = useState(initialCountry || '');
  const [geoData, setGeoData] = useState<GeoIntelligence | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGeoIntelligenceComplete = (result: { error?: string; content?: { data?: Record<string, unknown> } | Record<string, unknown> }) => {
    if (result.error) {
      setError(result.error);
      setGeoData(null);
      onLocationSelect(city, country, null);
      return;
    }

    const data = result.content?.data || result.content;
    setGeoData(data);
    onLocationSelect(city, country, data);
  };

  const handleGeoIntelligenceError = (error: Error) => {
    console.error('Error fetching geo intelligence:', error);
    setError(error.message);
    setGeoData(null);
    onLocationSelect(city, country, null);
  };

  return (
    <div className="space-y-6">
      {/* Location Input */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <CardTitle>¿Desde dónde vas a emprender?</CardTitle>
          </div>
          <CardDescription>
            Te mostraremos competidores, inversores y recursos específicos de tu zona
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Ciudad</label>
              <Input
                placeholder="ej: Madrid"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onBlur={() => city && country && fetchGeoIntelligence()}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">País</label>
              <Input
                placeholder="ej: España"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                onBlur={() => city && country && fetchGeoIntelligence()}
              />
            </div>
          </div>

          {city && country && !geoData && (
            <EvidenceAIGenerator
              functionName="geo-intelligence"
              evidenceProfile="financial"
              projectId={currentProject?.id || ''}
              userId={user?.id || ''}
              buttonLabel="Analizar mi ubicación"
              buttonClassName="w-full"
              additionalParams={{
                city,
                country,
              }}
              onGenerationComplete={handleGeoIntelligenceComplete}
              onError={handleGeoIntelligenceError}
            />
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Geo Intelligence Results */}
      {geoData && (
        <div className="space-y-4 animate-fade-in">
          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <QuickStat
              icon={<Users className="h-4 w-4" />}
              label="Población"
              value={geoData.market_size.population.toLocaleString()}
            />
            <QuickStat
              icon={<TrendingUp className="h-4 w-4" />}
              label="Ecosistema Rank"
              value={`#${geoData.market_size.startup_ecosystem_rank}`}
            />
            <QuickStat
              icon={<DollarSign className="h-4 w-4" />}
              label="Cost of Living"
              value={`${geoData.cost_of_living}/100`}
            />
            <QuickStat
              icon={<Sparkles className="h-4 w-4" />}
              label="Competidores"
              value={geoData.local_competitors.length}
            />
          </div>

          {/* Insights */}
          {geoData.insights && geoData.insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">💡 Insights clave de {city}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {geoData.insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span className="text-sm text-gray-700">{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Local Competitors */}
          {geoData.local_competitors && geoData.local_competitors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🏢 Competidores locales</CardTitle>
                <CardDescription>Empresas similares en tu zona</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {geoData.local_competitors.slice(0, 3).map((competitor, idx) => (
                    <div key={idx} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{competitor.name}</h4>
                            {competitor.url && (
                              <a
                                href={competitor.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{competitor.description}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {competitor.size}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {competitor.funding}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Local Investors */}
          {geoData.local_investors && geoData.local_investors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">💰 Inversores locales</CardTitle>
                <CardDescription>VCs y angels activos en tu zona</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {geoData.local_investors.slice(0, 3).map((investor, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{investor.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {investor.fund_size} • {investor.type}
                          </p>
                          {investor.notable_investments && investor.notable_investments.length > 0 && (
                            <p className="text-xs text-gray-700 mt-2">
                              Invirtieron en: {investor.notable_investments.slice(0, 2).join(', ')}
                            </p>
                          )}
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {investor.focus_areas.slice(0, 3).map((area, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Operational Costs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💵 Costos operativos en {city}</CardTitle>
              <CardDescription>Salarios y gastos típicos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <CostRange
                  label="Developer"
                  min={geoData.operational_costs.dev_salary_min}
                  max={geoData.operational_costs.dev_salary_max}
                  currency={geoData.operational_costs.currency}
                />
                <CostRange
                  label="Marketing"
                  min={geoData.operational_costs.marketing_salary_min}
                  max={geoData.operational_costs.marketing_salary_max}
                  currency={geoData.operational_costs.currency}
                />
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Coworking:</span> ~{geoData.operational_costs.coworking_monthly}{' '}
                    {geoData.operational_costs.currency}/mes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grants */}
          {geoData.grants && geoData.grants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🎁 Grants disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {geoData.grants.map((grant, idx) => (
                    <div key={idx} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-green-900">{grant.name}</h4>
                          <p className="text-sm text-green-700 mt-1">
                            {grant.amount} • {grant.type}
                          </p>
                          <p className="text-xs text-green-600 mt-1">{grant.eligibility}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function QuickStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">{icon}</div>
          <div>
            <p className="text-xs text-gray-600">{label}</p>
            <p className="text-lg font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CostRange({
  label,
  min,
  max,
  currency,
}: {
  label: string;
  min: number;
  max: number;
  currency: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <p className="text-lg font-bold text-gray-900">
        {min.toLocaleString()}-{max.toLocaleString()} {currency}/año
      </p>
    </div>
  );
}
