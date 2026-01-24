import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
  SelectSeparator,
  SelectGroup,
} from './select';

describe('Select Components', () => {
  describe('Select basic rendering', () => {
    it('renders select trigger', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
        </Select>
      );
      expect(screen.getByText('Select option')).toBeInTheDocument();
    });

    it('renders select trigger with custom content', () => {
      render(
        <Select>
          <SelectTrigger data-testid="trigger">
            <SelectValue placeholder="Choose an option" />
          </SelectTrigger>
        </Select>
      );

      expect(screen.getByTestId('trigger')).toBeInTheDocument();
      expect(screen.getByText('Choose an option')).toBeInTheDocument();
    });
  });

  describe('SelectTrigger', () => {
    it('applies custom className', () => {
      render(
        <Select>
          <SelectTrigger className="custom-trigger" data-testid="trigger">
            <SelectValue />
          </SelectTrigger>
        </Select>
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).toHaveClass('custom-trigger');
    });

    it('applies base classes', () => {
      render(
        <Select>
          <SelectTrigger data-testid="trigger">
            <SelectValue />
          </SelectTrigger>
        </Select>
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).toHaveClass('flex');
      expect(trigger).toHaveClass('h-10');
      expect(trigger).toHaveClass('w-full');
      expect(trigger).toHaveClass('rounded-md');
    });

    it('supports disabled state', () => {
      render(
        <Select disabled>
          <SelectTrigger data-testid="trigger">
            <SelectValue />
          </SelectTrigger>
        </Select>
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).toBeDisabled();
    });

    it('has correct button role', () => {
      render(
        <Select>
          <SelectTrigger data-testid="trigger">
            <SelectValue />
          </SelectTrigger>
        </Select>
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).toHaveAttribute('role', 'combobox');
    });
  });

  describe('Select controlled state', () => {
    it('respects value prop', () => {
      render(
        <Select value="option2">
          <SelectTrigger data-testid="trigger">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).toHaveTextContent('Option 2');
    });
  });

  describe('Select with defaultValue', () => {
    it('uses defaultValue on mount', () => {
      render(
        <Select defaultValue="option1">
          <SelectTrigger data-testid="trigger">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByTestId('trigger');
      expect(trigger).toHaveTextContent('Option 1');
    });
  });

  describe('SelectValue', () => {
    it('displays placeholder when no value selected', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
        </Select>
      );

      expect(screen.getByText('Select an option')).toBeInTheDocument();
    });

    it('displays selected value', () => {
      render(
        <Select value="test">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="test">Test Value</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByText('Test Value')).toBeInTheDocument();
    });
  });
});
