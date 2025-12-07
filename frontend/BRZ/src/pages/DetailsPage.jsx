// src/pages/DetailsPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Package, Calendar, MapPin, UserCheck, AlertCircle } from 'lucide-react';

const DetailsPage = () => {
    const { id } = useParams(); // Pobieramy ID z URL (np. UUID-1234)
    const navigate = useNavigate();

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isReturned, setIsReturned] = useState(false); // Lokalny stan: Czy odebrano?

    // 1. POBIERANIE DANYCH
    useEffect(() => {
        const fetchItemDetails = async () => {
            try {
                // WAŻNE DLA BACKENDU:
                // Twoi koledzy muszą skonfigurować ten endpoint w Node.js tak,
                // aby czytał pliki CSV ze ścieżki: /lost-items-gateaway/output/csv/
                // Frontend strzela tylko do API, nie wie nic o ścieżkach na serwerze.
                const response = await fetch(`http://localhost:3001/api/item/${id}`);

                if (!response.ok) throw new Error("Nie znaleziono przedmiotu w rejestrze.");

                const data = await response.json();

                setItem(data);
                // Zakładamy, że w CSV kolumna nazywa się 'CzyOdebrany' i ma wartości 'true'/'false' (stringi)
                setIsReturned(data.CzyOdebrany === 'true' || data.CzyOdebrany === true);

            } catch (err) {
                console.error(err);
                // setError("Nie udało się załadować danych przedmiotu.");

                // --- MOCK DLA DEMO (Gdy backend nie działa) ---
                // Dzięki temu możesz pokazać stronę sędziom bez działającego API.
                console.warn("Używam danych testowych (MOCK)!");
                setItem({
                    id: id,
                    nazwa: "Przykładowy Smartfon (Mock)",
                    kategoria: "ELEKTRONIKA",
                    opis: "Znaleziono na ławce, lekko pęknięta szybka. (To są dane testowe, bo nie połączono z backendem).",
                    data: "2025-05-12",
                    miejsce: "Park Miejski",
                    cechy: { kolor: "czarny", marka: "Samsung" },
                    CzyOdebrany: 'false'
                });
                setIsReturned(false);
                // -------------------------------------------
            } finally {
                setLoading(false);
            }
        };

        fetchItemDetails();
    }, [id]);

    // 2. OBSŁUGA PRZYCISKU "ODBIERZ"
    const handleMarkAsReturned = async () => {
        if (!confirm("Czy na pewno chcesz oznaczyć ten przedmiot jako WYDANY właścicielowi? Ta operacja jest nieodwracalna w tym panelu.")) return;

        try {
            // Strzał do backendu kolegów, żeby nadpisali CSV w ścieżce /lost-items-gateaway/output/csv/
            const response = await fetch(`http://localhost:3001/api/item/${id}/return`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                setIsReturned(true); // Aktualizujemy UI
                alert("Sukces! Status w pliku CSV został zaktualizowany na 'Wydano'.");
            } else {
                // Jeśli backend nie działa, rzucamy błąd, żeby wejść w catch (dla demo)
                throw new Error("Backend nie odpowiedział poprawnie");
            }
        } catch (e) {
            console.log("Tryb DEMO: Symulacja odbioru przedmiotu bez backendu.");
            setIsReturned(true);
            alert("(DEMO) Status zmieniono wizualnie. W pełnej wersji zaktualizowałby się plik CSV.");
        }
    };

    // --- RENDEROWANIE STANU ŁADOWANIA/BŁĘDU ---
    if (loading) return <div className="p-20 text-center text-slate-500 animate-pulse flex flex-col items-center"><Package className="animate-bounce mb-4" size={40} />Ładowanie danych z rejestru...</div>;
    if (!item && !loading) return <div className="p-20 text-center text-red-500 font-bold">Błąd: {error}</div>;

    // --- GŁÓWNY WIDOK ---
    return (
        <div className="max-w-3xl mx-auto px-4 py-8 animate-in fade-in duration-500">

            {/* Nawigacja powrotna */}
            <button
                onClick={() => navigate('/')}
                className="mb-6 flex items-center text-slate-500 hover:text-blue-900 transition-colors focus-gov px-2 py-1 rounded-lg font-medium"
            >
                <ArrowLeft size={20} className="mr-2" /> Wróć do wyszukiwarki
            </button>

            {/* KARTA GŁÓWNA */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative">

                {/* --- STATUS BAR (ZMIENIONY KOLOR) --- */}
                <div className={`w-full py-4 px-8 flex items-center justify-between font-bold tracking-wider uppercase text-sm transition-colors duration-300 
            ${isReturned
                        ? 'bg-slate-500 text-white'  // Stan: Wydano (Szary tło, biały tekst)
                        : 'bg-white text-green-700 border-b-2 border-green-100' // Stan: W magazynie (Białe tło, zielony tekst)
                    }`}>
                    <span className="flex items-center gap-2">
                        <Package size={18} /> STATUS MAGAZYNOWY:
                    </span>
                    <span className="flex items-center gap-2 bg-opacity-20 rounded-full px-3 py-1">
                        {isReturned ? (
                            <><CheckCircle size={18} /> WYDANO WŁAŚCICIELOWI</>
                        ) : (
                            <><span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span> W MAGAZYNIE (DOSTĘPNY)</>
                        )}
                    </span>
                </div>

                <div className="p-8 md:p-10">
                    {/* NAGŁÓWEK */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8 border-b border-slate-100 pb-8">
                        <div>
                            <span className="bg-blue-50 text-blue-700 border border-blue-100 text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider mb-3 inline-block">
                                {item.kategoria}
                            </span>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-1 mb-2 leading-tight">
                                {item.nazwa}
                            </h1>
                            <p className="text-slate-400 font-mono text-xs bg-slate-50 inline-block px-2 py-1 rounded">ID: {id}</p>
                        </div>
                        {/* Ikonka kategorii (dekoracyjna) */}
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${isReturned ? 'bg-slate-100 text-slate-300' : 'bg-blue-50 text-blue-300'}`}>
                            <Package size={40} />
                        </div>
                    </div>

                    {/* GRID SZCZEGÓŁÓW */}
                    <div className="grid md:grid-cols-2 gap-8 mb-10">
                        <div className="space-y-6 py-4">
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Calendar size={16} className="text-slate-300" /> Data znalezienia
                                </h3>
                                <p className="text-xl font-bold text-slate-800">{item.data}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <MapPin size={16} className="text-slate-300" /> Lokalizacja
                                </h3>
                                <p className="text-lg font-medium text-slate-800 leading-snug">{item.miejsce}</p>
                            </div>
                        </div>

                        <div className={`p-6 rounded-2xl border transition-colors ${isReturned ? 'bg-slate-50 border-slate-100' : 'bg-blue-50/50 border-blue-100'}`}>
                            <h3 className="text-sm font-bold text-blue-900/60 uppercase tracking-wider mb-3">
                                Opis Przedmiotu
                            </h3>
                            <p className="text-slate-700 italic leading-relaxed text-lg">
                                "{item.opis}"
                            </p>
                            {/* Cechy */}
                            <div className="mt-6 flex flex-wrap gap-2">
                                {item.cechy?.kolor && <span className="px-3 py-1.5 bg-white border-2 border-slate-100 text-xs rounded-lg text-slate-600 uppercase font-bold">Kolor: <b className="text-slate-900">{item.cechy.kolor}</b></span>}
                                {item.cechy?.marka && <span className="px-3 py-1.5 bg-white border-2 border-slate-100 text-xs rounded-lg text-slate-600 uppercase font-bold">Marka: <b className="text-slate-900">{item.cechy.marka}</b></span>}
                            </div>
                        </div>
                    </div>

                    {/* --- SEKCJA ACTION: PRZYCISK ODBIORU --- */}
                    <div className="mt-8 pt-8 border-t-2 border-dashed border-slate-200">
                        {isReturned ? (
                            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-8 text-center">
                                <div className="w-20 h-20 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <UserCheck size={40} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-700 mb-2">Proces zakończony</h3>
                                <p className="text-slate-500 max-w-md mx-auto">
                                    Ten przedmiot został wydany właścicielowi i jego status w rejestrze CSV został zaktualizowany.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center bg-green-50/50 p-8 rounded-2xl border-2 border-green-100">
                                <h3 className="text-xl font-bold text-green-800 mb-2">
                                    Weryfikacja Właściciela
                                </h3>
                                <p className="text-green-700/70 mb-6 text-sm text-center max-w-md">
                                    Kliknij przycisk poniżej <b>tylko</b> po pomyślnej weryfikacji tożsamości i fizycznym wydaniu przedmiotu z magazynu.
                                </p>

                                <button
                                    onClick={handleMarkAsReturned}
                                    className="group relative w-full md:w-auto bg-green-600 hover:bg-green-700 text-white text-lg font-bold py-4 px-12 rounded-2xl shadow-xl shadow-green-600/20 transition-all transform hover:scale-[1.02] active:scale-98 focus-gov flex items-center justify-center gap-4"
                                >
                                    <div className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition-colors">
                                        <CheckCircle size={28} strokeWidth={3} />
                                    </div>
                                    <span className="tracking-wide">POTWIERDŹ ODBIÓR</span>
                                </button>

                                <p className="mt-4 text-xs text-green-600/60 uppercase tracking-widest font-bold flex items-center gap-1.5">
                                    <AlertCircle size={14} />
                                    Akcja trwale zaktualizuje plik CSV
                                </p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default DetailsPage;