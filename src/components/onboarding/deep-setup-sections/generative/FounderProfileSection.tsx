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

interface FounderProfileSectionProps {
  projectId: string;
  onComplete: (data: any) => void;
  onCancel: () => void;
}

export function FounderProfileSection({ projectId, onComplete, onCancel }: FounderProfileSectionProps) {
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
      unlocked_tools: ['Team Builder', 'Co-founder Matcher'],
    });

    toast.success('Founder Profile complete!');
  };

  if (isSubmitting) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="pt-12 pb-12 text-center">
          <Loader2 className="h-10 w-10 text-purple-600 animate-spin mx-auto mb-4" />
          <h3 className="text-2xl font-bold">Saving your profile...</h3>
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
              <CardTitle className="text-2xl">Founder Profile</CardTitle>
              <CardDescription>Build your comprehensive founder profile</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Basic Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label>Years of Experience</Label>
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
              <GraduationCap className="h-5 w-5" />
              Background
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Professional Background</Label>
              <Textarea
                value={formData.background}
                onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                placeholder="e.g., 5 years in software engineering at Google, 2 years as product manager..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Skills & Expertise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Key Skills</Label>
              <Textarea
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="e.g., Python, React, Product Management, Marketing, Sales..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Motivation & Commitment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Why This Business?</Label>
              <Textarea
                value={formData.motivation}
                onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                placeholder="What motivates you to start this business?"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between pt-6 border-t">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <div className="flex items-center gap-3">
          <Badge variant="outline">+10%</Badge>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit()}
            className="bg-gradient-to-r from-purple-600 to-pink-600"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Complete Section
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
