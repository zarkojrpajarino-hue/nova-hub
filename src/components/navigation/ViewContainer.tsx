import { ReactNode } from 'react';
import { BackButton } from './BackButton';

interface ViewContainerProps {
  children: ReactNode;
  onBack?: () => void;
  showBackButton?: boolean;
  title?: string;
  className?: string;
}

export function ViewContainer({
  children,
  onBack,
  showBackButton = false,
  title,
  className = ''
}: ViewContainerProps) {
  return (
    <div className={`flex-1 ${className}`}>
      {showBackButton && onBack && (
        <div className="p-4 border-b border-border bg-card/50">
          <BackButton onClick={onBack} />
        </div>
      )}
      {children}
    </div>
  );
}
