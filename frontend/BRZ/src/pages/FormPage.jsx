import React, { useEffect } from 'react';
import { useFormContext } from '../context/FormContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Tag, Info, ListFilter } from 'lucide-react';
import { KATEGORIE, STANY } from '../utils/dictionaries'; // Import słowników

const FormPage = () => {
    const { formData, updateData, imagePreview } = useFormContext();
    const navigate = useNavigate();

    // Helper do aktualizacji zagnieżdżonych cech
    const updateCecha = (field, value) => {
        updateData({
            ...formData,
            cechy: {
                ...formData.cechy,
                [field]: value
            }
        });
    };

    // Zabezpieczenie: Jeśli zmienimy kategorię, czyścimy podkategorię, jeśli nie pasuje
    useEffect(() => {
        if (formData.kategoria && KATEGORIE[formData.kategoria]) {
            const dostepnePodkategorie = KATEGORIE[formData.kategoria];
            if (!dostepnePodkategorie.includes(formData.podkategoria)) {
                // Opcjonalnie: można tu czyścić, ale przy AI lepiej zostawić to co wpisało
                // updateData('podkategoria', ''); 
            }
        }
    }, [formData.kategoria]);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-in slide-in-from-right-8 duration-500">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Szczegóły zguby</h2>
                    <p className="text-slate-500 mt-1">Zweryfikuj dane wygenerowane przez system.</p>
                </div>
                {imagePreview && (
                    <div className="relative group">
                        <img src={imagePreview} alt="Zguba" className="w-24 h-24 object-cover rounded-xl shadow-md border-2 border-white" />
                        <span className="absolute -bottom-2 -right-2 bg-green-600 text-white text-[10px] px-2 py-1 rounded-full font-bold shadow-sm">AI SCAN</span>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">

                {/* SEKCJA 1: KLASYFIKACJA */}
                <div className="bg-slate-50 p-6 border-b border-slate-200">
                    <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <ListFilter size={16} /> Klasyfikacja przedmiotu
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* KATEGORIA */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Kategoria główna</label>
                            <select
                                className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                                value={formData.kategoria}
                                onChange={(e) => updateData('kategoria', e.target.value)}
                            >
                                <option value="">-- Wybierz kategorię --</option>
                                {Object.keys(KATEGORIE).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* PODKATEGORIA (Zależna) */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Podkategoria</label>
                            <select
                                className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm disabled:bg-slate-100 disabled:text-slate-400"
                                value={formData.podkategoria}
                                onChange={(e) => updateData('podkategoria', e.target.value)}
                                disabled={!formData.kategoria}
                            >
                                <option value="">-- Wybierz podkategorię --</option>
                                {formData.kategoria && KATEGORIE[formData.kategoria]?.map(sub => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                                {/* Fallback jeśli AI wpisało coś spoza listy */}
                                {!KATEGORIE[formData.kategoria]?.includes(formData.podkategoria) && formData.podkategoria && (
                                    <option value={formData.podkategoria}>{formData.podkategoria} (z AI)</option>
                                )}
                            </select>
                        </div>
                    </div>
                </div>

                {/* SEKCJA 2: OPIS SZCZEGÓŁOWY */}
                <div className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Nazwa przedmiotu (Nagłówek ogłoszenia)</label>
                        <input
                            type="text"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                            value={formData.nazwa}
                            onChange={(e) => updateData('nazwa', e.target.value)}
                            placeholder="np. Smartfon Samsung Galaxy S20 w czarnym etui"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 flex justify-between">
                            Opis wizualny
                            <span className="text-xs text-slate-400 font-normal">Staraj się unikać danych osobowych</span>
                        </label>
                        <textarea
                            rows="5"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={formData.opis}
                            onChange={(e) => updateData('opis', e.target.value)}
                        />
                    </div>

                    {/* CECHY SZCZEGÓLNE - GRID */}
                    <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                        <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Tag size={16} /> Cechy identyfikacyjne
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* KOLOR */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Kolor dominujący</label>
                                <input
                                    type="text"
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
                                    value={formData.cechy?.kolor || ''}
                                    onChange={(e) => updateCecha('kolor', e.target.value)}
                                    placeholder="np. czarny"
                                />
                            </div>
                            {/* MARKA */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Marka / Producent</label>
                                <input
                                    type="text"
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
                                    value={formData.cechy?.marka || ''}
                                    onChange={(e) => updateCecha('marka', e.target.value)}
                                    placeholder="np. Samsung"
                                />
                            </div>
                            {/* STAN */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Stan przedmiotu</label>
                                <select
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
                                    value={formData.cechy?.stan || ''}
                                    onChange={(e) => updateCecha('stan', e.target.value)}
                                >
                                    <option value="">Nieokreślony</option>
                                    {STANY.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* DATA I MIEJSCE */}
                    <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Data znalezienia</label>
                            <input
                                type="date"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.data}
                                onChange={(e) => updateData('data', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Miejsce znalezienia</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.miejsce}
                                    onChange={(e) => updateData('miejsce', e.target.value)}
                                    placeholder="np. Park Miejski, ławka przy stawie"
                                />
                                <Info size={16} className="absolute right-3 top-3.5 text-slate-400" />
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer formularza */}
                <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="text-slate-500 font-semibold hover:text-slate-800 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                        <ArrowLeft size={18} /> Anuluj
                    </button>
                    <button
                        onClick={() => navigate('/podsumowanie')}
                        className="bg-blue-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-800 transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20 transform hover:-translate-y-0.5"
                    >
                        Podsumowanie <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FormPage;