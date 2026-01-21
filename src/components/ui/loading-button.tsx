import { forwardRef } from 'react';
import { Button, ButtonProps } from './button';
import { Loader2 } from 'lucide-react';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
}

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading, children, disabled, ...props }, ref) => {
    return (
      <Button ref={ref} disabled={disabled || loading} {...props}>
        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {children}
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';
