import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';

describe('Avatar Components', () => {
  describe('Avatar', () => {
    it('renders avatar container', () => {
      render(<Avatar data-testid="avatar" />);
      expect(screen.getByTestId('avatar')).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(<Avatar data-testid="avatar" />);
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveClass('relative');
      expect(avatar).toHaveClass('flex');
      expect(avatar).toHaveClass('h-10');
      expect(avatar).toHaveClass('w-10');
      expect(avatar).toHaveClass('rounded-full');
      expect(avatar).toHaveClass('overflow-hidden');
    });

    it('applies custom className', () => {
      render(<Avatar className="custom-avatar" data-testid="avatar" />);
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveClass('custom-avatar');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<Avatar ref={ref} />);
      expect(ref.current).not.toBeNull();
    });
  });

  describe('AvatarFallback', () => {
    it('renders fallback content', () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('applies base classes', () => {
      render(
        <Avatar>
          <AvatarFallback data-testid="fallback">AB</AvatarFallback>
        </Avatar>
      );
      const fallback = screen.getByTestId('fallback');
      expect(fallback).toHaveClass('flex');
      expect(fallback).toHaveClass('h-full');
      expect(fallback).toHaveClass('w-full');
      expect(fallback).toHaveClass('items-center');
      expect(fallback).toHaveClass('justify-center');
      expect(fallback).toHaveClass('rounded-full');
      expect(fallback).toHaveClass('bg-muted');
    });

    it('applies custom className', () => {
      render(
        <Avatar>
          <AvatarFallback className="custom-fallback" data-testid="fallback">
            AB
          </AvatarFallback>
        </Avatar>
      );
      const fallback = screen.getByTestId('fallback');
      expect(fallback).toHaveClass('custom-fallback');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Avatar>
          <AvatarFallback ref={ref}>AB</AvatarFallback>
        </Avatar>
      );
      expect(ref.current).not.toBeNull();
    });

    it('renders with initials', () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByText('JD')).toBeInTheDocument();
    });
  });

  describe('Avatar composition', () => {
    it('renders avatar with fallback', () => {
      render(
        <Avatar data-testid="avatar">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      expect(screen.getByTestId('avatar')).toBeInTheDocument();
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('can render with custom size', () => {
      render(
        <Avatar className="h-20 w-20" data-testid="avatar">
          <AvatarFallback>XL</AvatarFallback>
        </Avatar>
      );

      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveClass('h-20');
      expect(avatar).toHaveClass('w-20');
    });

    it('renders complete avatar structure', () => {
      render(
        <Avatar data-testid="avatar">
          <AvatarImage src="/user.jpg" alt="User" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      expect(screen.getByTestId('avatar')).toBeInTheDocument();
      // Fallback shows when image hasn't loaded (normal in test environment)
      expect(screen.getByText('JD')).toBeInTheDocument();
    });
  });
});
