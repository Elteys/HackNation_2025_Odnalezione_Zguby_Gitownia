// src/pages/FormPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useFormContext } from '../context/FormContext';
import { useNavigate } from 'react-router-dom';
import MapModal from '../components/MapModal';
import { ArrowLeft, ArrowRight, Tag, ListFilter, MapPin, AlertCircle } from 'lucide-react'; // Dodałem AlertCircle
import { KATEGORIE, STANY } from '../utils/dictionaries';

const FormPage = () => {
    const { formData, updateData, imagePreview } = useFormContext();
    const navigate = useNavigate();

    // --- 1. NOWY STAN DO BŁĘDÓW ---
    const [errors, setErrors] = useState({});

    // Refy
    const inputRef = useRef(null);
    const dateInputRef = useRef(null);
    const mapObjectRef = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    // --- WALIDACJA (NOWOŚĆ) ---
    const validateForm = () => {
        const newErrors = {};
        const today = new Date().toISOString().split('T')[0];

        // 1. Nazwa (min. 3 znaki)
        if (!formData.nazwa) {
            newErrors.nazwa = "Nazwa przedmiotu jest wymagana.";
        } else if (formData.nazwa.trim().length < 3) {
            newErrors.nazwa = "Nazwa jest zbyt krótka (min. 3 znaki).";
        }

        // 2. Kategoria (wymagana)
        if (!formData.kategoria) {
            newErrors.kategoria = "Wybierz kategorię z listy.";
        }

        // 3. Data (wymagana, nie z przyszłości, nie sprzed 2000 roku)
        if (!formData.data) {
            newErrors.data = "Data znalezienia jest wymagana.";
        } else {
            if (formData.data > today) {
                newErrors.data = "Data nie może być z przyszłości.";
            }
            if (formData.data < "2000-01-01") {
                newErrors.data = "Data wydaje się niepoprawna (zbyt odległa).";
            }
        }

        setErrors(newErrors);

        // Auto-focus na pierwszy błąd (WCAG)
        if (Object.keys(newErrors).length > 0) {
            const firstErrorKey = Object.keys(newErrors)[0];
            const element = document.getElementById(firstErrorKey);
            if (element) {
                element.focus();
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return false;
        }

        return true;
    };

    const handleNextStep = () => {
        if (validateForm()) {
            navigate('/podsumowanie');
        }
    };

    // --- FUNKCJE MAPY ---
    const handleSaveLocation = (address, coords) => {
        updateData({ miejsce: address, lat: coords.lat, lng: coords.lng });
        updateMapPreview(coords, address);
    };

    const updateMapPreview = (center, address) => {
        const mapElement = document.getElementById('map-preview');
        if (!window.google || !window.google.maps || !mapElement) return;

        if (!mapObjectRef.current) {
            mapObjectRef.current = new window.google.maps.Map(mapElement, {
                center: center, zoom: 15, disableDefaultUI: true,
            });
            mapObjectRef.current.marker = new window.google.maps.Marker({
                position: center, map: mapObjectRef.current, title: address,
            });
        } else {
            mapObjectRef.current.setCenter(center);
            mapObjectRef.current.marker.setPosition(center);
            mapObjectRef.current.marker.setTitle(address);
        }
    };

    useEffect(() => {
        const initGoogleMaps = () => {
            if (!window.google || !window.google.maps) {
                setTimeout(initGoogleMaps, 100);
                return;
            }
            if (inputRef.current) {
                const autocomplete = new window.google.maps.places.Autocomplete(
                    inputRef.current, { types: ['geocode'], componentRestrictions: { country: 'pl' } }
                );
                autocomplete.addListener('place_changed', () => {
                    const place = autocomplete.getPlace();
                    if (place.geometry && place.formatted_address) {
                        const lat = place.geometry.location.lat();
                        const lng = place.geometry.location.lng();
                        handleSaveLocation(place.formatted_address, { lat, lng });
                    }
                });
            }
            updateMapPreview(currentCoords, formData.miejsce || 'Wyszukaj lokalizację');
        };
        initGoogleMaps();
    }, [formData.lat, formData.lng]);

    // Klasy stylów
    const focusClasses = 'focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none';

    // Helper do klas inputów (Czerwona ramka przy błędzie)
    const getInputClasses = (error) => `
        w-full p-3 md:p-4 rounded-xl transition-all 
        ${error
            ? 'bg-red-50 border-2 border-red-500 text-red-900 focus:ring-red-500 placeholder:text-red-300'
            : 'bg-slate-50 border border-slate-400 text-slate-900 placeholder:text-slate-500 focus:border-yellow-500 focus:ring-yellow-500'}
        ${focusClasses}
    `;

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 animate-in slide-in-from-right-8 duration-500">
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Szczegóły zguby</h1>
                    <p className="text-slate-600 mt-1">Pola oznaczone gwiazdką (<span className="text-red-600 font-bold">*</span>) są wymagane.</p>
                </div>
                {imagePreview && (
                    <div className="relative group shrink-0">
                        <img src={imagePreview} alt="Podgląd" className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-xl shadow-md border-2 border-white" />
                        <span className="absolute -bottom-2 -right-2 bg-green-700 text-white text-[10px] px-2 py-1 rounded-full font-bold shadow-sm">AI</span>
                    </div>
                )}
            </header>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                {/* SEKCJA 1: KLASYFIKACJA */}
                <div className="bg-slate-50 p-6 border-b border-slate-200">
                    <h2 className="text-base font-bold text-blue-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <ListFilter size={18} aria-hidden="true" /> Klasyfikacja
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* KATEGORIA */}
                        <div className="space-y-2">
                            <label htmlFor="kategoria" className="text-sm font-bold text-slate-800">
                                Kategoria główna <span className="text-red-600">*</span>
                            </label>
                            <select
                                id="kategoria"
                                className={getInputClasses(errors.kategoria).replace('bg-slate-50', 'bg-white')}
                                value={formData.kategoria}
                                onChange={(e) => {
                                    updateData('kategoria', e.target.value);
                                    if (errors.kategoria) setErrors({ ...errors, kategoria: null }); // Czyść błąd przy zmianie
                                }}
                            >
                                <option value="">-- Wybierz kategorię --</option>
                                {Object.keys(KATEGORIE).map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            {/* Komunikat błędu */}
                            {errors.kategoria && (
                                <p className="text-red-600 text-sm font-medium flex items-center gap-1 mt-1 animate-in slide-in-from-top-1">
                                    <AlertCircle size={14} /> {errors.kategoria}
                                </p>
                            )}
                        </div>

                        {/* PODKATEGORIA */}
                        <div className="space-y-2">
                            <label htmlFor="podkategoria" className="text-sm font-bold text-slate-800">Podkategoria</label>
                            <select
                                id="podkategoria"
                                className={`w-full p-3 md:p-4 bg-white border border-slate-400 rounded-xl text-slate-900 shadow-sm disabled:bg-slate-100 disabled:text-slate-500 ${focusClasses}`}
                                value={formData.podkategoria}
                                onChange={(e) => updateData('podkategoria', e.target.value)}
                                disabled={!formData.kategoria}
                            >
                                <option value="">-- Wybierz podkategorię --</option>
                                {formData.kategoria && KATEGORIE[formData.kategoria]?.map((sub) => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                                {!KATEGORIE[formData.kategoria]?.includes(formData.podkategoria) && formData.podkategoria && (
                                    <option value={formData.podkategoria}>{formData.podkategoria} (AI)</option>
                                )}
                            </select>
                        </div>
                    </div>
                </div>

                {/* SEKCJA 2: OPIS SZCZEGÓŁOWY */}
                <div className="p-6 md:p-8 space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="nazwa" className="text-sm font-bold text-slate-800">
                            Nazwa przedmiotu <span className="text-red-600">*</span>
                        </label>
                        <input
                            id="nazwa"
                            type="text"
                            className={getInputClasses(errors.nazwa)}
                            value={formData.nazwa}
                            onChange={(e) => {
                                updateData('nazwa', e.target.value);
                                if (errors.nazwa) setErrors({ ...errors, nazwa: null });
                            }}
                            placeholder="np. Smartfon Samsung Galaxy S20"
                        />
                        {errors.nazwa && (
                            <p className="text-red-600 text-sm font-medium flex items-center gap-1 mt-1 animate-in slide-in-from-top-1">
                                <AlertCircle size={14} /> {errors.nazwa}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="opis" className="text-sm font-bold text-slate-800 flex flex-col sm:flex-row sm:justify-between sm:items-center">
                            Opis wizualny
                            <span className="text-xs text-slate-600 font-normal mt-1 sm:mt-0">Unikaj danych osobowych (RODO)</span>
                        </label>
                        <textarea
                            id="opis"
                            rows="5"
                            className={`${getInputClasses(null)}`}
                            value={formData.opis}
                            onChange={(e) => updateData('opis', e.target.value)}
                        />
                    </div>

                    {/* GRID CECH */}
                    <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-200" role="group" aria-labelledby="cechy-header">
                        <h2 id="cechy-header" className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Tag size={18} aria-hidden="true" /> Cechy identyfikacyjne
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="cecha-kolor" className="block text-xs font-bold text-slate-700 mb-1 uppercase">Kolor</label>
                                <input
                                    id="cecha-kolor"
                                    type="text"
                                    className={`w-full p-3 bg-white border border-slate-300 rounded-lg text-slate-900 ${focusClasses}`}
                                    value={formData.cechy?.kolor || ''}
                                    onChange={(e) => updateCecha('kolor', e.target.value)}
                                    placeholder="np. czarny"
                                />
                            </div>
                            <div>
                                <label htmlFor="cecha-marka" className="block text-xs font-bold text-slate-700 mb-1 uppercase">Marka</label>
                                <input
                                    id="cecha-marka"
                                    type="text"
                                    className={`w-full p-3 bg-white border border-slate-300 rounded-lg text-slate-900 ${focusClasses}`}
                                    value={formData.cechy?.marka || ''}
                                    onChange={(e) => updateCecha('marka', e.target.value)}
                                    placeholder="np. Samsung"
                                />
                            </div>
                            <div>
                                <label htmlFor="cecha-stan" className="block text-xs font-bold text-slate-700 mb-1 uppercase">Stan</label>
                                <select
                                    id="cecha-stan"
                                    className={`w-full p-3 bg-white border border-slate-300 rounded-lg text-slate-900 ${focusClasses}`}
                                    value={formData.cechy?.stan || ''}
                                    onChange={(e) => updateCecha('stan', e.target.value)}
                                >
                                    <option value="">-- Wybierz --</option>
                                    {STANY.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* DATA I MIEJSCE */}
                    <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                        <div className="space-y-2">
                            <label htmlFor="data" className="text-sm font-bold text-slate-800">
                                Data znalezienia <span className="text-red-600">*</span>
                            </label>
                            <div className="relative cursor-pointer" onClick={() => dateInputRef.current && dateInputRef.current.showPicker()}>
                                <input
                                    id="data"
                                    ref={dateInputRef}
                                    type="date"
                                    className={`${getInputClasses(errors.data)} cursor-pointer`}
                                    value={formData.data}
                                    onChange={(e) => {
                                        updateData('data', e.target.value);
                                        if (errors.data) setErrors({ ...errors, data: null });
                                    }}
                                />
                            </div>
                            {errors.data && (
                                <p className="text-red-600 text-sm font-medium flex items-center gap-1 mt-1 animate-in slide-in-from-top-1">
                                    <AlertCircle size={14} /> {errors.data}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="miejsce" className="text-sm font-bold text-slate-800">Miejsce znalezienia</label>
                            <div className="relative">
                                <input
                                    id="miejsce"
                                    ref={inputRef}
                                    type="text"
                                    className={`${getInputClasses(null)} pr-10 md:pr-12 pl-10`}
                                    value={formData.miejsce}
                                    onChange={(e) => updateData('miejsce', e.target.value)}
                                    placeholder="Wpisz adres (podpowiedzi od Google Maps)"
                                />
                                <MapPin size={20} className="absolute right-3 top-4.5 text-slate-400 cursor-pointer hover:text-red-600" onClick={() => setIsModalOpen(true)} title="Otwórz pełną mapę" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-start items-center text-sm pt-2">
                        <p className="text-slate-500">
                            Aktualne wsp.: <span className="font-medium text-slate-700 ml-1">{formData.lat ? `${formData.lat.toFixed(4)}, ${formData.lng.toFixed(4)}` : 'Brak danych'}</span>
                        </p>
                    </div>

                    {/* PODGLĄD MAPY */}
                    <div className="space-y-2 pt-4">
                        <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><MapPin size={16} /> Podgląd Lokalizacji</h4>
                        <div id="map-preview" className="h-72 w-full bg-slate-100 rounded-xl border border-slate-300 shadow-inner cursor-pointer" onClick={() => setIsModalOpen(true)}>
                            <div className="flex items-center justify-center h-full text-slate-500 text-center text-sm">Kliknij, aby powiększyć i wyznaczyć punkt.</div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 px-6 py-6 border-t border-slate-200 flex flex-col-reverse md:flex-row justify-between gap-4">
                    <button onClick={() => navigate('/')} className="w-full md:w-auto px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center gap-2 transition-all">
                        <ArrowLeft size={20} aria-hidden="true" /> Anuluj
                    </button>
                    {/* TUTAJ ZMIANA: handleNextStep zamiast navigate */}
                    <button onClick={handleNextStep} className="w-full md:w-auto bg-blue-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center gap-2 shadow-lg transition-all">
                        Podsumowanie <ArrowRight size={20} aria-hidden="true" />
                    </button>
                </div>
            </div>

            <MapModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} currentCoords={currentCoords} onSaveLocation={handleSaveLocation} />
        </div>
    );
};

export default FormPage;