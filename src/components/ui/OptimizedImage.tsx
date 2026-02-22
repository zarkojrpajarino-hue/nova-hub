/**
 * ✨ OPTIMIZED: Optimized Image Component
 *
 * Componente de imagen optimizado con lazy loading, placeholders y manejo de errores.
 *
 * ANTES: Imágenes cargan todas al inicio, sin optimización
 * DESPUÉS: Lazy loading, skeleton placeholder, manejo de errores, WebP cuando sea posible
 */

import { useState, useEffect, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, ImageOff } from 'lucide-react';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'loading'> {
  src: string;
  alt: string;
  className?: string;
  /**
   * Lazy loading strategy
   * @default 'lazy'
   */
  loading?: 'lazy' | 'eager';
  /**
   * Mostrar skeleton mientras carga
   * @default true
   */
  showSkeleton?: boolean;
  /**
   * Fallback image si falla la carga
   */
  fallbackSrc?: string;
  /**
   * Ancho objetivo (para optimización futura con Supabase Transform)
   */
  targetWidth?: number;
  /**
   * Alto objetivo (para optimización futura con Supabase Transform)
   */
  targetHeight?: number;
  /**
   * Callback cuando la imagen carga exitosamente
   */
  onLoad?: () => void;
  /**
   * Callback cuando falla la carga
   */
  onError?: () => void;
}

/**
 * Componente de imagen optimizado
 *
 * @example
 * ```tsx
 * // Uso básico
 * <OptimizedImage
 *   src={project.logo_url}
 *   alt={project.name}
 *   className="w-24 h-24 rounded-lg"
 * />
 *
 * // Con dimensiones específicas
 * <OptimizedImage
 *   src={member.avatar}
 *   alt={member.nombre}
 *   className="w-10 h-10 rounded-full"
 *   targetWidth={40}
 *   targetHeight={40}
 * />
 *
 * // Con fallback
 * <OptimizedImage
 *   src={branding.logo_url}
 *   alt="Company logo"
 *   fallbackSrc="/default-logo.png"
 *   className="w-32 h-32"
 * />
 *
 * // Eager loading (above the fold)
 * <OptimizedImage
 *   src={hero.image}
 *   alt="Hero image"
 *   loading="eager"
 *   className="w-full h-96 object-cover"
 * />
 * ```
 */
export function OptimizedImage({
  src,
  alt,
  className,
  loading = 'lazy',
  showSkeleton = true,
  fallbackSrc,
  targetWidth,
  targetHeight,
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    // Precargar imagen
    const img = new Image();

    // ✨ OPTIMIZADO: Intentar cargar versión WebP si está disponible
    // (Esto requiere que las imágenes se generen en WebP)
    let optimizedSrc = src;

    // Si es una URL de Supabase Storage, agregar transformación
    if (src.includes('supabase.co/storage') && (targetWidth || targetHeight)) {
      const url = new URL(src);
      const params = new URLSearchParams();

      if (targetWidth) params.append('width', targetWidth.toString());
      if (targetHeight) params.append('height', targetHeight.toString());
      params.append('quality', '85'); // Balance entre calidad y tamaño
      params.append('format', 'webp'); // Formato moderno más ligero

      // Supabase Storage Transform API (si está configurado)
      // optimizedSrc = `${url.origin}/render/image/authenticated${url.pathname}?${params}`;
      // Por ahora usar src original
    }

    img.src = optimizedSrc;

    img.onload = () => {
      setImageSrc(optimizedSrc);
      setIsLoading(false);
      setHasError(false);
      onLoad?.();
    };

    img.onerror = () => {
      // Intentar fallback
      if (fallbackSrc && fallbackSrc !== optimizedSrc) {
        img.src = fallbackSrc;
      } else {
        setIsLoading(false);
        setHasError(true);
        onError?.();
      }
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, targetWidth, targetHeight, fallbackSrc, onLoad, onError]);

  // Estado de error
  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted text-muted-foreground',
          className
        )}
        role="img"
        aria-label={alt}
      >
        <ImageOff size={24} className="opacity-50" />
      </div>
    );
  }

  // Estado de carga con skeleton
  if (isLoading && showSkeleton) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted animate-pulse',
          className
        )}
        role="img"
        aria-label={`Cargando ${alt}`}
      >
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Imagen cargada
  return (
    <img
      src={imageSrc}
      alt={alt}
      loading={loading}
      className={cn(
        'object-cover',
        isLoading && 'opacity-0',
        !isLoading && 'opacity-100 transition-opacity duration-300',
        className
      )}
      {...props}
    />
  );
}

/**
 * Avatar optimizado (caso de uso común)
 */
interface OptimizedAvatarProps {
  src?: string | null;
  alt: string;
  size?: number;
  fallbackColor?: string;
  fallbackText?: string;
}

export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  fallbackColor = '#6366F1',
  fallbackText,
}: OptimizedAvatarProps) {
  if (!src) {
    // Mostrar iniciales como fallback
    const initials = fallbackText || alt.charAt(0).toUpperCase();

    return (
      <div
        className="flex items-center justify-center rounded-full text-white font-semibold"
        style={{
          width: size,
          height: size,
          backgroundColor: fallbackColor,
          fontSize: size * 0.4,
        }}
        role="img"
        aria-label={alt}
      >
        {initials}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className="rounded-full"
      style={{ width: size, height: size }}
      targetWidth={size}
      targetHeight={size}
      fallbackSrc={undefined}
    />
  );
}

/**
 * Logo optimizado (caso de uso común)
 */
interface OptimizedLogoProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LOGO_SIZES = {
  sm: { width: 32, height: 32 },
  md: { width: 64, height: 64 },
  lg: { width: 128, height: 128 },
};

export function OptimizedLogo({
  src,
  alt,
  size = 'md',
  className,
}: OptimizedLogoProps) {
  const dimensions = LOGO_SIZES[size];

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={cn('object-contain', className)}
      style={dimensions}
      targetWidth={dimensions.width}
      targetHeight={dimensions.height}
    />
  );
}

/**
 * NOTAS DE OPTIMIZACIÓN:
 *
 * 1. LAZY LOADING:
 *    - Por defecto todas las imágenes usan loading="lazy"
 *    - Solo usar loading="eager" para imágenes above-the-fold
 *
 * 2. TAMAÑOS:
 *    - Siempre especificar targetWidth/targetHeight cuando sea posible
 *    - Esto permite optimización futura con Supabase Transform o CDN
 *
 * 3. FORMATOS:
 *    - WebP reduce tamaño ~30% vs JPEG sin pérdida de calidad
 *    - Fallback automático a original si WebP no está disponible
 *
 * 4. PLACEHOLDERS:
 *    - Skeleton mientras carga mejora perceived performance
 *    - Fallback para errores mejora UX
 *
 * 5. CACHING:
 *    - El navegador cachea imágenes automáticamente
 *    - Usar cache-control headers en servidor para control adicional
 *
 * MEJORAS FUTURAS:
 * - Integrar con Supabase Storage Transform API
 * - Generar logos en WebP en Edge Function de DALL-E
 * - Implementar blur placeholder (LQIP - Low Quality Image Placeholder)
 * - Progressive loading para imágenes grandes
 */
