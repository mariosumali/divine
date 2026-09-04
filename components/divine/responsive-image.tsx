import { forwardRef, type CSSProperties, type ImgHTMLAttributes } from 'react';
import {
  generatedImageInfo,
  optimizedImageSource,
  responsiveImageSrcSet,
} from '@/lib/divine/responsive-images';

type ImageSource = string | { src: string };

export interface ResponsiveImageProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'height' | 'loading' | 'src' | 'width'
> {
  src: ImageSource;
  width?: number | `${number}`;
  height?: number | `${number}`;
  fill?: boolean;
  priority?: boolean;
}

function sourceString(source: ImageSource) {
  return typeof source === 'string' ? source : source.src;
}

const ResponsiveImage = forwardRef<HTMLImageElement, ResponsiveImageProps>(
  function ResponsiveImage(
    {
      src,
      alt = '',
      width,
      height,
      fill = false,
      priority = false,
      sizes,
      style,
      ...props
    },
    ref,
  ) {
    const source = sourceString(src);
    const info = generatedImageInfo(source);
    const numericWidth = typeof width === 'string' ? Number(width) : width;
    const requestedWidth = Number.isFinite(numericWidth)
      ? Math.max(1, Number(numericWidth) * 2)
      : 768;
    const fallbackSource = info
      ? optimizedImageSource(source, requestedWidth)
      : source;
    const srcSet = info ? responsiveImageSrcSet(source, info) : undefined;
    const fillStyle: CSSProperties | undefined = fill
      ? {
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          ...style,
        }
      : style;

    return (
      // This component supplies the generated srcset that next/image cannot
      // produce under the current Vinext runtime.
      // oxlint-disable-next-line next/no-img-element
      <img
        {...props}
        ref={ref}
        src={fallbackSource}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        style={fillStyle}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
      />
    );
  },
);

export default ResponsiveImage;
