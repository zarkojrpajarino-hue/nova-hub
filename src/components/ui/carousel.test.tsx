import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from './carousel';

describe('Carousel Components', () => {
  describe('Carousel', () => {
    it('renders carousel with items', () => {
      render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Item 1</CarouselItem>
            <CarouselItem>Item 2</CarouselItem>
            <CarouselItem>Item 3</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });

    it('renders with horizontal orientation by default', () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Item 1</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      const carouselRoot = container.querySelector('[role="region"]');
      expect(carouselRoot).toHaveAttribute('aria-roledescription', 'carousel');
    });

    it('renders with vertical orientation', () => {
      render(
        <Carousel orientation="vertical">
          <CarouselContent>
            <CarouselItem>Item 1</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <Carousel className="custom-carousel">
          <CarouselContent>
            <CarouselItem>Item 1</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      const carousel = container.querySelector('[role="region"]');
      expect(carousel).toHaveClass('custom-carousel');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Carousel ref={ref}>
          <CarouselContent>
            <CarouselItem>Item 1</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('CarouselContent', () => {
    it('renders content wrapper', () => {
      render(
        <Carousel>
          <CarouselContent data-testid="content">
            <CarouselItem>Item 1</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Carousel>
          <CarouselContent className="custom-content" data-testid="content">
            <CarouselItem>Item 1</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      expect(screen.getByTestId('content')).toHaveClass('custom-content');
    });

    it('renders multiple items', () => {
      render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Slide 1</CarouselItem>
            <CarouselItem>Slide 2</CarouselItem>
            <CarouselItem>Slide 3</CarouselItem>
            <CarouselItem>Slide 4</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      expect(screen.getByText('Slide 1')).toBeInTheDocument();
      expect(screen.getByText('Slide 2')).toBeInTheDocument();
      expect(screen.getByText('Slide 3')).toBeInTheDocument();
      expect(screen.getByText('Slide 4')).toBeInTheDocument();
    });
  });

  describe('CarouselItem', () => {
    it('renders item with slide role', () => {
      render(
        <Carousel>
          <CarouselContent>
            <CarouselItem data-testid="item">Item content</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      const item = screen.getByTestId('item');
      expect(item).toHaveAttribute('role', 'group');
      expect(item).toHaveAttribute('aria-roledescription', 'slide');
    });

    it('applies custom className', () => {
      render(
        <Carousel>
          <CarouselContent>
            <CarouselItem className="custom-item" data-testid="item">
              Item
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      expect(screen.getByTestId('item')).toHaveClass('custom-item');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Carousel>
          <CarouselContent>
            <CarouselItem ref={ref}>Item</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      expect(ref.current).not.toBeNull();
    });

    it('renders with complex content', () => {
      render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>
              <div className="p-4">
                <h3>Title</h3>
                <p>Description</p>
              </div>
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });
  });

  describe('CarouselPrevious', () => {
    it('renders previous button', () => {
      render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Item 1</CarouselItem>
            <CarouselItem>Item 2</CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
        </Carousel>
      );
      expect(screen.getByText('Previous slide')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Item 1</CarouselItem>
          </CarouselContent>
          <CarouselPrevious className="custom-prev" />
        </Carousel>
      );
      const button = screen.getByText('Previous slide').closest('button');
      expect(button).toHaveClass('custom-prev');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Item 1</CarouselItem>
          </CarouselContent>
          <CarouselPrevious ref={ref} />
        </Carousel>
      );
      expect(ref.current).not.toBeNull();
    });

    it('is disabled when cannot scroll prev', () => {
      render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Item 1</CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
        </Carousel>
      );
      const button = screen.getByText('Previous slide').closest('button');
      expect(button).toBeDisabled();
    });
  });

  describe('CarouselNext', () => {
    it('renders next button', () => {
      render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Item 1</CarouselItem>
            <CarouselItem>Item 2</CarouselItem>
          </CarouselContent>
          <CarouselNext />
        </Carousel>
      );
      expect(screen.getByText('Next slide')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Item 1</CarouselItem>
          </CarouselContent>
          <CarouselNext className="custom-next" />
        </Carousel>
      );
      const button = screen.getByText('Next slide').closest('button');
      expect(button).toHaveClass('custom-next');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Item 1</CarouselItem>
          </CarouselContent>
          <CarouselNext ref={ref} />
        </Carousel>
      );
      expect(ref.current).not.toBeNull();
    });
  });

  describe('Carousel composition', () => {
    it('renders complete carousel with navigation', () => {
      render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>
              <div className="p-1">
                <div className="flex aspect-square items-center justify-center p-6">
                  <span className="text-4xl font-semibold">1</span>
                </div>
              </div>
            </CarouselItem>
            <CarouselItem>
              <div className="p-1">
                <div className="flex aspect-square items-center justify-center p-6">
                  <span className="text-4xl font-semibold">2</span>
                </div>
              </div>
            </CarouselItem>
            <CarouselItem>
              <div className="p-1">
                <div className="flex aspect-square items-center justify-center p-6">
                  <span className="text-4xl font-semibold">3</span>
                </div>
              </div>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      );

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Previous slide')).toBeInTheDocument();
      expect(screen.getByText('Next slide')).toBeInTheDocument();
    });

    it('renders vertical carousel', () => {
      render(
        <Carousel orientation="vertical" className="w-full max-w-xs">
          <CarouselContent className="-mt-1 h-[200px]">
            <CarouselItem className="pt-1">
              <div className="p-1">
                <span>Vertical 1</span>
              </div>
            </CarouselItem>
            <CarouselItem className="pt-1">
              <div className="p-1">
                <span>Vertical 2</span>
              </div>
            </CarouselItem>
            <CarouselItem className="pt-1">
              <div className="p-1">
                <span>Vertical 3</span>
              </div>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      );

      expect(screen.getByText('Vertical 1')).toBeInTheDocument();
      expect(screen.getByText('Vertical 2')).toBeInTheDocument();
      expect(screen.getByText('Vertical 3')).toBeInTheDocument();
    });

    it('renders carousel with images', () => {
      render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>
              <img src="/slide1.jpg" alt="Slide 1" />
            </CarouselItem>
            <CarouselItem>
              <img src="/slide2.jpg" alt="Slide 2" />
            </CarouselItem>
            <CarouselItem>
              <img src="/slide3.jpg" alt="Slide 3" />
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      );

      expect(screen.getByAltText('Slide 1')).toBeInTheDocument();
      expect(screen.getByAltText('Slide 2')).toBeInTheDocument();
      expect(screen.getByAltText('Slide 3')).toBeInTheDocument();
    });
  });

  describe('Carousel keyboard navigation', () => {
    it('handles arrow key navigation', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Item 1</CarouselItem>
            <CarouselItem>Item 2</CarouselItem>
          </CarouselContent>
        </Carousel>
      );

      const carousel = container.querySelector('[role="region"]');
      if (carousel) {
        await user.click(carousel);
        await user.keyboard('{ArrowRight}');
        await user.keyboard('{ArrowLeft}');
      }

      // Carousel still exists after keyboard interactions
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
  });

  describe('Carousel with API', () => {
    it('accepts setApi prop', () => {
      const setApi = vi.fn();
      render(
        <Carousel setApi={setApi}>
          <CarouselContent>
            <CarouselItem>Item 1</CarouselItem>
            <CarouselItem>Item 2</CarouselItem>
          </CarouselContent>
        </Carousel>
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
  });
});
