/**
 * TEAM BREAKDOWN STEP
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Users, Code, Briefcase, TrendingUp } from 'lucide-react';
import type { TeamBreakdown } from '@/types/ultra-onboarding';

interface TeamBreakdownStepProps {
  team: Partial<TeamBreakdown>;
  onChange: (team: Partial<TeamBreakdown>) => void;
}

export function TeamBreakdownStep({ team, onChange }: TeamBreakdownStepProps) {
  const updateTeam = <K extends keyof TeamBreakdown>(key: K, value: TeamBreakdown[K]) => {
    onChange({ ...team, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">👥 Team Breakdown</h2>
        <p className="text-gray-600">Composición actual del equipo</p>
      </div>

      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Tamaño del Equipo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="num_founders">Founders</Label>
              <Input
                id="num_founders"
                type="number"
                placeholder="2"
                value={team.num_founders || ''}
                onChange={(e) => updateTeam('num_founders', parseInt(e.target.value) || undefined)}
              />
            </div>
            <div>
              <Label htmlFor="num_fulltime">Full-time employees</Label>
              <Input
                id="num_fulltime"
                type="number"
                placeholder="5"
                value={team.num_fulltime || ''}
                onChange={(e) => updateTeam('num_fulltime', parseInt(e.target.value) || undefined)}
              />
            </div>
            <div>
              <Label htmlFor="num_contractors">Contractors / Part-time</Label>
              <Input
                id="num_contractors"
                type="number"
                placeholder="3"
                value={team.num_contractors || ''}
                onChange={(e) => updateTeam('num_contractors', parseInt(e.target.value) || undefined)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-purple-600" />
            Tech Capability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={team.tech_capability} onValueChange={(value) => updateTeam('tech_capability', value as any)}>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="strong_inhouse" id="strong" className="mt-1" />
              <Label htmlFor="strong" className="flex-1 cursor-pointer">
                <div className="font-semibold">Strong tech team in-house</div>
                <div className="text-sm text-gray-600">Founders + engineers con track record</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="some_tech" id="some" className="mt-1" />
              <Label htmlFor="some" className="flex-1 cursor-pointer">
                <div className="font-semibold">Some tech capability</div>
                <div className="text-sm text-gray-600">1-2 devs, complementamos con contractors</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="outsourced" id="outsourced" className="mt-1" />
              <Label htmlFor="outsourced" className="flex-1 cursor-pointer">
                <div className="font-semibold">Fully outsourced</div>
                <div className="text-sm text-gray-600">Agency o freelancers</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="no_code" id="nocode" className="mt-1" />
              <Label htmlFor="nocode" className="flex-1 cursor-pointer">
                <div className="font-semibold">No-code tools</div>
                <div className="text-sm text-gray-600">Bubble, Webflow, Airtable, etc.</div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="border-2 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-green-600" />
            Business/GTM Capability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={team.business_capability} onValueChange={(value) => updateTeam('business_capability', value as any)}>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="experienced" id="exp" />
              <Label htmlFor="exp" className="cursor-pointer">Founders con experiencia en sales/marketing</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="learning" id="learning" />
              <Label htmlFor="learning" className="cursor-pointer">Aprendiendo, sin experiencia previa</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="hired_experts" id="hired" />
              <Label htmlFor="hired" className="cursor-pointer">Hemos contratado expertos en GTM</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="border-2 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            Biggest Hiring Need
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={team.biggest_hiring_need || ''}
            onChange={(e) => updateTeam('biggest_hiring_need', e.target.value)}
            placeholder="Ej: 'Necesitamos senior engineer con exp en ML' o 'Sales leader que pueda construir outbound motion' o 'No podemos permitir hires ahora'"
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
}
