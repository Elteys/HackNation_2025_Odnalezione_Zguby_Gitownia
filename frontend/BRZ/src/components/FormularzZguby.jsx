import React, { useState } from 'react';
import { analyzeImage } from '../services/aiService';

const FormularzZguby = () => {
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);

    const [formData, setFormData] = useState({
        kategoria: '',
        nazwa: '',
        opis: '',
        kolor: ''
    });

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setPreview(URL.createObjectURL(file));
        setLoading(true);

        try {
            const base64 = await fileToBase64(file);

            const xmlResult = await analyzeImage(base64);
            console.log("Otrzymany XML:", xmlResult); 

            parseXMLToForm(xmlResult);

        } catch (error) {
            alert("Błąd analizy zdjęcia!");
        } finally {
            setLoading(false);
        }
    };

    const parseXMLToForm = (xmlString) => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");

        const getText = (tag) => {
            const el = xmlDoc.getElementsByTagName(tag)[0];
            return el ? el.textContent : "";
        };

        setFormData({
            kategoria: getText("Kategoria"),
            nazwa: getText("Nazwa"),
            opis: getText("Opis"),
            kolor: getText("Kolor") 
        });
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <h1>Dodaj Zgubę (AI Mode)</h1>

            <div style={{ border: '2px dashed #ccc', padding: '20px', textAlign: 'center' }}>
                <input type="file" accept="image/*" onChange={handleImageUpload} />
                {preview && <img src={preview} alt="Podgląd" style={{ maxWidth: '200px', marginTop: '10px' }} />}
            </div>

            {loading && <p>🤖 AI analizuje zdjęcie... Proszę czekać...</p>}

            <div style={{ marginTop: '20px' }}>
                <label>Kategoria:</label>
                <select
                    value={formData.kategoria}
                    onChange={(e) => setFormData({ ...formData, kategoria: e.target.value })}
                    style={{ display: 'block', width: '100%', padding: '8px', marginBottom: '10px' }}
                >
                    <option value="">Wybierz...</option>
                    <option value="ELEKTRONIKA">Elektronika</option>
                    <option value="DOKUMENTY">Dokumenty</option>
                    <option value="ODZIEZ">Odzież</option>
                    <option value="INNE">Inne</option>
                </select>

                <label>Nazwa:</label>
                <input
                    type="text"
                    value={formData.nazwa}
                    onChange={(e) => setFormData({ ...formData, nazwa: e.target.value })}
                    style={{ display: 'block', width: '100%', padding: '8px', marginBottom: '10px' }}
                />

                <label>Kolor (Cechy):</label>
                <input
                    type="text"
                    value={formData.kolor}
                    onChange={(e) => setFormData({ ...formData, kolor: e.target.value })}
                    style={{ display: 'block', width: '100%', padding: '8px', marginBottom: '10px' }}
                />

                <label>Opis szczegółowy:</label>
                <textarea
                    rows="4"
                    value={formData.opis}
                    onChange={(e) => setFormData({ ...formData, opis: e.target.value })}
                    style={{ display: 'block', width: '100%', padding: '8px', marginBottom: '10px' }}
                />

                <button style={{ background: 'blue', color: 'white', padding: '10px 20px', border: 'none' }}>
                    Zapisz i Generuj QR
                </button>
            </div>
        </div>
    );
};

export default FormularzZguby;