require('dotenv').config(); // Ładuje zmienne z pliku .env
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const port = process.env.PORT || 3001; // Port z chmury lub domyślny

// --- KONFIGURACJA Z PLIKU .ENV ---
// To pozwala zmieniać adresy bez dotykania kodu!

// Adres API portalu rządowego (lokalny lub produkcyjny)
const PORTAL_API_URL = process.env.PORTAL_API_URL || 'http://localhost:8000/api/3/action/resource_create';
const API_KEY = process.env.PORTAL_API_KEY; 
const DATASET_ID = process.env.DATASET_ID; 

// Publiczny adres Twojego serwera (żeby portal rządowy mógł pobrać plik)
// Na produkcji to będzie np. https://twoja-aplikacja.pl
const MY_PUBLIC_HOST = process.env.PUBLIC_HOST || `http://localhost:${port}`;

const PUBLIC_DIR = path.join(__dirname, 'public_files');
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/files', express.static(PUBLIC_DIR));

// --- GENERATORY (Logika bez zmian) ---

function generateCSV(formData) {
    const header = "ID,Kategoria,Podkategoria,Nazwa,Opis,Kolor,Marka,Stan,DataZnalezienia,Miejsce\n";
    const escape = (t) => `"${(t || '').replace(/"/g, '""')}"`;
    const row = [
        uuidv4(), escape(formData.kategoria), escape(formData.podkategoria),
        escape(formData.nazwa), escape(formData.opis), escape(formData.cechy?.kolor),
        escape(formData.cechy?.marka), escape(formData.cechy?.stan),
        escape(formData.data), escape(formData.miejsce)
    ].join(",");
    return header + row;
}

function generateXML(csvFileName, formData) {
    const builder = new xml2js.Builder();
    const xmlObj = {
        'ZgloszenieZguby': {
            '$': { 'xmlns': 'http://dane.gov.pl/standardy/rzeczy-znalezione' },
            'Naglowek': { 
                'Identyfikator': uuidv4(), 
                'CzasWytworzenia': new Date().toISOString() 
            },
            'ZasobDanych': {
                'Format': 'CSV',
                // Kluczowe: ten link musi być dostępny z internetu!
                'UrlDoDanych': `${MY_PUBLIC_HOST}/files/${csvFileName}` 
            },
            'Opis': { 
                'Tytul': `Zguba: ${formData.nazwa}`,
                'Kategoria': formData.kategoria 
            }
        }
    };
    return builder.buildObject(xmlObj);
}

// --- WYSYŁKA DO PORTALU ---
async function pushToPortal(filePath, fileName, title) {
    if (!API_KEY) {
        console.warn('[API] Brak klucza API w .env - pomijam wysyłkę.');
        return null;
    }

    console.log(`[API] Wysyłka do: ${PORTAL_API_URL}`);
    
    const form = new FormData();
    form.append('package_id', DATASET_ID);
    form.append('name', fileName);
    form.append('description', `Import: ${title}`);
    form.append('format', 'XML');
    form.append('upload', fs.createReadStream(filePath));

    try {
        const response = await axios.post(PORTAL_API_URL, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': API_KEY
            }
        });
        
        if (response.data.success) {
            console.log('[API] Sukces!');
            return response.data.result.url; 
        }
    } catch (error) {
        console.error('[API BŁĄD]', error.response?.data || error.message);
        return null; 
    }
}

// --- ENDPOINT ---
app.post('/api/publish-data', async (req, res) => {
    try {
        const formData = req.body;
        const uniqueId = uuidv4();

        // 1. Pliki
        const csvName = `dane_${uniqueId}.csv`;
        const xmlName = `meta_${uniqueId}.xml`;
        const qrName = `qr_${uniqueId}.png`;

        const csvPath = path.join(PUBLIC_DIR, csvName);
        const xmlPath = path.join(PUBLIC_DIR, xmlName);
        const qrPath = path.join(PUBLIC_DIR, qrName);

        fs.writeFileSync(csvPath, generateCSV(formData));
        fs.writeFileSync(xmlPath, generateXML(csvName, formData));

        // 2. Wysyłka (zależna od konfiguracji w .env)
        const portalUrl = await pushToPortal(xmlPath, xmlName, formData.nazwa);

        // 3. QR
        const finalUrl = portalUrl || `${MY_PUBLIC_HOST}/files/${xmlName}`;
        await QRCode.toFile(qrPath, finalUrl);

        res.status(200).json({
            success: true,
            files: {
                xml: `${MY_PUBLIC_HOST}/files/${xmlName}`,
                csv: `${MY_PUBLIC_HOST}/files/${csvName}`,
                qr: `${MY_PUBLIC_HOST}/files/${qrName}`,
                portalUrl: portalUrl
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Bramka działa na porcie ${port}`);
    console.log(`Tryb: ${process.env.NODE_ENV || 'development'}`);
});