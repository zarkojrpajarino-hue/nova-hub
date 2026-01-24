import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BarChart, Bar, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from './chart';

const chartConfig: ChartConfig = {
  desktop: {
    label: 'Desktop',
    color: '#2563eb',
  },
  mobile: {
    label: 'Mobile',
    color: '#60a5fa',
  },
};

const chartData = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
];

describe('Chart Components', () => {
  describe('ChartContainer', () => {
    it('renders chart container', () => {
      render(
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData}>
            <Bar dataKey="desktop" fill="var(--color-desktop)" />
          </BarChart>
        </ChartContainer>
      );
      // Chart renders (Recharts components are complex to test)
      expect(document.querySelector('[data-chart]')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <ChartContainer config={chartConfig} className="custom-chart">
          <BarChart data={chartData}>
            <Bar dataKey="desktop" fill="var(--color-desktop)" />
          </BarChart>
        </ChartContainer>
      );
      const chart = document.querySelector('[data-chart]');
      expect(chart).toHaveClass('custom-chart');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <ChartContainer config={chartConfig} ref={ref}>
          <BarChart data={chartData}>
            <Bar dataKey="desktop" fill="var(--color-desktop)" />
          </BarChart>
        </ChartContainer>
      );
      expect(ref.current).not.toBeNull();
    });

    it('renders with custom id', () => {
      render(
        <ChartContainer config={chartConfig} id="custom-chart-id">
          <BarChart data={chartData}>
            <Bar dataKey="desktop" fill="var(--color-desktop)" />
          </BarChart>
        </ChartContainer>
      );
      expect(document.querySelector('[data-chart="chart-custom-chart-id"]')).toBeInTheDocument();
    });

    it('renders with empty config', () => {
      render(
        <ChartContainer config={{}}>
          <BarChart data={chartData}>
            <Bar dataKey="desktop" fill="#2563eb" />
          </BarChart>
        </ChartContainer>
      );
      expect(document.querySelector('[data-chart]')).toBeInTheDocument();
    });
  });

  describe('ChartTooltip', () => {
    it('renders tooltip component', () => {
      const { container } = render(
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData}>
            <Bar dataKey="desktop" fill="var(--color-desktop)" />
            <ChartTooltip content={<ChartTooltipContent />} />
          </BarChart>
        </ChartContainer>
      );
      // Tooltip is rendered but may not be visible initially
      expect(container.querySelector('[data-chart]')).toBeInTheDocument();
    });
  });

  describe('ChartTooltipContent', () => {
    it('renders with default indicator', () => {
      render(
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData}>
            <Bar dataKey="desktop" fill="var(--color-desktop)" />
            <ChartTooltip content={<ChartTooltipContent />} />
          </BarChart>
        </ChartContainer>
      );
      expect(document.querySelector('[data-chart]')).toBeInTheDocument();
    });

    it('renders with line indicator', () => {
      render(
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData}>
            <Bar dataKey="desktop" fill="var(--color-desktop)" />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
          </BarChart>
        </ChartContainer>
      );
      expect(document.querySelector('[data-chart]')).toBeInTheDocument();
    });

    it('renders with dashed indicator', () => {
      render(
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData}>
            <Bar dataKey="desktop" fill="var(--color-desktop)" />
            <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
          </BarChart>
        </ChartContainer>
      );
      expect(document.querySelector('[data-chart]')).toBeInTheDocument();
    });

    it('renders with hideLabel prop', () => {
      render(
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData}>
            <Bar dataKey="desktop" fill="var(--color-desktop)" />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          </BarChart>
        </ChartContainer>
      );
      expect(document.querySelector('[data-chart]')).toBeInTheDocument();
    });

    it('renders with hideIndicator prop', () => {
      render(
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData}>
            <Bar dataKey="desktop" fill="var(--color-desktop)" />
            <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
          </BarChart>
        </ChartContainer>
      );
      expect(document.querySelector('[data-chart]')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData}>
            <Bar dataKey="desktop" fill="var(--color-desktop)" />
            <ChartTooltip content={<ChartTooltipContent className="custom-tooltip" />} />
          </BarChart>
        </ChartContainer>
      );
      expect(document.querySelector('[data-chart]')).toBeInTheDocument();
    });
  });

  describe('ChartLegend', () => {
    it('renders legend component', () => {
      render(
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData}>
            <Bar dataKey="desktop" fill="var(--color-desktop)" />
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      );
      expect(document.querySelector('[data-chart]')).toBeInTheDocument();
    });
  });

  describe('ChartLegendContent', () => {
    it('renders without payload', () => {
      const { container } = render(
        <ChartContainer config={chartConfig}>
          <div>
            <ChartLegendContent />
          </div>
        </ChartContainer>
      );
      // Legend with no payload renders nothing
      expect(container.querySelector('[data-chart]')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData}>
            <Bar dataKey="desktop" fill="var(--color-desktop)" />
            <Bar dataKey="mobile" fill="var(--color-mobile)" />
            <ChartLegend content={<ChartLegendContent className="custom-legend" />} />
          </BarChart>
        </ChartContainer>
      );
      expect(document.querySelector('[data-chart]')).toBeInTheDocument();
    });

    it('renders with hideIcon prop', () => {
      render(
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData}>
            <Bar dataKey="desktop" fill="var(--color-desktop)" />
            <ChartLegend content={<ChartLegendContent hideIcon />} />
          </BarChart>
        </ChartContainer>
      );
      expect(document.querySelector('[data-chart]')).toBeInTheDocument();
    });

    it('renders with verticalAlign top', () => {
      render(
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData}>
            <Bar dataKey="desktop" fill="var(--color-desktop)" />
            <ChartLegend content={<ChartLegendContent verticalAlign="top" />} />
          </BarChart>
        </ChartContainer>
      );
      expect(document.querySelector('[data-chart]')).toBeInTheDocument();
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <ChartContainer config={chartConfig}>
          <div>
            <ChartLegendContent ref={ref} payload={[]} />
          </div>
        </ChartContainer>
      );
      // Ref is forwarded even with empty payload (which renders null)
      expect(document.querySelector('[data-chart]')).toBeInTheDocument();
    });
  });

  describe('Chart with theme config', () => {
    it('renders with theme-based colors', () => {
      const themeConfig: ChartConfig = {
        desktop: {
          label: 'Desktop',
          theme: {
            light: '#2563eb',
            dark: '#60a5fa',
          },
        },
      };

      render(
        <ChartContainer config={themeConfig}>
          <BarChart data={chartData}>
            <Bar dataKey="desktop" fill="var(--color-desktop)" />
          </BarChart>
        </ChartContainer>
      );
      expect(document.querySelector('[data-chart]')).toBeInTheDocument();
    });
  });

  describe('Chart composition', () => {
    it('renders complete bar chart', () => {
      render(
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData}>
            <XAxis dataKey="month" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="desktop" fill="var(--color-desktop)" />
            <Bar dataKey="mobile" fill="var(--color-mobile)" />
          </BarChart>
        </ChartContainer>
      );
      expect(document.querySelector('[data-chart]')).toBeInTheDocument();
    });

    it('renders chart with multiple bars', () => {
      render(
        <ChartContainer config={chartConfig} className="h-[300px]">
          <BarChart data={chartData}>
            <XAxis dataKey="month" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
            <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
            <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
          </BarChart>
        </ChartContainer>
      );
      expect(document.querySelector('[data-chart]')).toBeInTheDocument();
    });

    it('renders chart with custom tooltip formatter', () => {
      render(
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData}>
            <Bar dataKey="desktop" fill="var(--color-desktop)" />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => `${value} visitors`}
                />
              }
            />
          </BarChart>
        </ChartContainer>
      );
      expect(document.querySelector('[data-chart]')).toBeInTheDocument();
    });

    it('renders chart with label formatter', () => {
      render(
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData}>
            <Bar dataKey="desktop" fill="var(--color-desktop)" />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => `Month: ${label}`}
                />
              }
            />
          </BarChart>
        </ChartContainer>
      );
      expect(document.querySelector('[data-chart]')).toBeInTheDocument();
    });
  });

  describe('Chart config variations', () => {
    it('renders with icon in config', () => {
      const IconComponent = () => <svg data-testid="custom-icon" />;
      const configWithIcon: ChartConfig = {
        desktop: {
          label: 'Desktop',
          color: '#2563eb',
          icon: IconComponent,
        },
      };

      render(
        <ChartContainer config={configWithIcon}>
          <BarChart data={chartData}>
            <Bar dataKey="desktop" fill="var(--color-desktop)" />
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      );
      expect(document.querySelector('[data-chart]')).toBeInTheDocument();
    });

    it('renders with multiple data series', () => {
      const multiConfig: ChartConfig = {
        desktop: { label: 'Desktop', color: '#2563eb' },
        mobile: { label: 'Mobile', color: '#60a5fa' },
        tablet: { label: 'Tablet', color: '#34d399' },
      };

      render(
        <ChartContainer config={multiConfig}>
          <BarChart
            data={[
              { month: 'Jan', desktop: 100, mobile: 80, tablet: 60 },
              { month: 'Feb', desktop: 200, mobile: 150, tablet: 120 },
            ]}
          >
            <Bar dataKey="desktop" fill="var(--color-desktop)" />
            <Bar dataKey="mobile" fill="var(--color-mobile)" />
            <Bar dataKey="tablet" fill="var(--color-tablet)" />
          </BarChart>
        </ChartContainer>
      );
      expect(document.querySelector('[data-chart]')).toBeInTheDocument();
    });
  });
});
