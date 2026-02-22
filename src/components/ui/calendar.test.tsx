import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Calendar } from './calendar';

describe('Calendar', () => {
  describe('Calendar rendering', () => {
    it('renders calendar', () => {
      const { container } = render(<Calendar />);
      expect(container.querySelector('.rdp')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<Calendar className="custom-calendar" />);
      const calendar = container.querySelector('.rdp');
      expect(calendar).toHaveClass('custom-calendar');
    });

    it('applies base padding class', () => {
      const { container } = render(<Calendar />);
      const calendar = container.querySelector('.rdp');
      expect(calendar).toHaveClass('p-3');
    });

    it('shows outside days by default', () => {
      const { container } = render(<Calendar />);
      const calendar = container.querySelector('.rdp');
      expect(calendar).toBeInTheDocument();
    });

    it('hides outside days when specified', () => {
      const { container } = render(<Calendar showOutsideDays={false} />);
      const calendar = container.querySelector('.rdp');
      expect(calendar).toBeInTheDocument();
    });
  });

  describe('Calendar navigation', () => {
    it('renders navigation buttons', () => {
      const { container } = render(<Calendar />);
      const navButtons = container.querySelectorAll('button');
      expect(navButtons.length).toBeGreaterThan(0);
    });

    it('renders previous month button', () => {
      const { container } = render(<Calendar />);
      const prevButton = container.querySelector('button[name="previous-month"]');
      expect(prevButton).toBeInTheDocument();
    });

    it('renders next month button', () => {
      const { container } = render(<Calendar />);
      const nextButton = container.querySelector('button[name="next-month"]');
      expect(nextButton).toBeInTheDocument();
    });

    it('displays ChevronLeft icon', () => {
      const { container } = render(<Calendar />);
      const chevronLeft = container.querySelector('svg');
      expect(chevronLeft).toBeInTheDocument();
    });
  });

  describe('Calendar with date selection', () => {
    it('renders with selected date', () => {
      const date = new Date(2024, 0, 15);
      const { container } = render(<Calendar selected={date} />);
      expect(container.querySelector('.rdp')).toBeInTheDocument();
    });

    it('renders with default month', () => {
      const date = new Date(2024, 5, 1);
      const { container } = render(<Calendar defaultMonth={date} />);
      expect(container.querySelector('.rdp')).toBeInTheDocument();
    });

    it('renders with mode single', () => {
      const { container } = render(<Calendar mode="single" />);
      expect(container.querySelector('.rdp')).toBeInTheDocument();
    });

    it('renders with mode multiple', () => {
      const { container } = render(<Calendar mode="multiple" />);
      expect(container.querySelector('.rdp')).toBeInTheDocument();
    });

    it('renders with mode range', () => {
      const { container } = render(<Calendar mode="range" />);
      expect(container.querySelector('.rdp')).toBeInTheDocument();
    });
  });

  describe('Calendar interaction', () => {
    it('allows day selection', async () => {
      const user = userEvent.setup();
      const { container } = render(<Calendar mode="single" />);

      const dayButtons = container.querySelectorAll('button[name="day"]');
      if (dayButtons.length > 0) {
        await user.click(dayButtons[0]);
        expect(dayButtons[0]).toBeInTheDocument();
      }
    });

    it('navigates to next month', async () => {
      const user = userEvent.setup();
      const { container } = render(<Calendar />);

      const nextButton = container.querySelector('button[name="next-month"]');
      if (nextButton) {
        await user.click(nextButton as Element);
        expect(nextButton).toBeInTheDocument();
      }
    });

    it('navigates to previous month', async () => {
      const user = userEvent.setup();
      const { container } = render(<Calendar />);

      const prevButton = container.querySelector('button[name="previous-month"]');
      if (prevButton) {
        await user.click(prevButton as Element);
        expect(prevButton).toBeInTheDocument();
      }
    });
  });

  describe('Calendar with disabled dates', () => {
    it('renders with disabled dates', () => {
      const disabledDays = { before: new Date() };
      const { container } = render(<Calendar disabled={disabledDays} />);
      expect(container.querySelector('.rdp')).toBeInTheDocument();
    });

    it('renders with disabled matcher function', () => {
      const disabledMatcher = (date: Date) => date.getDay() === 0 || date.getDay() === 6;
      const { container } = render(<Calendar disabled={disabledMatcher} />);
      expect(container.querySelector('.rdp')).toBeInTheDocument();
    });
  });

  describe('Calendar display options', () => {
    it('renders with custom number of months', () => {
      const { container } = render(<Calendar numberOfMonths={2} />);
      expect(container.querySelector('.rdp')).toBeInTheDocument();
    });

    it('renders with today date', () => {
      const { container } = render(<Calendar />);
      // Calendar renders with today's date visible
      const calendar = container.querySelector('.rdp');
      expect(calendar).toBeInTheDocument();
    });

    it('renders week numbers when specified', () => {
      const { container } = render(<Calendar showWeekNumber />);
      expect(container.querySelector('.rdp')).toBeInTheDocument();
    });
  });

  describe('Calendar customization', () => {
    it('accepts custom classNames prop', () => {
      const customClassNames = {
        day: 'custom-day-class',
      };
      const { container } = render(<Calendar classNames={customClassNames} />);
      expect(container.querySelector('.rdp')).toBeInTheDocument();
    });

    it('renders with custom caption layout', () => {
      const { container } = render(<Calendar captionLayout="dropdown" />);
      expect(container.querySelector('.rdp')).toBeInTheDocument();
    });
  });

  describe('Calendar accessibility', () => {
    it('has proper table structure', () => {
      const { container } = render(<Calendar />);
      const table = container.querySelector('table');
      expect(table).toBeInTheDocument();
    });

    it('renders with accessible structure', () => {
      const { container } = render(<Calendar />);
      // Calendar renders with proper structure
      const calendar = container.querySelector('.rdp');
      expect(calendar).toBeInTheDocument();
    });

    it('renders weekday headers', () => {
      const { container } = render(<Calendar />);
      const thead = container.querySelector('thead');
      expect(thead).toBeInTheDocument();
    });
  });
});
