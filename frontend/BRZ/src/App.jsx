import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { FormProvider } from './context/FormContext';

// Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import Home from './pages/Home';
import FormPage from './pages/FormPage';
import SummaryPage from './pages/SummaryPage';

function App() {
	return (
		<FormProvider>
			<Router>
				<div className="flex flex-col min-h-screen bg-slate-50 font-sans">
					<Navbar />

					<main className="grow w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
						<Routes>
							<Route path="/" element={<Home />} />
							<Route path="/formularz" element={<FormPage />} />
							<Route path="/podsumowanie" element={<SummaryPage />} />
						</Routes>
					</main>

					<Footer />
				</div>
			</Router>
		</FormProvider>
	);
}

export default App;
