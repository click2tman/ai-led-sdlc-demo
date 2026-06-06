// Emits a Schema.org JSON-LD <script> into the document head via Helmet.
// Data is built by src/seo/graph.ts (SPEC §14).
import { Helmet } from 'react-helmet-async';

type JsonLdProps = {
  data: Record<string, unknown>;
};

export function JsonLd({ data }: JsonLdProps) {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  );
}
