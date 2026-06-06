// Visitor-rating badge. Renders a star glyph plus the numeric rating and
// review count. The star is decorative (aria-hidden); the accessible text
// carries the rating value and unit from the content layer (§3.2.4).
import { Star } from 'lucide-react';
import { t } from '@/lib/content';

type RatingBadgeProps = {
  rating: number;
  reviewCount: number;
};

export function RatingBadge({ rating, reviewCount }: RatingBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-text">
      <Star className="h-4 w-4 fill-warning text-warning" aria-hidden="true" />
      <span className="font-medium">{rating.toFixed(1)}</span>
      <span className="text-text-muted">
        ({reviewCount} {t('attraction.rating.reviews')})
      </span>
    </span>
  );
}
