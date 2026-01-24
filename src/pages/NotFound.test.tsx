import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFound from './NotFound';

describe('NotFound', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  const renderComponent = (initialPath = '/unknown') => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <NotFound />
      </MemoryRouter>
    );
  };

  it('renders 404 heading', () => {
    renderComponent();
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renders error message', () => {
    renderComponent();
    expect(screen.getByText('Oops! Page not found')).toBeInTheDocument();
  });

  it('renders return to home link', () => {
    renderComponent();
    const link = screen.getByText('Return to Home');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });

  it('applies correct styling to container', () => {
    const { container } = renderComponent();
    const mainDiv = container.querySelector('.flex.min-h-screen');
    expect(mainDiv).toHaveClass('items-center', 'justify-center', 'bg-muted');
  });

  it('applies text center to content', () => {
    const { container } = renderComponent();
    const contentDiv = container.querySelector('.text-center');
    expect(contentDiv).toBeInTheDocument();
  });

  it('applies correct font size to heading', () => {
    renderComponent();
    const heading = screen.getByText('404');
    expect(heading).toHaveClass('text-4xl', 'font-bold');
  });

  it('applies correct styling to error message', () => {
    renderComponent();
    const message = screen.getByText('Oops! Page not found');
    expect(message).toHaveClass('text-xl', 'text-muted-foreground');
  });

  it('applies correct styling to link', () => {
    renderComponent();
    const link = screen.getByText('Return to Home');
    expect(link).toHaveClass('text-primary', 'underline', 'hover:text-primary/90');
  });

  it('logs error to console on mount', () => {
    const consoleSpy = vi.spyOn(console, 'error');
    renderComponent('/some/path');
    expect(consoleSpy).toHaveBeenCalledWith(
      '404 Error: User attempted to access non-existent route:',
      '/some/path'
    );
  });

  it('logs different paths correctly', () => {
    const consoleSpy = vi.spyOn(console, 'error');
    renderComponent('/another/route');
    expect(consoleSpy).toHaveBeenCalledWith(
      '404 Error: User attempted to access non-existent route:',
      '/another/route'
    );
  });

  it('has h1 tag for heading', () => {
    renderComponent();
    const heading = screen.getByText('404');
    expect(heading.tagName).toBe('H1');
  });

  it('has p tag for message', () => {
    renderComponent();
    const message = screen.getByText('Oops! Page not found');
    expect(message.tagName).toBe('P');
  });

  it('has a tag for link', () => {
    renderComponent();
    const link = screen.getByText('Return to Home');
    expect(link.tagName).toBe('A');
  });

  it('renders all elements in correct order', () => {
    const { container } = renderComponent();
    const textCenter = container.querySelector('.text-center');
    const children = Array.from(textCenter?.children || []);

    expect(children).toHaveLength(3);
    expect(children[0].textContent).toBe('404');
    expect(children[1].textContent).toBe('Oops! Page not found');
    expect(children[2].textContent).toBe('Return to Home');
  });
});
