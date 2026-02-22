/**
 * Strict Mode Exit Dialog
 *
 * Shown when strict mode validation fails
 * Gives user options: search more / continue as hypothesis / cancel
 */

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Search, FileQuestion, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { StrictModeExitOptions } from '@/lib/evidence/types';

interface StrictModeExitDialogProps {
  open: boolean;
  options: StrictModeExitOptions;
  onAction: (action: 'search_more' | 'continue_as_hypothesis' | 'cancel') => void;
}

export function StrictModeExitDialog({
  open,
  options,
  onAction,
}: StrictModeExitDialogProps) {
  const coveragePercent = Math.round(
    (options.current_coverage / options.required_coverage) * 100
  );

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-yellow-500/10 p-3">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <AlertDialogTitle>Strict Mode: Evidence Requirements Not Met</AlertDialogTitle>
              <AlertDialogDescription>
                {options.reason === 'insufficient_sources' &&
                  'Not enough evidence sources found'}
                {options.reason === 'conflicting_evidence' &&
                  'Sources provide conflicting information'}
                {options.reason === 'no_tier_1_or_2' &&
                  'Requires at least one user document or official API source'}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Status */}
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Evidence Coverage</span>
                <span className="text-muted-foreground">
                  {options.current_coverage}% / {options.required_coverage}% required
                </span>
              </div>
              <Progress value={coveragePercent} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{options.sources_found}</p>
                <p className="text-xs text-muted-foreground">
                  of {options.sources_required} sources found
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">
                  {options.required_coverage - options.current_coverage}%
                </p>
                <p className="text-xs text-muted-foreground">Coverage gap</p>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">What would you like to do?</p>

            {options.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => onAction(option.action)}
                className="w-full p-4 border rounded-lg text-left hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                    {option.action === 'search_more' && (
                      <Search className="h-4 w-4 text-primary" />
                    )}
                    {option.action === 'continue_as_hypothesis' && (
                      <FileQuestion className="h-4 w-4 text-primary" />
                    )}
                    {option.action === 'cancel' && (
                      <X className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{option.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {option.description}
                    </p>
                    {option.warning && (
                      <Alert className="mt-2 bg-yellow-500/10 border-yellow-500/20">
                        <AlertTriangle className="h-3 w-3 text-yellow-600" />
                        <AlertDescription className="text-xs text-yellow-700">
                          {option.warning}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
