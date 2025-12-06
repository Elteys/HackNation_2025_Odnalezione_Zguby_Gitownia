import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, FileText, Loader2, ArrowRight } from 'lucide-react';
import { useFormContext } from '../context/FormContext';
import { analyzeImage } from '../services/aiService';

const Home = () => {
    const navigate = useNavigate();
    const { updateData, setImagePreview } = useFormContext();
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);

    // Helper Base64
    const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
    });

    // Parsowanie XML
    const parseXML = (xmlString) => {
        try {
            console.log("Parsuję XML:", xmlString);
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, "text/xml");

            // Sprawdzenie błędów XML
            if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
                console.error("Błąd struktury XML!");
                return;
            }

            // Bezpieczne pobieranie tekstu (zabezpieczenie przed nullem)
            const getText = (tag) => {
                const el = xmlDoc.getElementsByTagName(tag)[0];
                return el ? el.textContent.trim() : "";
            };

            // Budujemy obiekt danych
            // WAŻNE: Struktura musi pasować do Twojego FormContext!
            const newData = {
                kategoria: getText("Kategoria").toUpperCase(),
                podkategoria: getText("Podkategoria"),
                nazwa: getText("Nazwa"),
                opis: getText("Opis"),
                // Uwaga: Jeśli w Context masz 'cechy' jako obiekt:
                cechy: {
                    kolor: getText("Kolor"),
                    marka: getText("Marka"),
                    stan: getText("Stan")
                },
                // Jeśli potrzebujesz płaskich danych do mapy/daty:
                miejsce: "Do uzupełnienia",
                data: new Date().toISOString().split('T')[0]
            };

            console.log("Wynik parsowania:", newData);

            // Wysyłamy do Contextu
            // Zakładam, że Twoja funkcja updateData obsługuje nadpisywanie całego obiektu
            updateData(newData);

        } catch (e) {
            console.error("Critical Parse Error:", e);
            alert("Nie udało się odczytać danych ze zdjęcia.");
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        // Ustawiamy podgląd od razu
        setImagePreview(URL.createObjectURL(file));

        try {
            const base64 = await fileToBase64(file);
            const xml = await analyzeImage(base64); // Tu wywoła się AI
            parseXML(xml); // Tu przetworzy się XML
            navigate('/formularz'); // Przejście dalej
        } catch (err) {
            alert("Błąd połączenia z AI. Spróbuj ponownie.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-700">
            <div className="text-center py-12">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
                    Dodaj nowy przedmiot
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Wybierz metodę wprowadzania danych. Skorzystaj z algorytmów AI dla przyspieszenia pracy o 80%.
                </p>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-6" />
                    <h2 className="text-xl font-semibold text-blue-900">Analiza obrazu...</h2>
                    <p className="text-slate-500">Przetwarzam cechy przedmiotu</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto px-4">
                    {/* KARTA AI */}
                    <div
                        onClick={() => fileInputRef.current.click()}
                        className="group cursor-pointer bg-white p-8 rounded-3xl shadow-xl border border-slate-100 hover:shadow-2xl hover:border-blue-500/30 transition-all duration-300 transform hover:-translate-y-1"
                    >
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Camera size={36} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Automatycznie (AI)</h3>
                        <p className="text-slate-500 mb-6">Wgraj zdjęcie, a system sam uzupełni opis, kategorię i cechy.</p>
                        <span className="inline-flex items-center text-blue-600 font-semibold group-hover:gap-2 transition-all">
                            Rozpocznij <ArrowRight size={18} className="ml-1" />
                        </span>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>

                    {/* KARTA RĘCZNA */}
                    <div
                        onClick={() => { setImagePreview(null); navigate('/formularz'); }}
                        className="group cursor-pointer bg-white p-8 rounded-3xl shadow-xl border border-slate-100 hover:shadow-2xl hover:border-slate-400/30 transition-all duration-300 transform hover:-translate-y-1"
                    >
                        <div className="w-16 h-16 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                            <FileText size={36} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Ręcznie</h3>
                        <p className="text-slate-500 mb-6">Tradycyjny formularz dla przedmiotów bez zdjęć lub nietypowych.</p>
                        <span className="inline-flex items-center text-slate-600 font-semibold group-hover:gap-2 transition-all">
                            Wypełnij <ArrowRight size={18} className="ml-1" />
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;