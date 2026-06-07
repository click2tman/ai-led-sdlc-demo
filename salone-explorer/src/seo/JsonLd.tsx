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
  // serializeJsonLd escapes "<" (the JSON-LD XSS control, unit-tested); the
  // value is our own serialized Schema.org graph, never raw user HTML. This is
  // the standard, safe way to embed JSON-LD in React.
  const html = serializeJsonLd(data);
  // nosemgrep -- html is escaped by serializeJsonLd (the JSON-LD XSS control)
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: html }} />;
}
