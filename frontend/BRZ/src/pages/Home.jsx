import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Camera,
	FileText,
	Loader2,
	ArrowRight,
	ScanLine,
	QrCode,
} from 'lucide-react';
import { useFormContext } from '../context/FormContext';
import { analyzeImage } from '../services/aiService';
import { KATEGORIE, STANY } from '../utils/dictionaries';

const Home = () => {
    const navigate = useNavigate();
    const { updateData, setImagePreview } = useFormContext();
    const fileInputRef = useRef(null);
    const qrInputRef = useRef(null);
    const [loading, setLoading] = useState(false);

	const fileToBase64 = (file) =>
		new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result);
			reader.onerror = reject;
		});

	const parseXML = (xmlString) => {
		try {
			const parser = new DOMParser();
			const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
			if (xmlDoc.getElementsByTagName('parsererror').length > 0)
				throw new Error('Błąd parsowania XML');

			const getText = (tag) =>
				xmlDoc.getElementsByTagName(tag)[0]?.textContent?.trim() || '';

			let rawKat = getText('Kategoria').toUpperCase();
			let rawPodkat = getText('Podkategoria');
			let rawStan = getText('Stan');

			let finalKat = Object.keys(KATEGORIE).includes(rawKat) ? rawKat : 'INNE';
			let finalPodkat = '';
			if (KATEGORIE[finalKat]) {
				const match = KATEGORIE[finalKat].find(
					(p) => p.toLowerCase() === rawPodkat.toLowerCase()
				);
				finalPodkat = match || rawPodkat;
			}
			let finalStan = '';
			const stanMatch = STANY.find(
				(s) => s.toLowerCase() === rawStan.toLowerCase()
			);
			finalStan = stanMatch || '';

			updateData({
				kategoria: finalKat,
				podkategoria: finalPodkat,
				nazwa: getText('Nazwa'),
				opis: getText('Opis'),
				opisEN: getText('OpisEN'),
				opisUA: getText('OpisUA'),
				cechy: {
					kolor: getText('Kolor'),
					marka: getText('Marka'),
					stan: finalStan,
				},
			});
			navigate('/formularz');
		} catch (e) {
			console.error(e);
			alert('Nie udało się odczytać danych AI.');
		}
	};

	const handleFileChange = async (e) => {
		const file = e.target.files[0];
		if (!file) return;
		setLoading(true);
		setImagePreview(URL.createObjectURL(file));
		try {
			const base64 = await fileToBase64(file);
			const xml = await analyzeImage(base64);
			parseXML(xml);
		} catch (err) {
			alert('Błąd połączenia z AI.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="animate-in fade-in duration-700 max-w-6xl mx-auto px-4 py-6 md:py-12">
			<div className="text-center mb-8 md:mb-12">
				<h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3 md:mb-4">
					Dodaj nowy przedmiot
				</h1>
				<p className="text-sm md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed px-4">
					Wybierz metodę wprowadzania danych. System wspiera technologie
					asystujące oraz automatyzację AI.
				</p>
			</div>

			{loading ? (
				<div
					role="status"
					aria-live="polite"
					className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl shadow-sm border border-slate-200 mx-4"
				>
					<Loader2
						className="w-12 h-12 text-blue-600 animate-spin mb-4"
						aria-hidden="true"
					/>
					<h2 className="text-lg font-semibold text-blue-900">
						Analiza obrazu...
					</h2>
					<span className="sr-only">
						Proszę czekać, sztuczna inteligencja przetwarza zdjęcie.
					</span>
					<p className="text-sm text-slate-500 mt-1">
						Przetwarzam cechy i tłumaczę opisy
					</p>
				</div>
			) : (
				<>
					<div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-8 items-stretch">
						<button
							onClick={() => fileInputRef.current.click()}
							className="cursor-pointer group w-full h-full relative flex flex-row md:flex-col items-center md:items-start text-left bg-white p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-md border border-slate-100 
                                       transition-all duration-300 ease-out transform md:hover:-translate-y-1 md:hover:shadow-xl md:hover:border-blue-500/50 active:scale-95 md:active:scale-100 focus-gov"
						>
							<div className="shrink-0 w-12 h-12 md:w-16 md:h-16 bg-blue-50 text-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center mr-4 md:mr-0 md:mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
								<Camera className="w-6 h-6 md:w-9 md:h-9 transition-colors duration-300" />
							</div>

							<div className="flex-1 flex flex-col w-full h-full">
								<h2 className="text-lg md:text-2xl font-bold text-slate-900 mb-1 md:mb-2">
									Automatycznie (AI)
								</h2>
								<p className="text-sm md:text-base text-slate-500 mb-0 md:mb-6 leading-tight md:leading-relaxed">
									Zrób zdjęcie, a AI uzupełni opis i przetłumaczy go.
								</p>

								<span className="hidden md:inline-flex mt-auto items-center text-blue-700 font-bold transition-all duration-300 pt-4">
									Rozpocznij{' '}
									<ArrowRight
										size={20}
										className="ml-1 transition-transform group-hover:translate-x-1 duration-300"
									/>
								</span>
							</div>

							<ArrowRight
								className="md:hidden text-slate-300 ml-2 transition-transform duration-200 group-active:translate-x-1"
								size={24}
							/>
							<input
								type="file"
								ref={fileInputRef}
								className="hidden"
								accept="image/*"
								onChange={handleFileChange}
								tabIndex="-1"
							/>
						</button>

						<button
							onClick={() => {
								setImagePreview(null);
								navigate('/formularz');
							}}
							className="cursor-pointer group w-full h-full relative flex flex-row md:flex-col items-center md:items-start text-left bg-white p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-md border border-slate-100 
                                       transition-all duration-300 ease-out transform md:hover:-translate-y-1 md:hover:shadow-xl md:hover:border-slate-400/50 active:scale-95 md:active:scale-100 focus-gov"
						>
							<div className="shrink-0 w-12 h-12 md:w-16 md:h-16 bg-slate-100 text-slate-600 rounded-xl md:rounded-2xl flex items-center justify-center mr-4 md:mr-0 md:mb-6 group-hover:bg-slate-800 group-hover:text-white transition-colors duration-300">
								<FileText className="w-6 h-6 md:w-9 md:h-9 transition-colors duration-300" />
							</div>

							<div className="flex-1 flex flex-col w-full h-full">
								<h2 className="text-lg md:text-2xl font-bold text-slate-900 mb-1 md:mb-2">
									Ręcznie
								</h2>
								<p className="text-sm md:text-base text-slate-500 mb-0 md:mb-6 leading-tight md:leading-relaxed">
									Tradycyjny formularz bez zdjęcia.
								</p>

								<span className="hidden md:inline-flex mt-auto items-center text-slate-700 font-bold transition-all duration-300 pt-4">
									Wypełnij{' '}
									<ArrowRight
										size={20}
										className="ml-1 transition-transform group-hover:translate-x-1 duration-300"
									/>
								</span>
							</div>

							<ArrowRight
								className="md:hidden text-slate-300 ml-2 transition-transform duration-200 group-active:translate-x-1"
								size={24}
							/>
						</button>
					</div>

					<div className="md:hidden mt-8">
						<h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">
							Inne opcje
						</h3>

						<button
							onClick={() => qrInputRef.current.click()}
							className="cursor-pointer group w-full relative flex flex-row items-center text-left bg-slate-900 text-white p-5 rounded-2xl shadow-lg shadow-slate-900/20 active:scale-95 transition-all duration-200 focus-gov"
						>
							<div className="shrink-0 w-12 h-12 bg-white/10 text-white rounded-xl flex items-center justify-center mr-4 backdrop-blur-sm">
								<QrCode className="w-6 h-6 transition-transform duration-200 group-active:scale-110" />
							</div>

							<div className="flex-1">
								<h2 className="text-lg font-bold mb-1">Zeskanuj kod QR</h2>
								<p className="text-sm text-slate-300 leading-tight">
									Szybki skan etykiety magazynowej.
								</p>
							</div>

							<ScanLine
								className="text-slate-400 ml-2 transition-transform duration-200 group-active:scale-110"
								size={24}
							/>

							<input
								type="file"
								ref={qrInputRef}
								className="hidden"
								accept="image/*"
								capture="environment"
								onChange={() => alert('Skaner QR otworzyłby się tutaj.')}
								tabIndex="-1"
							/>
						</button>
					</div>
				</>
			)}
		</div>
	);
};

export default Home;
