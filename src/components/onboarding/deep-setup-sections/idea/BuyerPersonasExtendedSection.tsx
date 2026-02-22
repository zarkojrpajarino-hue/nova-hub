/**
 * 👥 BUYER PERSONAS EXTENDED SECTION
 * Create 3-5 detailed personas with jobs-to-be-done
 * Unlocks: Persona Builder, Journey Mapper | +10%
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight, CheckCircle2, Users, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface BuyerPersonasExtendedSectionProps {
  projectId: string;
  onComplete: (data: any) => void;
  onCancel: () => void;
}

export function BuyerPersonasExtendedSection({ projectId, onComplete, onCancel }: BuyerPersonasExtendedSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [personas, setPersonas] = useState([
    { name: '', role: '', goals: '', pain_points: '', buying_behavior: '' }
  ]);

  const addPersona = () => {
    if (personas.length < 5) {
      setPersonas([...personas, { name: '', role: '', goals: '', pain_points: '', buying_behavior: '' }]);
    }
  };

  const removePersona = (index: number) => {
    if (personas.length > 1) {
      setPersonas(personas.filter((_, i) => i !== index));
    }
  };

  const updatePersona = (index: number, field: string, value: string) => {
    const updated = [...personas];
    updated[index] = { ...updated[index], [field]: value };
    setPersonas(updated);
  };

  const canSubmit = () => personas.some(p => p.name && p.role && p.goals);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    onComplete({
      section_id: 'buyer-personas-extended',
      personas: personas.filter(p => p.name),
      unlocked_tools: ['Persona Builder', 'Journey Mapper'],
    });
    toast.success('Buyer Personas complete!');
  };

  if (isSubmitting) {
    return (
      <Card className="max-w-4xl mx-auto"><CardContent className="pt-12 pb-12 text-center">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4" />
        <h3 className="text-2xl font-bold">Creating personas...</h3>
      </CardContent></Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Extended Buyer Personas</CardTitle>
            </div>
            <Button onClick={addPersona} disabled={personas.length >= 5} size="sm">
              <Plus className="h-4 w-4 mr-2" />Add Persona
            </Button>
          </div>
        </CardHeader>
      </Card>

      {personas.map((persona, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Persona #{index + 1}</h3>
              {personas.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removePersona(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Name (e.g., Tech-Savvy Maria)"
                value={persona.name}
                onChange={(e) => updatePersona(index, 'name', e.target.value)} />
              <Input placeholder="Role (e.g., Marketing Manager)"
                value={persona.role}
                onChange={(e) => updatePersona(index, 'role', e.target.value)} />
            </div>
            <Textarea placeholder="Goals (what they want to achieve)" rows={2}
              value={persona.goals}
              onChange={(e) => updatePersona(index, 'goals', e.target.value)} />
            <Textarea placeholder="Pain points (what frustrates them)" rows={2}
              value={persona.pain_points}
              onChange={(e) => updatePersona(index, 'pain_points', e.target.value)} />
            <Textarea placeholder="Buying behavior (how they make decisions)" rows={2}
              value={persona.buying_behavior}
              onChange={(e) => updatePersona(index, 'buying_behavior', e.target.value)} />
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <div className="flex items-center gap-3">
          <Badge>+10%</Badge>
          <Button onClick={handleSubmit} disabled={!canSubmit()} className="bg-gradient-to-r from-blue-600 to-indigo-600">
            <CheckCircle2 className="h-4 w-4 mr-2" />Complete<ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
