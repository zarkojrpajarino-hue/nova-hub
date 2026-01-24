import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from './textarea';

describe('Textarea', () => {
  it('renders correctly', () => {
    render(<Textarea data-testid="textarea" />);
    expect(screen.getByTestId('textarea')).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<Textarea placeholder="Enter your message" />);
    expect(screen.getByPlaceholderText('Enter your message')).toBeInTheDocument();
  });

  it('accepts user input', async () => {
    const user = userEvent.setup();
    render(<Textarea data-testid="textarea" />);

    const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
    await user.type(textarea, 'Test message');

    expect(textarea.value).toBe('Test message');
  });

  it('calls onChange handler', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Textarea data-testid="textarea" onChange={handleChange} />);

    const textarea = screen.getByTestId('textarea');
    await user.type(textarea, 'a');

    expect(handleChange).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = render(<Textarea className="custom-class" />);
    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveClass('custom-class');
  });

  it('applies base classes', () => {
    const { container } = render(<Textarea />);
    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveClass('flex');
    expect(textarea).toHaveClass('min-h-[80px]');
    expect(textarea).toHaveClass('w-full');
    expect(textarea).toHaveClass('rounded-md');
    expect(textarea).toHaveClass('border');
  });

  it('handles disabled state', () => {
    render(<Textarea disabled data-testid="textarea" />);
    const textarea = screen.getByTestId('textarea');
    expect(textarea).toBeDisabled();
  });

  it('handles value prop', () => {
    render(<Textarea value="controlled value" onChange={() => {}} data-testid="textarea" />);
    const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe('controlled value');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Textarea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('supports rows attribute', () => {
    render(<Textarea rows={5} data-testid="textarea" />);
    const textarea = screen.getByTestId('textarea');
    expect(textarea).toHaveAttribute('rows', '5');
  });

  it('supports maxLength attribute', () => {
    render(<Textarea maxLength={100} data-testid="textarea" />);
    const textarea = screen.getByTestId('textarea');
    expect(textarea).toHaveAttribute('maxlength', '100');
  });

  it('forwards all native textarea props', () => {
    render(
      <Textarea
        data-testid="textarea"
        autoComplete="off"
        required
        aria-label="Message field"
        id="message"
      />
    );

    const textarea = screen.getByTestId('textarea');
    expect(textarea).toHaveAttribute('autocomplete', 'off');
    expect(textarea).toBeRequired();
    expect(textarea).toHaveAttribute('aria-label', 'Message field');
    expect(textarea).toHaveAttribute('id', 'message');
  });

  it('handles multiline text input', async () => {
    const user = userEvent.setup();
    render(<Textarea data-testid="textarea" />);

    const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
    await user.type(textarea, 'Line 1{Enter}Line 2{Enter}Line 3');

    expect(textarea.value).toBe('Line 1\nLine 2\nLine 3');
  });

  it('renders as textarea element', () => {
    const { container } = render(<Textarea />);
    const textarea = container.querySelector('textarea');
    expect(textarea).toBeInTheDocument();
  });
});
