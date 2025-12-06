import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, FileText, Loader2, ArrowRight } from 'lucide-react';
import { useFormContext } from '../context/FormContext';
import { analyzeImage } from '../services/aiService';
import { KATEGORIE, STANY } from '../utils/dictionaries';

const Home = () => {
    const navigate = useNavigate();
    const { updateData, setImagePreview } = useFormContext();
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);

    // Konwersja pliku na Base64
    const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
    });

    // Parsowanie XML i naprawa błędów AI
    const parseXML = (xmlString) => {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

            // Sprawdzenie błędów
            if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
                throw new Error("Błąd parsowania XML");
            }

            const getText = (tag) => xmlDoc.getElementsByTagName(tag)[0]?.textContent?.trim() || '';

            // 1. Pobranie surowych danych
            let rawKat = getText('Kategoria').toUpperCase();
            let rawPodkat = getText('Podkategoria');
            let rawStan = getText('Stan');

            // 2. Normalizacja (Naprawa wielkości liter)
            let finalKat = Object.keys(KATEGORIE).includes(rawKat) ? rawKat : 'INNE';

            let finalPodkat = '';
            if (KATEGORIE[finalKat]) {
                const match = KATEGORIE[finalKat].find(p => p.toLowerCase() === rawPodkat.toLowerCase());
                finalPodkat = match || rawPodkat;
            }

            let finalStan = '';
            const stanMatch = STANY.find(s => s.toLowerCase() === rawStan.toLowerCase());
            finalStan = stanMatch || '';

            // 3. Wysłanie do Contextu
            updateData({
                kategoria: finalKat,
                podkategoria: finalPodkat,
                nazwa: getText('Nazwa'),
                opis: getText('Opis'),     // PL
                opisEN: getText('OpisEN'), // EN
                opisUA: getText('OpisUA'), // UA
                cechy: {
                    kolor: getText('Kolor'),
                    marka: getText('Marka'),
                    stan: finalStan
                }
            });

            // Sukces -> Przejście dalej
            navigate('/formularz');

        } catch (e) {
            console.error("XML Parse Error:", e);
            alert("Nie udało się odczytać danych AI. Spróbuj ponownie.");
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
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-700 max-w-4xl mx-auto px-4 py-8 md:py-12">
            <div className="text-center mb-12">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
                    Dodaj nowy przedmiot
                </h1>
                <p className="text-lg text-slate-700 max-w-2xl mx-auto leading-relaxed">
                    Wybierz metodę wprowadzania danych. System wspiera technologie asystujące oraz automatyzację AI.
                </p>
            </div>

            {loading ? (
                <div role="status" aria-live="polite" className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-slate-200">
                    <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-6" aria-hidden="true" />
                    <h2 className="text-xl font-semibold text-blue-900">Analiza obrazu...</h2>
                    <p className="text-slate-600 mt-2">Przetwarzam cechy i tłumaczę opisy</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
                    <button
                        onClick={() => fileInputRef.current.click()}
                        className="group relative flex flex-col items-start text-left bg-white p-8 rounded-3xl shadow-lg border border-slate-100 transition-all hover:shadow-xl hover:border-blue-500/50 focus-gov"
                    >
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Camera size={36} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Automatycznie (AI)</h2>
                        <p className="text-slate-600 mb-6">Wgraj zdjęcie, a system uzupełni opis i przetłumaczy go na EN/UA.</p>
                        <span className="mt-auto inline-flex items-center text-blue-700 font-bold group-hover:gap-2 transition-all">
                            Rozpocznij <ArrowRight size={20} className="ml-1" />
                        </span>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} tabIndex="-1" />
                    </button>

                    <button
                        onClick={() => { setImagePreview(null); navigate('/formularz'); }}
                        className="group relative flex flex-col items-start text-left bg-white p-8 rounded-3xl shadow-lg border border-slate-100 transition-all hover:shadow-xl hover:border-slate-400/50 focus-gov"
                    >
                        <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                            <FileText size={36} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Ręcznie</h2>
                        <p className="text-slate-600 mb-6">Tradycyjny formularz dla przedmiotów bez zdjęć.</p>
                        <span className="mt-auto inline-flex items-center text-slate-700 font-bold group-hover:gap-2 transition-all">
                            Wypełnij <ArrowRight size={20} className="ml-1" />
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default Home;