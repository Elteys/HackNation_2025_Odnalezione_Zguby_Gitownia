require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const port = process.env.PORT || 3001;

// --- KONFIGURACJA ---
const PORTAL_API_URL = process.env.PORTAL_API_URL || 'http://localhost:8000/api/3/action/resource_create';
const API_KEY = process.env.PORTAL_API_KEY; 
const DATASET_ID = process.env.DATASET_ID; 
const MY_PUBLIC_HOST = process.env.PUBLIC_HOST || `http://localhost:${port}`;

// --- ZMIANA: NAZWA URZĘDU NA SZTYWNO ---
const OFFICE_NAME = "STAROTSTWO_POWIATOWE_1"; 
const MASTER_CSV_FILENAME = `${OFFICE_NAME}.csv`;

const PUBLIC_DIR = path.join(__dirname, 'public_files');
if (!fsSync.existsSync(PUBLIC_DIR)) fsSync.mkdirSync(PUBLIC_DIR);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/files', express.static(PUBLIC_DIR));

// --- GENERATORY ---

const escapeCSV = (t) => {
    if (t === null || t === undefined) return '';
    let val = t.toString();
    // Zabezpieczenie przed CSV Injection
    if (['=', '+', '-', '@'].includes(val.charAt(0))) val = "'" + val; 
    // Standard RFC 4180 (cudzysłowy jeśli są spacje, przecinki, entery)
    if (val.search(/("|,|\n)/g) >= 0) val = `"${val.replace(/"/g, '""')}"`;
    return val;
};

// Zwraca sam wiersz danych (bez nagłówka)
function getCSVRow(formData, id) { 
    const lat = formData.lat || '';
    const lon = formData.lng || '';

    return [
        id,
        escapeCSV(formData.kategoria), 
        escapeCSV(formData.podkategoria),
        escapeCSV(formData.nazwa), 
        escapeCSV(formData.opis), 
        escapeCSV(formData.cechy?.kolor),
        escapeCSV(formData.cechy?.marka), 
        escapeCSV(formData.cechy?.stan),
        escapeCSV(formData.data), 
        escapeCSV(formData.miejsce),
        escapeCSV(lat),
        escapeCSV(lon)
    ].join(",") + "\n";
}

function getCSVHeader() {
    return "ID,Kategoria,Podkategoria,Nazwa,Opis,Kolor,Marka,Stan,DataZnalezienia,Miejsce,Lat,Lon\n";
}

function generateXML(formData, id) {
    const builder = new xml2js.Builder({ headless: true });
    
    const lat = formData.lat ? formData.lat.toString() : null;
    const lon = formData.lng ? formData.lng.toString() : null;

    const xmlObj = {
        'ZgloszenieZguby': {
            '$': { 'xmlns': 'http://dane.gov.pl/standardy/zguby/v1', 'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance' },
            'Naglowek': { 
                'IdentyfikatorUnikalny': id,
                'DataUtworzeniaRekordu': new Date().toISOString(),
                'JednostkaSamorzadu': { 
                    'Nazwa': OFFICE_NAME.replace(/_/g, ' '), // W XML ładnie ze spacjami: "Starostwo Powiatowe Gryfino"
                    'KodTERYT': '0000000' 
                }
            },
            'Przedmiot': {
                'KategoriaGlowna': formData.kategoria,
                'Podkategoria': formData.podkategoria || '',
                'NazwaPubliczna': formData.nazwa,
                'OpisSzczegolowy': formData.opis || '',
                'Cechy': {
                    'Kolor': formData.cechy?.kolor || '',
                    'Marka': formData.cechy?.marka || '',
                    'Stan': formData.cechy?.stan || ''
                }
            },
            'KontekstZnalezienia': {
                'DataZnalezienia': formData.data,
                'MiejsceOpis': formData.miejsce || '',
                ...(lat && lon && {
                    'LokalizacjaGeo': {
                        'Lat': lat,
                        'Lon': lon
                    }
                })
            },
            'ZrodloDanych': {
                'Format': 'CSV',
                // Link prowadzi do pliku Starostwa
                'UrlDoDanych': `${MY_PUBLIC_HOST}/files/${MASTER_CSV_FILENAME}` 
            }
        }
    };
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + builder.buildObject(xmlObj);
}

// --- ENDPOINT ---
app.post('/api/publish-data', async (req, res) => {
    try {
        const formData = req.body;
        if (!formData) throw new Error("Brak danych");

        const uniqueId = uuidv4();
        const xmlName = `meta_${uniqueId}.xml`;
        const qrName = `qr_${uniqueId}.png`;

        // Używamy nazwy ze zmiennej OFFICE_NAME
        const csvPath = path.join(PUBLIC_DIR, MASTER_CSV_FILENAME); 
        const xmlPath = path.join(PUBLIC_DIR, xmlName);
        const qrPath = path.join(PUBLIC_DIR, qrName);

        // --- LOGIKA REJESTRU (Dopisywanie) ---
        let fileExists = false;
        try {
            await fs.access(csvPath);
            fileExists = true;
        } catch {
            fileExists = false;
        }

        const rowContent = getCSVRow(formData, uniqueId);

        if (fileExists) {
            await fs.appendFile(csvPath, rowContent, 'utf8');
        } else {
            const header = getCSVHeader();
            await fs.writeFile(csvPath, header + rowContent, 'utf8');
        }

        // --- XML ---
        const xmlContent = generateXML(formData, uniqueId);
        await fs.writeFile(xmlPath, xmlContent, 'utf8');

        // --- QR ---
        const finalUrl = `${MY_PUBLIC_HOST}/files/${xmlName}`;
        await QRCode.toFile(qrPath, finalUrl);

        res.status(200).json({
            success: true,
            files: {
                xml: finalUrl,
                csv: `${MY_PUBLIC_HOST}/files/${MASTER_CSV_FILENAME}`,
                qr: `${MY_PUBLIC_HOST}/files/${qrName}`,
                portalUrl: null 
            }
        });

    } catch (error) {
        console.error("Błąd:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server działa.`);
    console.log(`Rejestr zapisywany do: ${MASTER_CSV_FILENAME}`);
});
