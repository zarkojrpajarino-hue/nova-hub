/**
 * STRATEGIC QUESTIONS STEP
 *
 * Componente para mostrar preguntas estratégicas FASE 2
 * Se renderiza después de las preguntas básicas
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Info, Plus, X } from 'lucide-react';
import { StrategicQuestions, STRATEGIC_QUESTIONS_CONFIG } from '@/types/strategic-questions';

interface FieldOption {
  value: string;
  label: string;
}

interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'array';
  placeholder?: string;
  prefix?: string;
  maxItems?: number;
  options?: Array<string | FieldOption>;
}

interface StrategicQuestionsStepProps {
  data: Partial<StrategicQuestions>;
  onUpdate: (data: Partial<StrategicQuestions>) => void;
  onNext: () => void;
  onBack: () => void;
  section: keyof typeof STRATEGIC_QUESTIONS_CONFIG;
}

export function StrategicQuestionsStep({
  data,
  onUpdate,
  onNext,
  onBack,
  section,
}: StrategicQuestionsStepProps) {
  const config = STRATEGIC_QUESTIONS_CONFIG[section];
  const [sectionData, setSectionData] = useState<Record<string, unknown>>(data[section] as Record<string, unknown> || {});
  const [arrayInputs, setArrayInputs] = useState<Record<string, string>>({});

  const handleFieldChange = (fieldName: string, value: unknown) => {
    const updated = {
      ...sectionData,
      [fieldName]: value,
    };
    setSectionData(updated);
    onUpdate({
      ...data,
      [section]: updated,
    });
  };

  const handleArrayAdd = (fieldName: string) => {
    const inputValue = arrayInputs[fieldName]?.trim();
    if (!inputValue) return;

    const currentArray = sectionData[fieldName] || [];
    const field = config.fields.find((f) => f.name === fieldName);
    const maxItems = (field as FieldConfig).maxItems;

    if (maxItems && currentArray.length >= maxItems) {
      return;
    }

    handleFieldChange(fieldName, [...currentArray, inputValue]);
    setArrayInputs({ ...arrayInputs, [fieldName]: '' });
  };

  const handleArrayRemove = (fieldName: string, index: number) => {
    const currentArray = sectionData[fieldName] || [];
    handleFieldChange(
      fieldName,
      (currentArray as unknown[]).filter((_: unknown, i: number) => i !== index)
    );
  };

  const handleMultiSelectToggle = (fieldName: string, option: string) => {
    const currentArray = sectionData[fieldName] || [];
    const isSelected = currentArray.includes(option);

    if (isSelected) {
      handleFieldChange(
        fieldName,
        currentArray.filter((item: string) => item !== option)
      );
    } else {
      handleFieldChange(fieldName, [...currentArray, option]);
    }
  };

  const renderField = (field: FieldConfig) => {
    const value = sectionData[field.name];

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
          />
        );

      case 'number':
        return (
          <div className="relative">
            {field.prefix && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                {field.prefix}
              </span>
            )}
            <Input
              type="number"
              value={value || ''}
              onChange={(e) => handleFieldChange(field.name, parseInt(e.target.value) || 0)}
              placeholder={field.placeholder}
              className={field.prefix ? 'pl-8' : ''}
            />
          </div>
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
          />
        );

      case 'select':
        return (
          <Select value={value || ''} onValueChange={(val) => handleFieldChange(field.name, val)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {(Array.isArray(field.options) ? field.options : []).map((option: string | FieldOption) => {
                const optionValue = typeof option === 'string' ? option : option.value;
                const optionLabel = typeof option === 'string' ? option : option.label;
                return (
                  <SelectItem key={optionValue} value={optionValue}>
                    {optionLabel}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {(field.options || []).map((option: string) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.name}-${option}`}
                  checked={(value || []).includes(option)}
                  onCheckedChange={() => handleMultiSelectToggle(field.name, option)}
                />
                <label
                  htmlFor={`${field.name}-${option}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        );

      case 'array': {
        const arrayValues = value || [];
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={arrayInputs[field.name] || ''}
                onChange={(e) =>
                  setArrayInputs({ ...arrayInputs, [field.name]: e.target.value })
                }
                placeholder={field.placeholder}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleArrayAdd(field.name);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleArrayAdd(field.name)}
                disabled={field.maxItems && arrayValues.length >= field.maxItems}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {arrayValues.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {arrayValues.map((item: string, index: number) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {item}
                    <button
                      type="button"
                      onClick={() => handleArrayRemove(field.name, index)}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {field.maxItems && (
              <p className="text-xs text-gray-500">
                {arrayValues.length} / {field.maxItems} items
              </p>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {config.label}
          <Info className="h-4 w-4 text-gray-400" />
        </h3>
        <p className="text-sm text-gray-600 mt-1">{config.description}</p>
      </div>

      <div className="space-y-6">
        {config.fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.type !== 'multiselect' && field.type !== 'array' && (
                <span className="text-gray-400 text-xs ml-2">(opcional)</span>
              )}
            </Label>
            {renderField(field)}
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={onBack}>
          Anterior
        </Button>
        <Button type="button" onClick={onNext}>
          Siguiente
        </Button>
      </div>
    </div>
  );
}
