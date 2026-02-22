import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function BackButton({ onClick, disabled = false, className, label = 'Volver' }: BackButtonProps) {
  if (disabled) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn("gap-2", className)}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </Button>
  );
}
