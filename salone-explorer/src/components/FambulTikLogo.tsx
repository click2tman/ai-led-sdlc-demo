// FambulTik wordmark (SPEC §8.3). Light variant for dark backgrounds (hero,
// footer), dark variant elsewhere. Rendered as an <img> with an accessible
// name from the content layer; the SVG asset itself carries no semantics.
import logoDark from '@/assets/brand/fambultik/logo-dark.svg';
import logoLight from '@/assets/brand/fambultik/logo-light.svg';
import { t } from '@/lib/content';

type LogoVariant = 'light' | 'dark';

type FambulTikLogoProps = {
  variant?: LogoVariant;
  /** Rendered height in CSS pixels; min 24 mobile / 32 desktop per §8.3. */
  height?: number;
  className?: string;
};

export function FambulTikLogo({
  variant = 'dark',
  height = 32,
  className,
}: FambulTikLogoProps) {
  const src = variant === 'light' ? logoLight : logoDark;
  return (
    <img
      src={src}
      alt={t('brand.logoAlt')}
      height={height}
      width={(height * 220) / 48}
      className={className}
    />
  );
}
