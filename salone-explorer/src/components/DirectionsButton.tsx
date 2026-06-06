// Get-directions link. Opens a Google Maps directions deep link (no API
// key, SPEC §3) in a new tab with rel="noopener noreferrer" (SPEC §15). The
// accessible name notes that a new tab opens (WCAG 2.4.4 link purpose).
import { MapPin } from 'lucide-react';
import type { AttractionLocation } from '@/data/types';
import { buttonVariants } from './Button';
import { t } from '@/lib/content';

type DirectionsButtonProps = {
  location: AttractionLocation;
  attractionName: string;
};

export function DirectionsButton({ location, attractionName }: DirectionsButtonProps) {
  const destination = `${location.latitude},${location.longitude}`;
  const href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    destination,
  )}`;
  const accessibleName = `${t('attraction.directions.cta')}: ${attractionName} (${t(
    'attraction.directions.ariaSuffix',
  )})`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={accessibleName}
      className={buttonVariants({ variant: 'primary' })}
    >
      <MapPin className="h-5 w-5" aria-hidden="true" />
      {t('attraction.directions.cta')}
    </a>
  );
}
