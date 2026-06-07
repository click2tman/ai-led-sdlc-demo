// Emits a Schema.org JSON-LD <script> into the document head via Helmet.
// Data is built by src/seo/graph.ts (SPEC §14); serializeJsonLd does the
// "<" escaping that prevents a "</script>" breakout (the single XSS control).
import { Helmet } from 'react-helmet-async';
import { serializeJsonLd } from './graph';

type JsonLdProps = {
  data: Record<string, unknown>;
};

export function JsonLd({ data }: JsonLdProps) {
  const json = serializeJsonLd(data);
  return (
    <Helmet>
      <script type="application/ld+json">{json}</script>
    </Helmet>
  );
}
