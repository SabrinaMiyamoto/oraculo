import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';
import Header from './components/Header';
import Introduction from './components/Introduction';
import Display from './components/Display';
import Contact from './components/Contact'; 
import Footer from './components/Footer';
import './App.css';
import Loading from './components/Loading';

const OraculoModal = lazy(() => import('./components/OraculoModal'));
const Interpretacao = lazy(() => import('./components/Interpretacao'));
const FormRealScheduling = lazy (() => import('./components/FormRealScheduling'));

function App() {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Introduction />
                <Suspense fallback={<Loading />}>
                  <OraculoModal />
                  <Interpretacao />
                </Suspense>
                <Display />
                <Contact />
              </>
            }
          />
          <Route
            path="/agendamento-online"
            element={
              <Suspense fallback={<Loading />}>
                <FormRealScheduling />
              </Suspense>
            }
          />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;