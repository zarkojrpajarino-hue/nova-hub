/**
 * 🔧 GENERIC DEEP SETUP SECTION
 * Reusable template for quick section implementation
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight, CheckCircle2, LucideIcon } from 'lucide-react';
import { toast } from 'sonner';

interface GenericSectionProps {
  projectId: string;
  sectionId: string;
  title: string;
  description: string;
  icon: LucideIcon;
  gradientFrom: string;
  gradientTo: string;
  fields: Array<{
    label: string;
    placeholder: string;
    required?: boolean;
  }>;
  progressValue: number;
  unlockedTools: string[];
  onComplete: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}

export function GenericSection({
  projectId: _projectId,
  sectionId,
  title,
  description,
  icon: Icon,
  gradientFrom,
  gradientTo,
  fields,
  progressValue,
  unlockedTools,
  onComplete,
  onCancel,
}: GenericSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const canSubmit = () => {
    return fields
      .filter(f => f.required)
      .every(f => formData[f.label]?.trim());
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    onComplete({
      section_id: sectionId,
      ...formData,
      unlocked_tools: unlockedTools,
    });

    toast.success(`${title} complete!`);
  };

  if (isSubmitting) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="pt-12 pb-12 text-center">
          <Loader2 className={`h-10 w-10 ${gradientFrom.replace('from-', 'text-')} animate-spin mx-auto mb-4`} />
          <h3 className="text-2xl font-bold">Saving {title.toLowerCase()}...</h3>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className={`border-2 ${gradientFrom.replace('from-', 'border-')}`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-lg flex items-center justify-center`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {fields.map((field, index) => (
            <div key={index}>
              <label className="block text-sm font-medium mb-2">
                {field.label} {field.required && <span className="text-red-600">*</span>}
              </label>
              <Textarea
                placeholder={field.placeholder}
                rows={3}
                value={formData[field.label] || ''}
                onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between pt-6 border-t">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <div className="flex items-center gap-3">
          <Badge variant="outline">+{progressValue}%</Badge>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit()}
            className={`bg-gradient-to-r ${gradientFrom} ${gradientTo}`}
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
