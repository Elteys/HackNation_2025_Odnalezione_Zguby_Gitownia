import React, { useEffect, useState, useRef } from 'react';
import { useFormContext } from '../context/FormContext';
import { useNavigate } from 'react-router-dom';
import MapModal from '../components/MapModal';
import { ArrowLeft, ArrowRight, Tag, ListFilter, MapPin, AlertCircle, Sparkles } from 'lucide-react';
import { KATEGORIE, STANY } from '../utils/dictionaries';
// Importujemy funkcję do tłumaczenia
import { generateTranslations } from '../services/aiService';

const FormPage = () => {
    // Pobieramy dane z Contextu
    const { formData, updateData, imagePreview } = useFormContext();
    const navigate = useNavigate();

    // Stany lokalne
    const [errors, setErrors] = useState({});
    const [activeLang, setActiveLang] = useState('PL');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false); // Stan ładowania tłumaczenia

    // Refy
    const inputRef = useRef(null);
    const dateInputRef = useRef(null);
    const mapObjectRef = useRef(null);

    const currentCoords = {
        lat: formData.lat || 52.2297,
        lng: formData.lng || 21.0122,
    };

    const updateCecha = (field, value) => {
        updateData({
            ...formData,
            cechy: { ...formData.cechy, [field]: value },
        });
    };

    // --- FUNKCJA TŁUMACZENIA RĘCZNEGO ---
    const handleManualTranslation = async () => {
        if (!formData.opis || formData.opis.length < 3) {
            alert("Wpisz najpierw opis po polsku!");
            return;
        }

        setIsTranslating(true);
        try {
            const result = await generateTranslations(formData.opis);
            updateData({
                opisEN: result.en,
                opisUA: result.ua
            });
            // Opcjonalnie: Przełącz na angielski, żeby pokazać że działa
            // setActiveLang('EN'); 
        } catch (error) {
            alert("Błąd podczas tłumaczenia.");
        } finally {
            setIsTranslating(false);
        }
    };

    // --- WALIDACJA ---
    const validateForm = () => {
        const newErrors = {};
        const today = new Date().toISOString().split('T')[0];

        if (!formData.nazwa || formData.nazwa.length < 3) newErrors.nazwa = "Wpisz nazwę (min. 3 znaki).";
        if (!formData.kategoria) newErrors.kategoria = "Wybierz kategorię.";

        if (!formData.data) newErrors.data = "Data jest wymagana.";
        else if (formData.data > today) newErrors.data = "Data nie może być z przyszłości.";

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            const firstError = Object.keys(newErrors)[0];
            document.getElementById(firstError)?.focus();
            return false;
        }
        return true;
    };

    const handleNextStep = () => {
        if (validateForm()) navigate('/podsumowanie');
    };

    // --- MAPA ---
    const handleSaveLocation = (address, coords) => {
        updateData({ miejsce: address, lat: coords.lat, lng: coords.lng });
        updateMapPreview(coords, address);
    };

    const updateMapPreview = (center, address) => {
        const mapEl = document.getElementById('map-preview');
        if (!window.google || !window.google.maps || !mapEl) return;

        if (!mapObjectRef.current) {
            mapObjectRef.current = new window.google.maps.Map(mapEl, { center, zoom: 15, disableDefaultUI: true });
            mapObjectRef.current.marker = new window.google.maps.Marker({ position: center, map: mapObjectRef.current, title: address });
        } else {
            mapObjectRef.current.setCenter(center);
            mapObjectRef.current.marker.setPosition(center);
            mapObjectRef.current.marker.setTitle(address);
        }
    };

    useEffect(() => {
        const initGoogleMaps = () => {
            if (!window.google || !window.google.maps) { setTimeout(initGoogleMaps, 100); return; }
            if (inputRef.current) {
                const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, { types: ['geocode'], componentRestrictions: { country: 'pl' } });
                autocomplete.addListener('place_changed', () => {
                    const place = autocomplete.getPlace();
                    if (place.geometry) handleSaveLocation(place.formatted_address, { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() });
                });
            }
            updateMapPreview(currentCoords, formData.miejsce || 'Wyszukaj lokalizację');
        };
        initGoogleMaps();
    }, [formData.lat, formData.lng]);

    // STYLES
    const focusClasses = 'focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none';
    const getInputClasses = (err) => `w-full p-3 rounded-xl transition-all ${err ? 'bg-red-50 border-2 border-red-500 text-red-900' : 'bg-slate-50 border border-slate-400 text-slate-900'} ${focusClasses}`;

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 animate-in slide-in-from-right-8 duration-500">
            <header className="flex justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Szczegóły zguby</h1>
                    <p className="text-slate-600">Zweryfikuj dane z AI.</p>
                </div>
                {imagePreview && (
                    <div className="relative">
                        <img src={imagePreview} alt="AI Scan" className="w-24 h-24 object-cover rounded-xl shadow-md border-2 border-white" />
                        <span className="absolute -bottom-2 -right-2 bg-green-700 text-white text-xs px-2 py-1 rounded-full font-bold">AI</span>
                    </div>
                )}
            </header>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 p-6 border-b border-slate-200 grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="kategoria" className="font-bold text-sm">Kategoria *</label>
                        <select id="kategoria" className={getInputClasses(errors.kategoria)} value={formData.kategoria} onChange={e => updateData('kategoria', e.target.value)}>
                            <option value="">-- Wybierz --</option>
                            {Object.keys(KATEGORIE).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        {errors.kategoria && <p className="text-red-600 text-sm flex gap-1"><AlertCircle size={14} /> {errors.kategoria}</p>}
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="podkategoria" className="font-bold text-sm">Podkategoria</label>
                        <select id="podkategoria" className={getInputClasses(null)} value={formData.podkategoria} onChange={e => updateData('podkategoria', e.target.value)} disabled={!formData.kategoria}>
                            <option value="">-- Wybierz --</option>
                            {formData.kategoria && KATEGORIE[formData.kategoria]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                            {!KATEGORIE[formData.kategoria]?.includes(formData.podkategoria) && formData.podkategoria && <option value={formData.podkategoria}>{formData.podkategoria} (AI)</option>}
                        </select>
                    </div>
                </div>

                <div className="p-6 md:p-8 space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="nazwa" className="font-bold text-sm">Nazwa *</label>
                        <input id="nazwa" type="text" className={getInputClasses(errors.nazwa)} value={formData.nazwa} onChange={e => updateData('nazwa', e.target.value)} placeholder="np. Telefon" />
                        {errors.nazwa && <p className="text-red-600 text-sm flex gap-1"><AlertCircle size={14} /> {errors.nazwa}</p>}
                    </div>

                    {/* SEKCJA OPISU Z TŁUMACZENIEM */}
                    <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-2 gap-2">
                            <div className="flex flex-col gap-1">
                                <label className="font-bold text-sm flex items-center gap-2">Opis <span className="bg-blue-100 text-blue-800 text-xs px-2 rounded-full">AI Translator</span></label>
                                {/* PRZYCISK TŁUMACZENIA */}
                                <button
                                    type="button"
                                    onClick={handleManualTranslation}
                                    disabled={isTranslating || !formData.opis}
                                    className="text-xs flex items-center gap-1 text-blue-600 font-bold hover:text-blue-800 disabled:opacity-50 transition-colors"
                                >
                                    {isTranslating ? <>⏳ Tłumaczę...</> : <><Sparkles size={12} /> Przetłumacz automatycznie</>}
                                </button>
                            </div>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                {['PL', 'EN', 'UA'].map(lang => (
                                    <button key={lang} onClick={() => setActiveLang(lang)} className={`px-3 py-1 text-xs font-bold rounded ${activeLang === lang ? 'bg-white shadow' : 'text-slate-500'}`}>{lang}</button>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <textarea id="opis" rows="5" className={`${getInputClasses(null)} ${activeLang !== 'PL' ? 'hidden' : ''}`} value={formData.opis} onChange={e => updateData('opis', e.target.value)} placeholder="Opis w języku polskim..." />
                            <textarea id="opisEN" rows="5" className={`${getInputClasses(null)} ${activeLang !== 'EN' ? 'hidden' : ''}`} value={formData.opisEN} onChange={e => updateData('opisEN', e.target.value)} placeholder="Angielski (wygeneruje się automatycznie)..." />
                            <textarea id="opisUA" rows="5" className={`${getInputClasses(null)} ${activeLang !== 'UA' ? 'hidden' : ''}`} value={formData.opisUA} onChange={e => updateData('opisUA', e.target.value)} placeholder="Ukraiński (wygeneruje się automatycznie)..." />
                        </div>
                    </div>

                    <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-200">
                        <h3 className="font-bold text-blue-900 text-sm mb-4 flex items-center gap-2"><Tag size={16} /> Cechy</h3>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div><label className="text-xs font-bold block mb-1">KOLOR</label><input type="text" className={getInputClasses(null)} value={formData.cechy?.kolor || ''} onChange={e => updateCecha('kolor', e.target.value)} /></div>
                            <div><label className="text-xs font-bold block mb-1">MARKA</label><input type="text" className={getInputClasses(null)} value={formData.cechy?.marka || ''} onChange={e => updateCecha('marka', e.target.value)} /></div>
                            <div><label className="text-xs font-bold block mb-1">STAN</label>
                                <select className={getInputClasses(null)} value={formData.cechy?.stan || ''} onChange={e => updateCecha('stan', e.target.value)}>
                                    <option value="">--</option>{STANY.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
                        <div className="space-y-2">
                            <label htmlFor="data" className="font-bold text-sm">Data *</label>
                            <input id="data" type="date" className={getInputClasses(errors.data)} value={formData.data} onChange={e => updateData('data', e.target.value)} />
                            {errors.data && <p className="text-red-600 text-sm flex gap-1"><AlertCircle size={14} /> {errors.data}</p>}
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="miejsce" className="font-bold text-sm">Miejsce</label>
                            <div className="relative">
                                <input id="miejsce" ref={inputRef} type="text" className={`${getInputClasses(null)} pr-10`} value={formData.miejsce} onChange={e => updateData('miejsce', e.target.value)} />
                                <MapPin size={20} className="absolute right-3 top-3 text-slate-400 cursor-pointer" onClick={() => setIsModalOpen(true)} />
                            </div>
                        </div>
                    </div>
                    <div id="map-preview" className="h-48 bg-slate-100 rounded-xl border cursor-pointer" onClick={() => setIsModalOpen(true)}></div>
                </div>

                <div className="bg-slate-50 p-6 flex justify-between border-t">
                    <button onClick={() => navigate('/')} className="px-6 py-2 border rounded-xl font-bold hover:bg-white flex gap-2 items-center"><ArrowLeft size={20} /> Anuluj</button>
                    <button onClick={handleNextStep} className="px-8 py-2 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 flex gap-2 items-center">Podsumowanie <ArrowRight size={20} /></button>
                </div>
            </div>
            <MapModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} currentCoords={currentCoords} onSaveLocation={handleSaveLocation} />
        </div>
    );
};

export default FormPage;