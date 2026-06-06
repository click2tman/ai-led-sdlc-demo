// Root layout (SPEC §9.1): skip link, persistent NavBar, routed <main>, and
// Footer. Rendered as the router's root route; pages fill the <Outlet/>.
import { Outlet } from 'react-router-dom';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { t } from '@/lib/content';

function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="skip-link">
        {t('app.skipToContent')}
      </a>
      <NavBar />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default App;
