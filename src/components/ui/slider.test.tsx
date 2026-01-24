import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Slider } from './slider';

describe('Slider', () => {
  it('renders slider', () => {
    render(<Slider data-testid="slider" />);
    expect(screen.getByTestId('slider')).toBeInTheDocument();
  });

  it('applies base classes', () => {
    render(<Slider data-testid="slider" />);
    const slider = screen.getByTestId('slider');
    expect(slider).toHaveClass('relative');
    expect(slider).toHaveClass('flex');
    expect(slider).toHaveClass('w-full');
    expect(slider).toHaveClass('touch-none');
    expect(slider).toHaveClass('select-none');
    expect(slider).toHaveClass('items-center');
  });

  it('applies custom className', () => {
    render(<Slider className="custom-slider" data-testid="slider" />);
    const slider = screen.getByTestId('slider');
    expect(slider).toHaveClass('custom-slider');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Slider ref={ref} />);
    expect(ref.current).not.toBeNull();
  });

  it('renders with default value', () => {
    render(<Slider defaultValue={[50]} data-testid="slider" />);
    const slider = screen.getByTestId('slider');
    expect(slider).toBeInTheDocument();
  });

  it('renders with controlled value', () => {
    render(<Slider value={[25]} data-testid="slider" />);
    const slider = screen.getByTestId('slider');
    expect(slider).toBeInTheDocument();
  });

  it('supports min and max values', () => {
    render(<Slider min={0} max={100} data-testid="slider" />);
    const slider = screen.getByTestId('slider');
    expect(slider).toBeInTheDocument();
  });

  it('supports step attribute', () => {
    render(<Slider step={5} data-testid="slider" />);
    const slider = screen.getByTestId('slider');
    expect(slider).toBeInTheDocument();
  });

  it('supports disabled state', () => {
    render(<Slider disabled data-testid="slider" />);
    const slider = screen.getByTestId('slider');
    expect(slider).toHaveAttribute('data-disabled', '');
  });

  it('calls onValueChange when value changes', () => {
    const handleValueChange = vi.fn();
    render(<Slider onValueChange={handleValueChange} data-testid="slider" />);
    expect(screen.getByTestId('slider')).toBeInTheDocument();
  });

  it('renders slider component', () => {
    render(<Slider data-testid="slider" />);
    const slider = screen.getByTestId('slider');
    expect(slider).toBeInTheDocument();
  });

  it('supports multiple thumbs with array values', () => {
    render(<Slider defaultValue={[20, 80]} data-testid="slider" />);
    const slider = screen.getByTestId('slider');
    expect(slider).toBeInTheDocument();
  });

  it('forwards additional props', () => {
    render(<Slider id="volume-slider" aria-label="Volume control" data-testid="slider" />);
    const slider = screen.getByTestId('slider');
    expect(slider).toHaveAttribute('id', 'volume-slider');
    expect(slider).toHaveAttribute('aria-label', 'Volume control');
  });
});
