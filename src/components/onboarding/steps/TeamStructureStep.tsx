/**
 * TEAM STRUCTURE STEP
 *
 * Co-founder status & integration con alignment check
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, UserPlus, Mail, AlertCircle, CheckCircle2, X } from 'lucide-react';
import type { TeamStructure } from '@/types/ultra-onboarding';

interface TeamStructureStepProps {
  teamStructure: Partial<TeamStructure>;
  onChange: (structure: Partial<TeamStructure>) => void;
}

export function TeamStructureStep({ teamStructure, onChange }: TeamStructureStepProps) {
  const [newEmail, setNewEmail] = useState('');

  const updateStructure = <K extends keyof TeamStructure>(
    key: K,
    value: TeamStructure[K]
  ) => {
    onChange({ ...teamStructure, [key]: value });
  };

  const addCofounderEmail = () => {
    if (!newEmail || !newEmail.includes('@')) return;

    const emails = teamStructure.cofounder_emails || [];
    if (emails.includes(newEmail)) return;

    updateStructure('cofounder_emails', [...emails, newEmail]);
    setNewEmail('');
  };

  const removeEmail = (email: string) => {
    const emails = (teamStructure.cofounder_emails || []).filter((e) => e !== email);
    updateStructure('cofounder_emails', emails);
  };

  const needsCofounderInput =
    teamStructure.mode === 'has_1_cofounder' || teamStructure.mode === 'has_2plus_cofounders';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">👥 Estructura del Equipo</h2>
        <p className="text-gray-600">
          ¿Vas solo/a o tienes co-founders? Esto cambia completamente el approach.
        </p>
      </div>

      {/* Team Mode Selection */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            ¿Cómo está conformado el equipo?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={teamStructure.mode}
            onValueChange={(value) => updateStructure('mode', value as TeamStructure['mode'])}
          >
            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-blue-200 cursor-pointer">
              <RadioGroupItem value="solo" id="solo" />
              <Label htmlFor="solo" className="flex-1 cursor-pointer">
                <div className="font-semibold">Solo/a</div>
                <div className="text-sm text-gray-600">
                  Voy por mi cuenta (por ahora)
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-blue-200 cursor-pointer">
              <RadioGroupItem value="has_1_cofounder" id="has_1_cofounder" />
              <Label htmlFor="has_1_cofounder" className="flex-1 cursor-pointer">
                <div className="font-semibold">Tengo 1 co-founder</div>
                <div className="text-sm text-gray-600">
                  Somos 2 personas trabajando juntos
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-blue-200 cursor-pointer">
              <RadioGroupItem value="has_2plus_cofounders" id="has_2plus_cofounders" />
              <Label htmlFor="has_2plus_cofounders" className="flex-1 cursor-pointer">
                <div className="font-semibold">Tengo 2+ co-founders</div>
                <div className="text-sm text-gray-600">
                  Somos un equipo de 3+ founders
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-blue-200 cursor-pointer">
              <RadioGroupItem value="seeking_cofounder" id="seeking_cofounder" />
              <Label htmlFor="seeking_cofounder" className="flex-1 cursor-pointer">
                <div className="font-semibold">Buscando co-founder</div>
                <div className="text-sm text-gray-600">
                  Quiero encontrar a alguien complementario
                </div>
              </Label>
            </div>
          </RadioGroup>

          {/* Tips per mode */}
          {teamStructure.mode === 'solo' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>💡 Solo founder:</strong> ~20% de startups exitosos son solo-founders
                (WhatsApp, Plenty of Fish). Es más duro pero posible. Considera advisors y early
                hires estratégicos.
              </div>
            </div>
          )}

          {teamStructure.mode === 'seeking_cofounder' && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <strong>⚠️ Buscando co-founder:</strong> Es mejor encontrar co-founder ANTES de
                empezar que durante. Busca en: YC Co-founder Matching, Indie Hackers, eventos de
                startup locales. Skillsets complementarios &gt; amigos.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Co-founder Invite Section */}
      {needsCofounderInput && (
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-purple-600" />
              🚀 Co-founder Alignment Check
            </CardTitle>
            <CardDescription>
              Invita a tu(s) co-founder(s) a completar el onboarding. Compararemos respuestas para
              detectar misalignments ANTES de que se conviertan en problemas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email Input */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="cofounder_email" className="text-sm font-medium mb-2 block">
                  Email de co-founder
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="cofounder_email"
                    type="email"
                    placeholder="cofounder@email.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCofounderEmail()}
                  />
                  <Button onClick={addCofounderEmail} size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Invitar
                  </Button>
                </div>
              </div>
            </div>

            {/* Email List */}
            {teamStructure.cofounder_emails && teamStructure.cofounder_emails.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Co-founders invitados:</Label>
                <div className="space-y-2">
                  {teamStructure.cofounder_emails.map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-purple-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <Mail className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium">{email}</div>
                          <div className="text-xs text-gray-600">
                            Invite pendiente • Se enviará al completar
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEmail(email)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="p-4 bg-white rounded-lg border-2 border-purple-300">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-semibold text-purple-900 mb-2">
                    Qué pasa después de invitar:
                  </div>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Enviaremos email con link único</li>
                    <li>• Cada co-founder completa su onboarding</li>
                    <li>• IA compara respuestas y detecta misalignments</li>
                    <li>• Recibes alignment score + áreas de discusión</li>
                    <li>• Si {'<'}60% aligned → Recomendamos conversación urgente</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Optional: Why this matters */}
            <div className="p-3 bg-purple-100 border border-purple-300 rounded-lg">
              <div className="text-sm text-purple-900">
                <strong>📊 Data:</strong> 65% de startups fallan por conflictos entre co-founders.
                Detectar misalignments en visión, equity, commitment y valores AHORA previene
                breakups dolorosos después.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roles & Equity (if has cofounders) */}
      {needsCofounderInput && (
        <Card className="border-2 border-green-200">
          <CardHeader>
            <CardTitle>🎯 Roles & Equity</CardTitle>
            <CardDescription>
              ¿Ya definieron roles claros y equity split?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="roles_defined"
                checked={teamStructure.roles_defined}
                onCheckedChange={(checked) => updateStructure('roles_defined', !!checked)}
              />
              <Label htmlFor="roles_defined" className="cursor-pointer">
                ✅ Roles claros definidos (quién hace qué)
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="equity_split"
                checked={teamStructure.equity_split_agreed}
                onCheckedChange={(checked) => updateStructure('equity_split_agreed', !!checked)}
              />
              <Label htmlFor="equity_split" className="cursor-pointer">
                ✅ Equity split acordado y documentado
              </Label>
            </div>

            {!teamStructure.roles_defined && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-orange-800">
                  <strong>Importante:</strong> Definan roles ASAP. Recomendación: 1 persona es CEO
                  (final decision), otros son CTO/CPO/etc. Avoid "co-CEOs".
                </div>
              </div>
            )}

            {!teamStructure.equity_split_agreed && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-orange-800">
                  <strong>Crítico:</strong> El equity split debe acordarse ANTES de empezar a
                  trabajar. Regla de oro: Equal split (50/50 o 33/33/33) con 4-year vesting, 1-year
                  cliff. Documéntenlo legalmente.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
