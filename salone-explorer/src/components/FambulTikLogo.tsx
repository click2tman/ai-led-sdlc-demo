// FambulTik logo (SPEC §8.3). Renders the brand mark as an <img> with an
// accessible name from the content layer. The artwork is a single colour
// emblem that reads on light surfaces (the navbar); the variant prop is kept
// for API stability but both map to the same asset.
import logo from '@/assets/brand/fambultik/fambultik-logo.png';
import { t } from '@/lib/content';

// Intrinsic aspect ratio of the logo asset (288 x 240).
const LOGO_RATIO = 288 / 240;

type FambulTikLogoProps = {
  variant?: 'light' | 'dark';
  /** Rendered height in CSS pixels; min 24 mobile / 32 desktop per §8.3. */
  height?: number;
  className?: string;
};

export function FambulTikLogo({ height = 44, className }: FambulTikLogoProps) {
  return (
    <img
      src={logo}
      alt={t('brand.logoAlt')}
      height={height}
      width={Math.round(height * LOGO_RATIO)}
      className={className}
    />
  );
}
