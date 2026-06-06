// Phase 1 scaffold shell. The router, layout, and pages are wired in
// Phase 3 (SPEC §19); this placeholder renders the FambulTik mark so the
// tokenised build is verifiable end-to-end.
import logo from '@/assets/brand/fambultik/logo-dark.svg';

function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface p-8">
      <img src={logo} width={220} height={48} alt="FambulTik" />
      <p className="text-text-muted">Salone Explorer</p>
    </main>
  );
}

export default App;
