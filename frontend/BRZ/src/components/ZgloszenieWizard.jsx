import React, { useState, useRef } from 'react';
import { Camera, FileText, ArrowRight, ArrowLeft, CheckCircle, Upload, Loader2, MapPin } from 'lucide-react';
import { analyzeImage } from '../services/aiService';

const ZgloszenieWizard = () => {
    const [step, setStep] = useState(1); 
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        kategoria: '',
        nazwa: '',
        opis: '',
        kolor: '',
        miejsce: '', 
        data: new Date().toISOString().split('T')[0]
    });

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const parseXMLToForm = (xmlString) => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        const getText = (tag) => {
            const el = xmlDoc.getElementsByTagName(tag)[0];
            return el ? el.textContent : "";
        };

        setFormData(prev => ({
            ...prev,
            kategoria: getText("Kategoria") || "INNE",
            nazwa: getText("Nazwa"),
            opis: getText("Opis"),
            kolor: getText("Kolor")
        }));
    };

    const handleAiSelect = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setPreview(URL.createObjectURL(file));
        setLoading(true);

        try {
            const base64 = await fileToBase64(file);
            const xmlResult = await analyzeImage(base64);
            parseXMLToForm(xmlResult);
            setStep(2); 
        } catch (error) {
            alert("Błąd AI - spróbuj ponownie lub wpisz ręcznie.");
        } finally {
            setLoading(false);
        }
    };

    const handleManualSelect = () => {
        setPreview(null);
        setStep(2);
    };

    const handlePublish = () => {
        alert("Dane wysłane do API dane.gov.pl! (Tu następuje generowanie QR)");
    };


    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">

            <header className="bg-white shadow-sm border-b-4 border-red-600">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                        PL
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-blue-900 tracking-tight">Odnalezione Zguby</h1>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Portal Urzędnika • dane.gov.pl</p>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto mt-8 px-4 pb-12">

                <div className="flex justify-between mb-8 relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 rounded"></div>
                    {[1, 2, 3].map((s) => (
                        <div key={s} className={`flex flex-col items-center gap-2 bg-slate-50 px-2 ${step >= s ? 'text-blue-900 font-bold' : 'text-slate-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 ${step >= s ? 'bg-blue-900 text-white border-blue-900' : 'bg-white border-slate-300'}`}>
                                {s}
                            </div>
                            <span className="text-xs">{s === 1 ? 'Metoda' : s === 2 ? 'Dane' : 'Publikacja'}</span>
                        </div>
                    ))}
                </div>

                {loading && (
                    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                        <h2 className="text-xl font-semibold text-blue-900">Sztuczna inteligencja analizuje zdjęcie...</h2>
                        <p className="text-slate-500">Rozpoznaję markę, kolor i uszkodzenia.</p>
                    </div>
                )}

                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-2xl font-bold text-center text-slate-800">W jaki sposób chcesz dodać zgubę?</h2>

                        <div className="grid md:grid-cols-2 gap-6 mt-8">
                            <button
                                onClick={handleAiSelect}
                                className="group relative bg-white p-8 rounded-2xl shadow-md border-2 border-transparent hover:border-blue-500 hover:shadow-xl transition-all text-left"
                            >
                                <div className="absolute top-4 right-4 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                                    ZALECANE
                                </div>
                                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Camera size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">Użyj Asystenta AI</h3>
                                <p className="text-slate-500 text-sm mt-2">
                                    Zrób zdjęcie, a system automatycznie wypełni formularz, rozpozna kategorię i opisze przedmiot.
                                </p>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </button>

                            <button
                                onClick={handleManualSelect}
                                className="bg-white p-8 rounded-2xl shadow-md border-2 border-transparent hover:border-slate-400 hover:shadow-xl transition-all text-left"
                            >
                                <div className="w-14 h-14 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center mb-4">
                                    <FileText size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">Wypełnij ręcznie</h3>
                                <p className="text-slate-500 text-sm mt-2">
                                    Tradycyjny formularz. Wybierz tę opcję, jeśli nie możesz zrobić zdjęcia (np. gotówka).
                                </p>
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg animate-in fade-in slide-in-from-right-8 duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">Uzupełnij szczegóły</h2>
                            {preview && (
                                <img src={preview} alt="Podgląd" className="w-16 h-16 object-cover rounded-lg border shadow-sm" />
                            )}
                        </div>

                        <div className="grid gap-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Kategoria</label>
                                    <select
                                        value={formData.kategoria}
                                        onChange={(e) => setFormData({ ...formData, kategoria: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    >
                                        <option value="">Wybierz kategorię...</option>
                                        <option value="ELEKTRONIKA">Elektronika</option>
                                        <option value="DOKUMENTY">Dokumenty</option>
                                        <option value="ODZIEZ">Odzież</option>
                                        <option value="INNE">Inne</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nazwa przedmiotu</label>
                                    <input
                                        type="text"
                                        value={formData.nazwa}
                                        onChange={(e) => setFormData({ ...formData, nazwa: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="np. Smartfon Samsung"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Szczegółowy opis
                                    <span className="text-xs text-green-600 ml-2 font-normal">(Wypełnione przez AI)</span>
                                </label>
                                <textarea
                                    rows="4"
                                    value={formData.opis}
                                    onChange={(e) => setFormData({ ...formData, opis: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Data znalezienia</label>
                                    <input
                                        type="date"
                                        value={formData.data}
                                        onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Miejsce (Opis)</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            value={formData.miejsce}
                                            onChange={(e) => setFormData({ ...formData, miejsce: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="np. Autobus 152"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
                            <button
                                onClick={() => setStep(1)}
                                className="flex items-center text-slate-600 hover:text-blue-900 font-medium px-4 py-2"
                            >
                                <ArrowLeft size={18} className="mr-2" /> Wróć
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                className="bg-blue-900 hover:bg-blue-800 text-white px-8 py-2.5 rounded-lg font-semibold flex items-center shadow-lg hover:shadow-blue-900/20 transition-all"
                            >
                                Dalej <ArrowRight size={18} className="ml-2" />
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg animate-in fade-in slide-in-from-right-8 duration-300">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">Sprawdź dane przed publikacją</h2>
                            <p className="text-slate-500">To ostatni krok przed wysłaniem danych do dane.gov.pl</p>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                            <dl className="grid md:grid-cols-2 gap-x-4 gap-y-6">
                                <div>
                                    <dt className="text-sm font-medium text-slate-500">Kategoria</dt>
                                    <dd className="text-lg font-semibold text-slate-900">{formData.kategoria || "-"}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-slate-500">Nazwa</dt>
                                    <dd className="text-lg font-semibold text-slate-900">{formData.nazwa || "-"}</dd>
                                </div>
                                <div className="md:col-span-2">
                                    <dt className="text-sm font-medium text-slate-500">Opis</dt>
                                    <dd className="text-slate-700 bg-white p-3 rounded border border-slate-200 mt-1 italic">
                                        "{formData.opis}"
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-slate-500">Miejsce</dt>
                                    <dd className="text-slate-900">{formData.miejsce || "-"}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-slate-500">Data znalezienia</dt>
                                    <dd className="text-slate-900">{formData.data}</dd>
                                </div>
                            </dl>
                        </div>

                        <div className="flex justify-between mt-8">
                            <button
                                onClick={() => setStep(2)}
                                className="flex items-center text-slate-600 hover:text-blue-900 font-medium px-4 py-2"
                            >
                                <ArrowLeft size={18} className="mr-2" /> Popraw
                            </button>
                            <button
                                onClick={handlePublish}
                                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-bold flex items-center shadow-lg shadow-red-600/20 transition-all"
                            >
                                <Upload size={18} className="mr-2" /> OPUBLIKUJ DANE
                            </button>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};

export default ZgloszenieWizard;