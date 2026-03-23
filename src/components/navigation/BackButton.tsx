import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useTranslation } from 'react-i18next';
interface BackButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function BackButton({ onClick, disabled = false, className, label = t('navigation.volver') }: BackButtonProps) {
  const { t: _t } = useTranslation();
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
