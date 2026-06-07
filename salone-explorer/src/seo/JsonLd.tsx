// Emits a Schema.org JSON-LD <script> (SPEC §14). React 19 does not hoist
// application/ld+json scripts, so this is rendered directly inside the
// document <head> by the Document (entry-server) from the route's graph
// (routes.tsx `handle`). serializeJsonLd (graph.ts) does the "<" -> escape
// that prevents a "</script>" breakout - the single JSON-LD XSS control; the
// escaped string is injected via dangerouslySetInnerHTML so the JSON renders
// verbatim (not HTML-escaped by React).
import { serializeJsonLd } from './graph';

type JsonLdProps = {
  data: Record<string, unknown>;
};

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
