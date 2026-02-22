/**
 * COMPETITIVE LANDSCAPE STEP
 * Análisis competitivo profundo
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Users, TrendingUp, X } from 'lucide-react';
import { useState } from 'react';
import type { CompetitiveLandscape } from '@/types/ultra-onboarding';

interface CompetitiveLandscapeStepProps {
  landscape: Partial<CompetitiveLandscape>;
  onChange: (landscape: Partial<CompetitiveLandscape>) => void;
}

export function CompetitiveLandscapeStep({ landscape, onChange }: CompetitiveLandscapeStepProps) {
  const [newCompetitor, setNewCompetitor] = useState('');

  const updateLandscape = <K extends keyof CompetitiveLandscape>(key: K, value: CompetitiveLandscape[K]) => {
    onChange({ ...landscape, [key]: value });
  };

  const addCompetitor = () => {
    if (!newCompetitor.trim()) return;
    const competitors = landscape.main_competitors || [];
    updateLandscape('main_competitors', [...competitors, newCompetitor.trim()]);
    setNewCompetitor('');
  };

  const removeCompetitor = (comp: string) => {
    const competitors = (landscape.main_competitors || []).filter(c => c !== comp);
    updateLandscape('main_competitors', competitors);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">🎯 Competitive Landscape</h2>
        <p className="text-gray-600">Entendiendo tu competencia y positioning</p>
      </div>

      {/* Market Type */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Tipo de Mercado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={landscape.market_type} onValueChange={(value) => updateLandscape('market_type', value as CompetitiveLandscape['market_type'])}>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="blue_ocean" id="blue_ocean" className="mt-1" />
              <Label htmlFor="blue_ocean" className="flex-1 cursor-pointer">
                <div className="font-semibold">🌊 Blue Ocean</div>
                <div className="text-sm text-gray-600">Mercado nuevo, poca/ninguna competencia directa</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="emerging" id="emerging" className="mt-1" />
              <Label htmlFor="emerging" className="flex-1 cursor-pointer">
                <div className="font-semibold">🌱 Emerging Market</div>
                <div className="text-sm text-gray-600">Mercado creciendo, pocos players, espacio para más</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="crowded" id="crowded" className="mt-1" />
              <Label htmlFor="crowded" className="flex-1 cursor-pointer">
                <div className="font-semibold">🏙️ Crowded Market</div>
                <div className="text-sm text-gray-600">Mercado maduro, muchos competidores</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="red_ocean" id="red_ocean" className="mt-1" />
              <Label htmlFor="red_ocean" className="flex-1 cursor-pointer">
                <div className="font-semibold">🔴 Red Ocean</div>
                <div className="text-sm text-gray-600">Mercado saturado, guerra de precios, difícil diferenciarse</div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Main Competitors */}
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Principales Competidores
          </CardTitle>
          <CardDescription>Lista 3-5 competidores directos principales</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nombre del competidor"
              value={newCompetitor}
              onChange={(e) => setNewCompetitor(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCompetitor()}
            />
            <Button onClick={addCompetitor} size="sm">Añadir</Button>
          </div>

          {landscape.main_competitors && landscape.main_competitors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {landscape.main_competitors.map((comp) => (
                <Badge key={comp} variant="secondary" className="px-3 py-2 flex items-center gap-2">
                  {comp}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeCompetitor(comp)} />
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Differentiation */}
      <Card className="border-2 border-green-200">
        <CardHeader>
          <CardTitle>✨ Tu Diferenciación Clave</CardTitle>
          <CardDescription>¿Por qué customers elegirían tu producto vs competidores?</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={landscape.key_differentiation || ''}
            onChange={(e) => updateLandscape('key_differentiation', e.target.value)}
            placeholder="Ej: 'Somos 10x más rápidos', 'Solo enfocados en X nicho', 'Pricing basado en value no en seats', 'UX ultra-simple para no-tech users'"
            rows={5}
          />
        </CardContent>
      </Card>

      {/* Competitive Advantage */}
      <Card className="border-2 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            Ventaja Competitiva Sostenible
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={landscape.competitive_advantage} onValueChange={(value) => updateLandscape('competitive_advantage', value as CompetitiveLandscape['competitive_advantage'])}>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="tech_innovation" id="tech" />
              <Label htmlFor="tech" className="cursor-pointer">Tech innovation (10x mejor tecnológicamente)</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="network_effects" id="network" />
              <Label htmlFor="network" className="cursor-pointer">Network effects (valor crece con users)</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="brand" id="brand" />
              <Label htmlFor="brand" className="cursor-pointer">Brand & reputation</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="cost_advantage" id="cost" />
              <Label htmlFor="cost" className="cursor-pointer">Cost advantage (economies of scale)</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="exclusive_data" id="data" />
              <Label htmlFor="data" className="cursor-pointer">Exclusive data/content</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="distribution" id="distribution" />
              <Label htmlFor="distribution" className="cursor-pointer">Distribution channel lock-in</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="niche_focus" id="niche" />
              <Label htmlFor="niche" className="cursor-pointer">Ultra-niche focus (dominate tiny segment)</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Biggest Threat */}
      <Card className="border-2 border-red-200">
        <CardHeader>
          <CardTitle>⚠️ Mayor Amenaza Competitiva</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={landscape.biggest_threat || ''}
            onChange={(e) => updateLandscape('biggest_threat', e.target.value)}
            placeholder="Ej: 'Si Google añade esta feature a Gmail, estamos muertos' o 'Incumbent tiene 100x nuestro budget para marketing'"
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
}
