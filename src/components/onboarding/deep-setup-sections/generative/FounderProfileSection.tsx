/**
 * 👤 FOUNDER PROFILE SECTION
 *
 * Build comprehensive founder profile
 * Unlocks: Team Builder, Co-founder Matcher
 * Progress: +10%
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight, CheckCircle2, Users, Briefcase, GraduationCap, Target } from 'lucide-react';
import { toast } from 'sonner';

import { useTranslation } from 'react-i18next';
interface FounderProfileSectionProps {
  projectId: string;
  onComplete: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}

export function FounderProfileSection({ projectId: _projectId, onComplete, onCancel }: FounderProfileSectionProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    background: '',
    skills: '',
    experience_years: '',
    motivation: '',
    time_commitment: '',
    looking_for_cofounders: false,
  });

  const canSubmit = () => {
    return formData.name && formData.background && formData.skills;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    onComplete({
      section_id: 'founder-profile',
      ...formData,
      unlocked_tools: [t('onboarding.teamBuilder'), t('onboarding.cofounderMatcher')],
    });

    toast.success(t('onboarding.founderProfileComplete'));
  };

  if (isSubmitting) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="pt-12 pb-12 text-center">
          <Loader2 className="h-10 w-10 text-purple-600 animate-spin mx-auto mb-4" />
          <h3 className="text-2xl font-bold">{t('onboarding.savingYourProfile')}</h3>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">{t('onboarding.founderProfile')}</CardTitle>
              <CardDescription>{t('onboarding.buildYourComprehensiveFounder')}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />{t('onboarding.basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t('onboarding.fullName')}</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('onboarding.johnDoe')}
              />
            </div>
            <div>
              <Label>{t('onboarding.yearsOfExperience')}</Label>
              <Input
                type="number"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                placeholder="5"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />{t('onboarding.background')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t('onboarding.professionalBackground')}</Label>
              <Textarea
                value={formData.background}
                onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                placeholder={t('onboarding.eg5YearsIn')}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5" />{t('onboarding.skillsExpertise')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t('onboarding.keySkills')}</Label>
              <Textarea
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder={t('onboarding.egPythonReactProduct')}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />{t('onboarding.motivationCommitment')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t('onboarding.whyThisBusiness')}</Label>
              <Textarea
                value={formData.motivation}
                onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                placeholder={t('onboarding.whatMotivatesYouTo')}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between pt-6 border-t">
        <Button variant="outline" onClick={onCancel}>{t('onboarding.cancel')}</Button>
        <div className="flex items-center gap-3">
          <Badge variant="outline">+10%</Badge>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit()}
            className="bg-gradient-to-r from-purple-600 to-pink-600"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />Complete Section<ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
