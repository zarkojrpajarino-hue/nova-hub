/**
 * FEEDBACK STAR RATING COMPONENT
 *
 * Componente de rating con estrellas (1-5)
 * Usado en el sistema de feedback 360°
 */

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedbackStarRatingProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  required?: boolean;
}

export function FeedbackStarRating({
  value,
  onChange,
  label,
  description,
  disabled = false,
  required = false,
}: FeedbackStarRatingProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {value > 0 && (
          <span className="text-xs text-muted-foreground">
            {value}/5
          </span>
        )}
      </div>

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !disabled && onChange(star)}
            onMouseEnter={() => !disabled && onChange(star)}
            disabled={disabled}
            className={cn(
              'transition-all duration-150 hover:scale-110',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <Star
              size={32}
              className={cn(
                'transition-colors',
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 dark:text-gray-600'
              )}
            />
          </button>
        ))}
      </div>

      {!disabled && value === 0 && required && (
        <p className="text-xs text-red-500">Este campo es obligatorio</p>
      )}
    </div>
  );
}
