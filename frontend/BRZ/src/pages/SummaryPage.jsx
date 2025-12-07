// CAŁY KOD SummaryPage.jsx (Zaktualizowany o szerokości)
import React, { useState, useEffect } from 'react';
import { useFormContext } from '../context/FormContext';
import { useNavigate } from 'react-router-dom';
import { Upload, Edit3, CheckCircle, FileText } from 'lucide-react';

const SummaryPage = () => {
    const { formData } = useFormContext();
    const navigate = useNavigate();
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishResult, setPublishResult] = useState(null);

    useEffect(() => {
        if (!formData.nazwa || !formData.kategoria) {
            navigate('/');
        }
    }, [formData, navigate]);

    const handlePublish = async () => {
        setIsPublishing(true);
        try {
            const response = await fetch('http://localhost:3001/api/publish-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (data.success) {
                setPublishResult(data.files);
            } else {
                alert('Błąd publikacji: ' + data.error);
            }
        } catch (error) {
            console.error('Błąd połączenia:', error);
            alert('Nie udało się połączyć z serwerem.');
        } finally {
            setIsPublishing(false);
        }
    };

    if (publishResult) {
        return (
            // ZMIANA: max-w-6xl dla wyrównania z Navbarem
            <div className="max-w-6xl mx-auto px-4 py-8 animate-in zoom-in-95 duration-500">
                {/* Wewnętrzny kontener centrujący treść, żeby nie była za szeroka */}
                <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-green-200 p-8 text-center">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Sukces!</h2>
                    <p className="text-slate-600 mb-8">
                        Dane zostały sformatowane i udostępnione dla portalu dane.gov.pl.
                    </p>

                    <div className="bg-slate-50 rounded-xl p-6 mb-8 text-left space-y-4 border border-slate-200">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                            <div className="flex items-center gap-3">
                                <FileText className="text-green-600" />
                                <div>
                                    <p className="font-bold text-sm">Plik Danych (CSV)</p>
                                    <p className="text-xs text-slate-500">Surowe dane o zgubie</p>
                                </div>
                            </div>
                            <a href={publishResult.csv} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm font-bold">Pobierz</a>
                        </div>
                    </div>

                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-white border-2 border-slate-200 rounded-xl">
                            <p className="text-xs text-slate-400 mb-2 uppercase font-bold tracking-wider">Kod QR Zgłoszenia</p>
                            <img src={publishResult.qr} alt="QR Code" className="w-32 h-32" />
                        </div>
                    </div>

                    <button onClick={() => window.location.reload()} className="px-6 py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors">
                        Rozpocznij nowe zgłoszenie
                    </button>
                </div>
            </div>
        );
    }

    return (
        // ZMIANA: max-w-6xl
        <div className="max-w-6xl mx-auto px-4 py-8 animate-in zoom-in-95 duration-500">
            <div className="text-center mb-10">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-blue-50">
                    <CheckCircle size={32} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900">Weryfikacja danych</h2>
                <p className="text-slate-500 mt-2">Upewnij się, że wszystko się zgadza przed wystawieniem danych.</p>
            </div>

            {/* Wewnętrzny kontener dla czytelności */}
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="p-8">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Podgląd rekordu</h3>
                    <dl className="grid grid-cols-1 gap-y-6 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-slate-500">Kategoria</dt>
                            <dd className="mt-1 text-lg font-semibold text-slate-900">{formData.kategoria || '—'}</dd>
                        </div>
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-slate-500">Nazwa</dt>
                            <dd className="mt-1 text-lg font-semibold text-slate-900">{formData.nazwa || '—'}</dd>
                        </div>
                        <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-slate-500">Opis</dt>
                            <dd className="mt-1 text-sm text-slate-700 bg-slate-50 p-4 rounded-lg italic border border-slate-100">"{formData.opis}"</dd>
                        </div>
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-slate-500">Data znalezienia</dt>
                            <dd className="mt-1 text-base text-slate-900">{formData.data}</dd>
                        </div>
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-slate-500">Lokalizacja</dt>
                            <dd className="mt-1 text-base text-slate-900">{formData.miejsce || 'Nie podano'}</dd>
                        </div>
                    </dl>
                </div>

                <div className="bg-slate-50 px-8 py-5 border-t border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
                    <button onClick={() => navigate('/formularz')} className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-white transition-colors flex justify-center items-center gap-2" disabled={isPublishing}>
                        <Edit3 size={18} /> Edytuj
                    </button>
                    <button onClick={handlePublish} disabled={isPublishing} className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 flex justify-center items-center gap-2 disabled:opacity-50">
                        {isPublishing ? 'Generowanie...' : <><Upload size={18} /> OPUBLIKUJ DANE</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SummaryPage;