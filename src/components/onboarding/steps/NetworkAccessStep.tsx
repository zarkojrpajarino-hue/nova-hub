/**
 * NETWORK ACCESS STEP
 * Acceso a recursos clave: investors, advisors, customers
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Lightbulb } from 'lucide-react';
import type { NetworkAccess } from '@/types/ultra-onboarding';

interface NetworkAccessStepProps {
  network: Partial<NetworkAccess>;
  onChange: (network: Partial<NetworkAccess>) => void;
}

export function NetworkAccessStep({ network, onChange }: NetworkAccessStepProps) {
  const updateNetwork = <K extends keyof NetworkAccess>(key: K, value: NetworkAccess[K]) => {
    onChange({ ...network, [key]: value });
  };

  const networkResources = [
    { id: 'angel_investors', label: 'Angel investors / VCs', description: 'Acceso a funding' },
    { id: 'industry_experts', label: 'Industry experts', description: 'Advisors con expertise' },
    { id: 'potential_customers', label: 'Potential customers / early adopters', description: 'Para beta testing' },
    { id: 'technical_cofounders', label: 'Technical co-founders pool', description: 'Si buscas tech talent' },
    { id: 'accelerators', label: 'Accelerators / Incubators', description: 'YC, Techstars, etc.' },
    { id: 'media_press', label: 'Media / Press contacts', description: 'Para coverage' },
    { id: 'strategic_partners', label: 'Strategic partners', description: 'Distribution channels' },
  ];

  const selectedResources = network.has_access_to || [];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">🤝 Network & Access</h2>
        <p className="text-gray-600">Tu red de contactos y recursos</p>
      </div>

      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            ¿A qué recursos tienes acceso directo?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {networkResources.map((resource) => (
            <div key={resource.id} className="flex items-start space-x-3 p-3 border-2 rounded-lg hover:bg-blue-50">
              <Checkbox
                id={resource.id}
                checked={selectedResources.includes(resource.id as any)}
                onCheckedChange={(checked) => {
                  const updated = checked
                    ? [...selectedResources, resource.id as any]
                    : selectedResources.filter(r => r !== resource.id);
                  updateNetwork('has_access_to', updated);
                }}
              />
              <Label htmlFor={resource.id} className="flex-1 cursor-pointer">
                <div className="font-semibold">{resource.label}</div>
                <div className="text-sm text-gray-600">{resource.description}</div>
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-purple-600" />
            Key Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={network.key_connections || ''}
            onChange={(e) => updateNetwork('key_connections', e.target.value)}
            placeholder="Ej: 'Mi ex-jefe es VP en Google y dijo que me ayudaría con intros' o 'Tengo 3 angel investors comprometidos a invertir $50K cada uno' o 'Miembro de comunidad de 500 founders tech en España'"
            rows={5}
          />
        </CardContent>
      </Card>

      <Card className="border-2 border-green-200">
        <CardHeader>
          <CardTitle>🎯 Biggest Gap in Network</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={network.biggest_network_gap || ''}
            onChange={(e) => updateNetwork('biggest_network_gap', e.target.value)}
            placeholder="Ej: 'No conozco a nadie en la industria' o 'No tengo acceso a funding' o 'No tengo mentors con experiencia en startups'"
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
}
