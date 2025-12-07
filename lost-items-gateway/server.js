require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises; 
const fsSync = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3001;

// --- KONFIGURACJA ---
const MY_PUBLIC_HOST = process.env.PUBLIC_HOST || `http://localhost:${port}`;
const FRONTEND_URL = 'http://localhost:3000/#/szczegoly'; 
const OFFICE_NAME = "starostwo_1"; 
const MASTER_CSV_FILENAME = `${OFFICE_NAME}.csv`;

const BASE_OUTPUT_DIR = path.join(__dirname, 'output');
const CSV_DIR = path.join(BASE_OUTPUT_DIR, 'csv');
const QR_DIR = path.join(BASE_OUTPUT_DIR, 'qr');

if (!fsSync.existsSync(CSV_DIR)) fsSync.mkdirSync(CSV_DIR, { recursive: true });
if (!fsSync.existsSync(QR_DIR)) fsSync.mkdirSync(QR_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/files', express.static(BASE_OUTPUT_DIR));

// --- GENERATORY CSV ---

const escapeCSV = (t) => {
    if (t === null || t === undefined) return '';
    let val = t.toString();
    if (val.search(/("|,|\n)/g) >= 0) val = `"${val.replace(/"/g, '""')}"`;
    return val;
};

// 1. ZMIANA: Dodano "CzyOdebrany" do nagłówka
function getCSVHeader() {
    return "ID,Kategoria,Podkategoria,Nazwa,Opis,Kolor,Marka,Stan,DataZnalezienia,Miejsce,Lat,Lon,CzyOdebrany\n";
}

// 2. ZMIANA: Dodano wartość 'false' na końcu wiersza
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
        escapeCSV(lon),
        escapeCSV('false') // <--- Tutaj dodajemy domyślną wartość "false"
    ].join(",") + "\n";
}

// --- ENDPOINT ---
app.post('/api/publish-data', async (req, res) => {
    try {
        const formData = req.body;
        if (!formData) throw new Error("Brak danych");

        const uniqueId = uuidv4();
        const qrName = `qr_${uniqueId}.png`;

        const csvPath = path.join(CSV_DIR, MASTER_CSV_FILENAME);
        const qrPath = path.join(QR_DIR, qrName);

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

        const linkToItem = `${FRONTEND_URL}/${uniqueId}`;
        await QRCode.toFile(qrPath, linkToItem);

        res.status(200).json({
            success: true,
            files: {
                csv: `${MY_PUBLIC_HOST}/files/csv/${MASTER_CSV_FILENAME}`,
                qr: `${MY_PUBLIC_HOST}/files/qr/${qrName}`,
                itemLink: linkToItem
            }
        });

    } catch (error) {
        console.error("Błąd:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Serwer działa na porcie ${port}`);
    console.log(`Rejestr (CSV): ${MASTER_CSV_FILENAME}`);
});