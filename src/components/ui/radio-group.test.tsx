import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { Label } from './label';

describe('RadioGroup Components', () => {
  describe('RadioGroup', () => {
    it('renders radio group', () => {
      render(
        <RadioGroup data-testid="radio-group">
          <RadioGroupItem value="option1" />
        </RadioGroup>
      );
      expect(screen.getByTestId('radio-group')).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(
        <RadioGroup data-testid="radio-group">
          <RadioGroupItem value="option1" />
        </RadioGroup>
      );
      const radioGroup = screen.getByTestId('radio-group');
      expect(radioGroup).toHaveClass('grid');
      expect(radioGroup).toHaveClass('gap-2');
    });

    it('applies custom className', () => {
      render(
        <RadioGroup className="custom-radio-group" data-testid="radio-group">
          <RadioGroupItem value="option1" />
        </RadioGroup>
      );
      const radioGroup = screen.getByTestId('radio-group');
      expect(radioGroup).toHaveClass('custom-radio-group');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <RadioGroup ref={ref}>
          <RadioGroupItem value="option1" />
        </RadioGroup>
      );
      expect(ref.current).not.toBeNull();
    });

    it('has correct role attribute', () => {
      render(
        <RadioGroup data-testid="radio-group">
          <RadioGroupItem value="option1" />
        </RadioGroup>
      );
      const radioGroup = screen.getByTestId('radio-group');
      expect(radioGroup).toHaveAttribute('role', 'radiogroup');
    });
  });

  describe('RadioGroupItem', () => {
    it('renders radio item', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="test" data-testid="radio-item" />
        </RadioGroup>
      );
      expect(screen.getByTestId('radio-item')).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="test" data-testid="radio-item" />
        </RadioGroup>
      );
      const radioItem = screen.getByTestId('radio-item');
      expect(radioItem).toHaveClass('aspect-square');
      expect(radioItem).toHaveClass('h-4');
      expect(radioItem).toHaveClass('w-4');
      expect(radioItem).toHaveClass('rounded-full');
      expect(radioItem).toHaveClass('border');
    });

    it('applies custom className', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="test" className="custom-item" data-testid="radio-item" />
        </RadioGroup>
      );
      const radioItem = screen.getByTestId('radio-item');
      expect(radioItem).toHaveClass('custom-item');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <RadioGroup>
          <RadioGroupItem value="test" ref={ref} />
        </RadioGroup>
      );
      expect(ref.current).not.toBeNull();
    });

    it('has correct role attribute', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="test" data-testid="radio-item" />
        </RadioGroup>
      );
      const radioItem = screen.getByTestId('radio-item');
      expect(radioItem).toHaveAttribute('role', 'radio');
    });

    it('supports disabled state', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="test" disabled data-testid="radio-item" />
        </RadioGroup>
      );
      const radioItem = screen.getByTestId('radio-item');
      expect(radioItem).toBeDisabled();
    });
  });

  describe('RadioGroup interaction', () => {
    it('selects option on click', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      render(
        <RadioGroup onValueChange={handleValueChange}>
          <RadioGroupItem value="option1" data-testid="option1" />
          <RadioGroupItem value="option2" data-testid="option2" />
        </RadioGroup>
      );

      const option1 = screen.getByTestId('option1');
      await user.click(option1);

      expect(handleValueChange).toHaveBeenCalledWith('option1');
    });

    it('changes selection between options', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      render(
        <RadioGroup onValueChange={handleValueChange}>
          <RadioGroupItem value="option1" data-testid="option1" />
          <RadioGroupItem value="option2" data-testid="option2" />
        </RadioGroup>
      );

      await user.click(screen.getByTestId('option1'));
      expect(handleValueChange).toHaveBeenCalledWith('option1');

      await user.click(screen.getByTestId('option2'));
      expect(handleValueChange).toHaveBeenCalledWith('option2');
    });

    it('does not change when disabled', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      render(
        <RadioGroup onValueChange={handleValueChange}>
          <RadioGroupItem value="option1" disabled data-testid="option1" />
        </RadioGroup>
      );

      await user.click(screen.getByTestId('option1'));
      expect(handleValueChange).not.toHaveBeenCalled();
    });
  });

  describe('RadioGroup with labels', () => {
    it('renders with labels', () => {
      render(
        <RadioGroup>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option1" id="r1" />
            <Label htmlFor="r1">Option 1</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option2" id="r2" />
            <Label htmlFor="r2">Option 2</Label>
          </div>
        </RadioGroup>
      );

      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('selects option by clicking label', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      render(
        <RadioGroup onValueChange={handleValueChange}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option1" id="r1" />
            <Label htmlFor="r1">Option 1</Label>
          </div>
        </RadioGroup>
      );

      const label = screen.getByText('Option 1');
      await user.click(label);

      expect(handleValueChange).toHaveBeenCalledWith('option1');
    });
  });

  describe('Controlled RadioGroup', () => {
    it('respects controlled value', () => {
      render(
        <RadioGroup value="option2">
          <RadioGroupItem value="option1" data-testid="option1" />
          <RadioGroupItem value="option2" data-testid="option2" />
        </RadioGroup>
      );

      const option2 = screen.getByTestId('option2');
      expect(option2).toHaveAttribute('data-state', 'checked');
    });

    it('respects defaultValue', () => {
      render(
        <RadioGroup defaultValue="option1">
          <RadioGroupItem value="option1" data-testid="option1" />
          <RadioGroupItem value="option2" data-testid="option2" />
        </RadioGroup>
      );

      const option1 = screen.getByTestId('option1');
      expect(option1).toHaveAttribute('data-state', 'checked');
    });
  });

  describe('RadioGroup composition', () => {
    it('renders complete radio group with multiple options', () => {
      render(
        <RadioGroup defaultValue="comfortable">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="default" id="r1" />
            <Label htmlFor="r1">Default</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="comfortable" id="r2" />
            <Label htmlFor="r2">Comfortable</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="compact" id="r3" />
            <Label htmlFor="r3">Compact</Label>
          </div>
        </RadioGroup>
      );

      expect(screen.getByText('Default')).toBeInTheDocument();
      expect(screen.getByText('Comfortable')).toBeInTheDocument();
      expect(screen.getByText('Compact')).toBeInTheDocument();
    });
  });
});
