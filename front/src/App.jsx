import { lazy, Suspense } from 'react';
import Header from './components/Header';
import Introduction from './components/Introduction';
import Display from './components/Display';
import Contact from './components/Contact';
import Footer from './components/Footer';
import './App.css';
import Loading from './components/Loading';

// Carregamento lazy para componentes pesados
const OraculoModal = lazy(() => import('./components/OraculoModal'));
const Interpretacao = lazy(() => import('./components/Interpretacao'));

function App() {
  return (
    <>
      <Header />
      <main>
        <Introduction />
        
        {/* Suspense para componentes carregados lazy */}
        <Suspense fallback={<Loading />}>
          <OraculoModal />
          <Interpretacao />
        </Suspense>
        
        <Display />
        <Contact />
      </main>
      <Footer />
    </>   
  );
}

export default App;