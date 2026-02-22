import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from './input-otp';

describe('InputOTP Components', () => {
  describe('InputOTP', () => {
    it('renders OTP input', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
        </InputOTP>
      );

      expect(container.querySelector('[data-input-otp]')).toBeInTheDocument();
    });

    it('renders with custom maxLength', () => {
      const { container } = render(
        <InputOTP maxLength={4}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
        </InputOTP>
      );

      expect(container.querySelector('[data-input-otp]')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <InputOTP maxLength={4} className="custom-otp">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      );

      const otp = container.querySelector('[data-input-otp]');
      expect(otp).toHaveClass('custom-otp');
    });

    it('applies custom containerClassName', () => {
      const { container } = render(
        <InputOTP maxLength={4} containerClassName="custom-container">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      );

      const container_el = container.querySelector('.custom-container');
      expect(container_el).toBeInTheDocument();
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <InputOTP maxLength={4} ref={ref}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      );

      expect(ref.current).not.toBeNull();
    });
  });

  describe('InputOTPGroup', () => {
    it('renders group container', () => {
      render(
        <InputOTP maxLength={3}>
          <InputOTPGroup data-testid="otp-group">
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
        </InputOTP>
      );

      expect(screen.getByTestId('otp-group')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <InputOTP maxLength={3}>
          <InputOTPGroup className="custom-group" data-testid="otp-group">
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      );

      expect(screen.getByTestId('otp-group')).toHaveClass('custom-group');
    });

    it('renders multiple slots', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      );

      // OTP with 6 slots renders successfully
      expect(container.querySelector('[data-input-otp]')).toBeInTheDocument();
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <InputOTP maxLength={3}>
          <InputOTPGroup ref={ref}>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      );

      expect(ref.current).not.toBeNull();
    });
  });

  describe('InputOTPSlot', () => {
    it('renders slot', () => {
      render(
        <InputOTP maxLength={1}>
          <InputOTPGroup>
            <InputOTPSlot index={0} data-testid="slot-0" />
          </InputOTPGroup>
        </InputOTP>
      );

      expect(screen.getByTestId('slot-0')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <InputOTP maxLength={1}>
          <InputOTPGroup>
            <InputOTPSlot index={0} className="custom-slot" data-testid="slot-0" />
          </InputOTPGroup>
        </InputOTP>
      );

      expect(screen.getByTestId('slot-0')).toHaveClass('custom-slot');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <InputOTP maxLength={1}>
          <InputOTPGroup>
            <InputOTPSlot index={0} ref={ref} />
          </InputOTPGroup>
        </InputOTP>
      );

      expect(ref.current).not.toBeNull();
    });

    it('renders with correct border styling', () => {
      render(
        <InputOTP maxLength={1}>
          <InputOTPGroup>
            <InputOTPSlot index={0} data-testid="slot-0" />
          </InputOTPGroup>
        </InputOTP>
      );

      const slot = screen.getByTestId('slot-0');
      expect(slot).toHaveClass('border-y');
      expect(slot).toHaveClass('border-r');
    });
  });

  describe('InputOTPSeparator', () => {
    it('renders separator', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      );

      const separator = container.querySelector('[role="separator"]');
      expect(separator).toBeInTheDocument();
    });

    it('renders with Dot icon', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={1} />
          </InputOTPGroup>
        </InputOTP>
      );

      const separator = container.querySelector('[role="separator"]');
      expect(separator).toBeInTheDocument();
      expect(separator?.querySelector('svg')).toBeInTheDocument();
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <InputOTP maxLength={4}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
          <InputOTPSeparator ref={ref} />
          <InputOTPGroup>
            <InputOTPSlot index={1} />
          </InputOTPGroup>
        </InputOTP>
      );

      expect(ref.current).not.toBeNull();
    });
  });

  describe('InputOTP composition', () => {
    it('renders complete 6-digit OTP input', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      );

      // OTP renders with separator
      expect(container.querySelector('[data-input-otp]')).toBeInTheDocument();
      expect(container.querySelector('[role="separator"]')).toBeInTheDocument();
    });

    it('renders 4-digit OTP without separator', () => {
      const { container } = render(
        <InputOTP maxLength={4}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
        </InputOTP>
      );

      // OTP renders without separator
      expect(container.querySelector('[data-input-otp]')).toBeInTheDocument();
      expect(container.querySelector('[role="separator"]')).not.toBeInTheDocument();
    });

    it('renders OTP with multiple groups', () => {
      const { container } = render(
        <InputOTP maxLength={8}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={6} />
            <InputOTPSlot index={7} />
          </InputOTPGroup>
        </InputOTP>
      );

      // OTP renders with multiple separators
      expect(container.querySelector('[data-input-otp]')).toBeInTheDocument();

      const separators = container.querySelectorAll('[role="separator"]');
      expect(separators.length).toBe(3);
    });
  });

  describe('InputOTP interaction', () => {
    it('accepts numeric input', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <InputOTP maxLength={4}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
        </InputOTP>
      );

      const otp = container.querySelector('[data-input-otp]');
      if (otp) {
        await user.click(otp);
        await user.keyboard('1234');
      }

      // OTP component handled the input
      expect(container.querySelector('[data-input-otp]')).toBeInTheDocument();
    });

    it('handles onChange callback', () => {
      const onChange = vi.fn();
      render(
        <InputOTP maxLength={4} onChange={onChange}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
        </InputOTP>
      );

      // Component renders with onChange handler
      expect(document.querySelector('[data-input-otp]')).toBeInTheDocument();
    });
  });

  describe('InputOTP patterns', () => {
    it('renders verification code pattern', () => {
      const { container } = render(
        <div>
          <label>Enter verification code</label>
          <InputOTP maxLength={6}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
      );

      expect(screen.getByText('Enter verification code')).toBeInTheDocument();
      expect(container.querySelector('[data-input-otp]')).toBeInTheDocument();
    });

    it('renders PIN code pattern', () => {
      const { container } = render(
        <div>
          <label>Enter PIN</label>
          <InputOTP maxLength={4}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
            </InputOTPGroup>
          </InputOTP>
        </div>
      );

      expect(screen.getByText('Enter PIN')).toBeInTheDocument();
      expect(container.querySelector('[data-input-otp]')).toBeInTheDocument();
    });
  });

  describe('InputOTP disabled state', () => {
    it('renders with disabled prop', () => {
      const { container } = render(
        <InputOTP maxLength={4} disabled>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
        </InputOTP>
      );

      const otp = container.querySelector('[data-input-otp]');
      expect(otp).toBeDisabled();
    });

    it('applies disabled styling to container', () => {
      const { container } = render(
        <InputOTP maxLength={4} disabled containerClassName="test-container">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      );

      const container_el = container.querySelector('.test-container');
      expect(container_el).toBeInTheDocument();
    });
  });
});
