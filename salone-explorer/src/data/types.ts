// Canonical domain types for the data layer. The Attraction shape (SPEC
// §6.1) is the contract shared by every repository implementation
// (file, supabase, payload) and the UI. Changing it is a public-contract
// change - stop and ask per CLAUDE.md.

/** A single FAQ entry attached to an attraction (drives FAQPage JSON-LD). */
export type AttractionFaq = {
  question: string;
  answer: string;
};

/** Opening-hours block. `notes` carries "Hours vary - confirm locally"
 * when a source could not confirm exact times (SPEC §4 sourcing rule). */
export type AttractionHours = {
  open: string;
  close: string;
  daysOpen: string;
  notes?: string;
};

/** Geographic placement of an attraction. */
export type AttractionLocation = {
  region: string;
  latitude: number;
  longitude: number;
};

/**
 * A tourist attraction record (SPEC §6.1). All fields are sourced from the
 * authoritative references in SPEC §4; facts are never invented.
 */
export type Attraction = {
  /** kebab-case slug; also the route param at /attractions/:id */
  id: string;
  name: string;
  /** < 140 chars */
  shortDescription: string;
  /** 2-4 paragraphs of plain text */
  longDescription: string;
  location: AttractionLocation;
  hours: AttractionHours;
  /** 0.0-5.0 */
  rating: number;
  reviewCount: number;
  images: string[];
  videoUrl?: string;
  tags: string[];
  /** URLs from SPEC §4 */
  sources: string[];
  faqs?: AttractionFaq[];
  /** ISO date - drives JSON-LD dateModified */
  lastReviewed?: string;
};

/** District -> province lookup row (src/data/regions.json, SPEC §6.5). */
export type Region = {
  district: string;
  province: string;
};
