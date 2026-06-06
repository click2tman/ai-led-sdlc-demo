// Emits a Schema.org JSON-LD <script> into the document head via Helmet.
// Data is built by src/seo/graph.ts (SPEC §14).
import { Helmet } from 'react-helmet-async';

type JsonLdProps = {
  data: Record<string, unknown>;
};

export function JsonLd({ data }: JsonLdProps) {
  // Escape "<" so a string containing "</script>" (e.g. an FAQ or description)
  // cannot break out of the script element or survive the prerender
  // serialization as markup. "<" is valid inside JSON-LD.
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return (
    <Helmet>
      <script type="application/ld+json">{json}</script>
    </Helmet>
  );
}
