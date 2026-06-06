// Attraction grid card (SPEC §8.5 Card, §9.2). Uses the stretched-link
// pattern so the whole card is a single accessible link named by the
// attraction title. Facts come from the Attraction record; labels via t().
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import type { Attraction } from '@/data/types';
import { attractionPath } from '@/lib/site';
import { RatingBadge } from './RatingBadge';

type AttractionCardProps = {
  attraction: Attraction;
};

export function AttractionCard({ attraction }: AttractionCardProps) {
  return (
    <article className="relative flex flex-col overflow-hidden rounded-lg border border-border bg-bg shadow-sm transition-shadow hover:shadow-md focus-within:shadow-md">
      <img
        src={attraction.images[0]}
        alt={attraction.name}
        width={640}
        height={360}
        loading="lazy"
        className="aspect-video w-full object-cover"
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="flex items-center gap-1 text-sm text-text-muted">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          {attraction.location.region}
        </p>
        <h3 className="text-lg font-semibold">
          <Link
            to={attractionPath(attraction.id)}
            className="after:absolute after:inset-0 after:content-[''] hover:text-brand-primary"
          >
            {attraction.name}
          </Link>
        </h3>
        <RatingBadge rating={attraction.rating} reviewCount={attraction.reviewCount} />
        <p className="text-sm text-text-muted">{attraction.shortDescription}</p>
        <ul className="mt-auto flex flex-wrap gap-1.5 pt-2">
          {attraction.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-brand-sand px-2.5 py-0.5 text-xs font-medium text-warning"
            >
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
