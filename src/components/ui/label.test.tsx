import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Label } from './label';

describe('Label', () => {
  it('renders label text', () => {
    render(<Label>Username</Label>);
    expect(screen.getByText('Username')).toBeInTheDocument();
  });

  it('applies htmlFor attribute', () => {
    render(<Label htmlFor="email-input">Email</Label>);
    const label = screen.getByText('Email');
    expect(label).toHaveAttribute('for', 'email-input');
  });

  it('applies custom className', () => {
    render(<Label className="custom-label">Label</Label>);
    const label = screen.getByText('Label');
    expect(label).toHaveClass('custom-label');
  });

  it('applies base classes', () => {
    render(<Label>Label</Label>);
    const label = screen.getByText('Label');
    expect(label).toHaveClass('text-sm');
    expect(label).toHaveClass('font-medium');
    expect(label).toHaveClass('leading-none');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Label ref={ref}>Label</Label>);
    expect(ref.current).not.toBeNull();
  });

  it('renders with additional props', () => {
    render(
      <Label data-testid="test-label" id="label-1">
        Test Label
      </Label>
    );
    const label = screen.getByTestId('test-label');
    expect(label).toHaveAttribute('id', 'label-1');
  });

  it('renders as label element', () => {
    const { container } = render(<Label>Label Text</Label>);
    const label = container.querySelector('label');
    expect(label).toBeInTheDocument();
    expect(label).toHaveTextContent('Label Text');
  });

  it('associates with input element', () => {
    render(
      <div>
        <Label htmlFor="username">Username</Label>
        <input id="username" type="text" />
      </div>
    );

    const label = screen.getByText('Username');
    const input = document.getElementById('username');

    expect(label).toHaveAttribute('for', 'username');
    expect(input).toHaveAttribute('id', 'username');
  });

  it('renders complex content', () => {
    render(
      <Label>
        Required Field <span className="text-red-500">*</span>
      </Label>
    );

    expect(screen.getByText(/Required Field/)).toBeInTheDocument();
  });

  it('supports aria-label', () => {
    render(<Label aria-label="Form field label">Field</Label>);
    const label = screen.getByText('Field');
    expect(label).toHaveAttribute('aria-label', 'Form field label');
  });
});
