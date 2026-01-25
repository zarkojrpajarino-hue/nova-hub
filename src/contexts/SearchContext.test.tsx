import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchProvider, useSearch } from './SearchContext';

function TestComponent() {
  const { isOpen, open, close, toggle } = useSearch();
  
  return (
    <div>
      <div data-testid="search-status">{isOpen ? 'Open' : 'Closed'}</div>
      <button onClick={open}>Open</button>
      <button onClick={close}>Close</button>
      <button onClick={toggle}>Toggle</button>
    </div>
  );
}

describe('SearchContext', () => {
  it('starts closed', () => {
    render(<SearchProvider><TestComponent /></SearchProvider>);
    expect(screen.getByTestId('search-status')).toHaveTextContent('Closed');
  });

  it('opens search', () => {
    render(<SearchProvider><TestComponent /></SearchProvider>);
    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByTestId('search-status')).toHaveTextContent('Open');
  });

  it('closes search', () => {
    render(<SearchProvider><TestComponent /></SearchProvider>);
    fireEvent.click(screen.getByText('Open'));
    fireEvent.click(screen.getByText('Close'));
    expect(screen.getByTestId('search-status')).toHaveTextContent('Closed');
  });

  it('toggles search', () => {
    render(<SearchProvider><TestComponent /></SearchProvider>);
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('search-status')).toHaveTextContent('Open');
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('search-status')).toHaveTextContent('Closed');
  });
});
