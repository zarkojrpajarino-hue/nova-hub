/**
 * EDTECH / EDUCATION SPECIFIC QUESTIONS
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { GraduationCap, Users, BookOpen, Award } from 'lucide-react';
import type { EdTechAnswers } from '@/types/ultra-onboarding';

interface EdTechQuestionsProps {
  answers: Partial<EdTechAnswers>;
  onChange: (answers: Partial<EdTechAnswers>) => void;
}

export function EdTechQuestions({ answers, onChange }: EdTechQuestionsProps) {
  const updateAnswer = <K extends keyof EdTechAnswers>(key: K, value: EdTechAnswers[K]) => {
    onChange({ ...answers, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">🎓 EdTech - Preguntas Específicas</h2>
      </div>

      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Target Audience
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={answers.target_audience} onValueChange={(value) => updateAnswer('target_audience', value as any)}>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="k12_students" id="k12" />
              <Label htmlFor="k12" className="cursor-pointer">K-12 Students (niños/adolescentes)</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="university" id="university" />
              <Label htmlFor="university" className="cursor-pointer">University students</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="professionals" id="professionals" />
              <Label htmlFor="professionals" className="cursor-pointer">Profesionales (upskilling/reskilling)</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="lifelong_learners" id="lifelong" />
              <Label htmlFor="lifelong" className="cursor-pointer">Lifelong learners (hobbyists)</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="teachers" id="teachers" />
              <Label htmlFor="teachers" className="cursor-pointer">Teachers/Instructors</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-purple-600" />
            Business Model
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={answers.edtech_model} onValueChange={(value) => updateAnswer('edtech_model', value as any)}>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="b2c_direct" id="b2c" className="mt-1" />
              <Label htmlFor="b2c" className="flex-1 cursor-pointer">
                <div className="font-semibold">B2C - Estudiantes pagan directo</div>
                <div className="text-sm text-gray-600">Coursera, Duolingo model</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="b2b_schools" id="b2b_schools" className="mt-1" />
              <Label htmlFor="b2b_schools" className="flex-1 cursor-pointer">
                <div className="font-semibold">B2B - Escuelas/Universidades</div>
                <div className="text-sm text-gray-600">Instituciones compran licencias</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="b2b_corporate" id="b2b_corp" className="mt-1" />
              <Label htmlFor="b2b_corp" className="flex-1 cursor-pointer">
                <div className="font-semibold">B2B - Corporate training</div>
                <div className="text-sm text-gray-600">Empresas entrenan empleados</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="marketplace" id="marketplace" className="mt-1" />
              <Label htmlFor="marketplace" className="flex-1 cursor-pointer">
                <div className="font-semibold">Marketplace de instructores</div>
                <div className="text-sm text-gray-600">Udemy, Skillshare model</div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="border-2 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-green-600" />
            Contenido & Pedagogía
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">¿De dónde viene el contenido?</Label>
            <RadioGroup value={answers.content_source} onValueChange={(value) => updateAnswer('content_source', value as any)}>
              <div className="flex items-center space-x-2 p-2">
                <RadioGroupItem value="proprietary" id="proprietary" />
                <Label htmlFor="proprietary" className="cursor-pointer">Contenido propietario (creamos nosotros)</Label>
              </div>
              <div className="flex items-center space-x-2 p-2">
                <RadioGroupItem value="instructor_created" id="instructors" />
                <Label htmlFor="instructors" className="cursor-pointer">Instructores externos crean contenido</Label>
              </div>
              <div className="flex items-center space-x-2 p-2">
                <RadioGroupItem value="ai_generated" id="ai" />
                <Label htmlFor="ai" className="cursor-pointer">IA-generated content</Label>
              </div>
              <div className="flex items-center space-x-2 p-2">
                <RadioGroupItem value="user_generated" id="ugc" />
                <Label htmlFor="ugc" className="cursor-pointer">User-generated content</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="learning_format">Formato de aprendizaje principal</Label>
            <Textarea
              id="learning_format"
              value={answers.learning_format || ''}
              onChange={(e) => updateAnswer('learning_format', e.target.value)}
              placeholder="Ej: 'Videos cortos + quizzes interactivos + proyectos prácticos' o 'Live classes + peer learning + AI tutor'"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-orange-600" />
            Certificación & Outcomes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">¿Ofreces certificación?</Label>
            <RadioGroup value={answers.certification_type} onValueChange={(value) => updateAnswer('certification_type', value as any)}>
              <div className="flex items-center space-x-2 p-2">
                <RadioGroupItem value="accredited" id="accredited" />
                <Label htmlFor="accredited" className="cursor-pointer">Certificación acreditada (oficial)</Label>
              </div>
              <div className="flex items-center space-x-2 p-2">
                <RadioGroupItem value="platform_certificate" id="platform_cert" />
                <Label htmlFor="platform_cert" className="cursor-pointer">Certificado de plataforma (no acreditado)</Label>
              </div>
              <div className="flex items-center space-x-2 p-2">
                <RadioGroupItem value="skills_only" id="skills" />
                <Label htmlFor="skills" className="cursor-pointer">No certificación, solo skill-building</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="completion_rate">Target completion rate (%)</Label>
            <Input
              id="completion_rate"
              type="number"
              placeholder="60"
              value={answers.target_completion_rate || ''}
              onChange={(e) => updateAnswer('target_completion_rate', parseInt(e.target.value) || undefined)}
            />
            <p className="text-xs text-gray-700 mt-1">
              MOOC avg: 5-15%. Paid courses: 30-50%. Live cohorts: 60-80%
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
