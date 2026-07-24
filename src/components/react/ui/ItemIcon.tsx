import React from 'react';
import { twMerge } from 'tailwind-merge';

// Flask base-type icons (all-basetypes.json's IconPath, from a community
// bulk-icon mirror — see src/_utils/utils.ts's iconsByBaseName) are, unlike
// every other base type/unique/gem icon this app renders, served as a
// 3-frame horizontal spritesheet rather than a single flat image. Verified
// by downloading several real flask IconPaths directly: every one is
// exactly 143x95px, i.e. 3 equal-width frames each at the ~1:2 aspect ratio
// a single flask actually is. Composited back-to-front as [rightmost frame
// (opaque colour-fill silhouette), middle frame (shading/highlight
// overlay), leftmost frame (empty glass outline)] — confirmed by
// compositing real icons both ways: this order reads as a normal flask,
// the reverse looks wrong (outline buried under the fill).
const isFlaskSpritesheet = (src: string) => src.includes('/Art/2DItems/Flasks/');

type ItemIconProps = Omit<React.ComponentPropsWithoutRef<'img'>, 'src'> & {
  src?: string | null;
};

// Drop-in replacement for a plain `<img>` rendering a base-type/order icon —
// transparently layers flask spritesheets into a proper-looking icon,
// renders anything else exactly like a normal `<img>` would. Forwards its
// ref and spreads every other prop onto the root element (not just
// src/alt/className) because OrderItemPopover's PopoverTrigger `asChild`
// clones its hover/focus handlers and ref straight onto this component's
// root — dropping them silently disables the popover entirely, which is
// exactly what happened before this was a forwardRef component.
export const ItemIcon = React.forwardRef<
  HTMLImageElement | HTMLDivElement,
  ItemIconProps
>(function ItemIcon({ src, alt = '', className, ...rest }, ref) {
  if (!src) return null;

  if (!isFlaskSpritesheet(src)) {
    return (
      <img
        ref={ref as React.Ref<HTMLImageElement>}
        src={src}
        alt={alt}
        className={className}
        {...rest}
      />
    );
  }

  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      role="img"
      aria-label={alt || undefined}
      className={twMerge('flex shrink-0 items-center justify-center', className)}
      {...rest}
    >
      <div className="relative aspect-[1/2] h-full max-w-full">
        {[100, 50, 0].map((positionX) => (
          <div
            key={positionX}
            className="pointer-events-none absolute inset-0 bg-no-repeat"
            style={{
              backgroundImage: `url(${src})`,
              backgroundSize: '300% 100%',
              backgroundPositionX: `${positionX}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
});
