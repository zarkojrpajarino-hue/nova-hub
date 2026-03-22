/**
 * EQ26.4 — Mini-onboarding para miembros invitados (3 pantallas)
 *
 * Screen 1: Bienvenida + contexto del proyecto
 * Screen 2: Perfil profesional (experience, skills, availability)
 * Screen 3: Primera misión (CTA → dashboard)
 *
 * Guarda role_profile en project_members.
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Rocket, Users, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ROLE_CONFIG } from '@/data/mockData';
import type { Json } from '@/integrations/supabase/types';

interface MemberOnboardingProps {
  projectId: string;
  projectName: string;
  role: string;
  memberId: string;
  membershipId: string;
  onComplete: () => void;
}

export function MemberOnboarding({
  _projectId,
  projectName,
  role,
  _memberId,
  membershipId,
  onComplete,
}: MemberOnboardingProps) {
  const [step, setStep] = useState(0);
  const [experienceLevel, setExperienceLevel] = useState('mid');
  const [skills, setSkills] = useState('');
  const [tools, setTools] = useState('');
  const [availabilityHours, setAvailabilityHours] = useState(10);
  const [saving, setSaving] = useState(false);

  const roleConfig = ROLE_CONFIG[role];

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const roleProfile = {
        experience_level: experienceLevel,
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        tools: tools.split(',').map(s => s.trim()).filter(Boolean),
        availability_hours: availabilityHours,
        onboarded_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('project_members')
        .update({
          role_profile: roleProfile as unknown as Json,
          role_accepted: true,
          role_accepted_at: new Date().toISOString(),
        })
        .eq('id', membershipId);

      if (error) throw error;
      setStep(2);
    } catch {
      toast.error('Error al guardar perfil');
    } finally {
      setSaving(false);
    }
  };

  if (step === 0) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">¡Bienvenido a {projectName}!</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Te han invitado como <strong>{roleConfig?.label ?? role}</strong>.
            </p>
            {roleConfig?.desc && (
              <p className="text-xs text-muted-foreground mb-6">{roleConfig.desc}</p>
            )}
            <Button onClick={() => setStep(1)} className="gap-2">
              Configurar mi perfil <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="text-center mb-4">
              <Briefcase className="h-10 w-10 text-blue-600 mx-auto mb-2" />
              <h2 className="text-lg font-bold">Tu perfil profesional</h2>
            </div>

            <div className="space-y-1.5">
              <Label>Nivel de experiencia</Label>
              <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">Junior (0-2 años)</SelectItem>
                  <SelectItem value="mid">Mid (2-5 años)</SelectItem>
                  <SelectItem value="senior">Senior (5+ años)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Skills principales (separados por coma)</Label>
              <Input
                placeholder="ej. Excel, Ventas B2B, CRM"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Herramientas que dominas (separados por coma)</Label>
              <Input
                placeholder="ej. HubSpot, Slack, Notion"
                value={tools}
                onChange={(e) => setTools(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Horas disponibles por semana</Label>
              <Input
                type="number"
                min={1}
                max={40}
                value={availabilityHours}
                onChange={(e) => setAvailabilityHours(Number(e.target.value))}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar y continuar'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardContent className="pt-8 pb-8 text-center">
          <Rocket className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">¡Listo!</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Tu perfil está configurado. Ahora puedes empezar a trabajar en el proyecto.
          </p>
          <Button onClick={onComplete} className="gap-2">
            Ir a mi dashboard <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
