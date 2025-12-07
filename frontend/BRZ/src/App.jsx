import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { FormProvider } from './context/FormContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import DetailsPage from './pages/DetailsPage';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

import Home from './pages/Home';
import FormPage from './pages/FormPage';
import SummaryPage from './pages/SummaryPage';

import PageTransition from './components/layout/PageTransition';

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <PageTransition><Home /></PageTransition>
        } />
        <Route path="/formularz" element={
          <PageTransition><FormPage /></PageTransition>
        } />
        <Route path="/podsumowanie" element={
          <PageTransition><SummaryPage /></PageTransition>
        } />
        <Route path="/szczegoly/:id" element={
          <PageTransition><DetailsPage /></PageTransition>
        } />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <AccessibilityProvider>
      <FormProvider>
        <Router>
          <div className="flex flex-col min-h-screen bg-slate-50 font-sans transition-colors duration-300">
            <Navbar />

            <main className="flex-grow w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 overflow-hidden">
              <AnimatedRoutes />
            </main>

            <Footer />
          </div>
        </Router>
      </FormProvider>
    </AccessibilityProvider>
  );
}

export default App;
