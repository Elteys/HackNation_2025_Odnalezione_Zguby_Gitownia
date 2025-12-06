require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises; // Asynchroniczny system plików
const fsSync = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3001;

// --- KONFIGURACJA ---
const MY_PUBLIC_HOST = process.env.PUBLIC_HOST || `http://localhost:${port}`;
const FRONTEND_URL = 'http://localhost:3000/item'; // Adres, gdzie user zobaczy szczegóły po zeskanowaniu

// Nazwa pliku rejestru
const OFFICE_NAME = "Starostwo_Powiatowe_Gryfino"; 
const MASTER_CSV_FILENAME = `${OFFICE_NAME}.csv`;

const PUBLIC_DIR = path.join(__dirname, 'public_files');
if (!fsSync.existsSync(PUBLIC_DIR)) fsSync.mkdirSync(PUBLIC_DIR);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/files', express.static(PUBLIC_DIR));

// --- GENERATORY CSV ---

// Funkcja czyszcząca tekst (zabezpiecza przecinki i entery)
const escapeCSV = (t) => {
    if (t === null || t === undefined) return '';
    let val = t.toString();
    // Jeśli zawiera przecinek, cudzysłów lub nową linię -> owijamy w cudzysłów
    if (val.search(/("|,|\n)/g) >= 0) val = `"${val.replace(/"/g, '""')}"`;
    return val;
};

// Generuje sam nagłówek
function getCSVHeader() {
    return "ID,Kategoria,Podkategoria,Nazwa,Opis,Kolor,Marka,Stan,DataZnalezienia,Miejsce,Lat,Lon\n";
}

// Generuje jeden wiersz danych
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
    ].join(",") + "\n"; // Ważne: Nowa linia na końcu
}

// --- ENDPOINT ---
app.post('/api/publish-data', async (req, res) => {
    try {
        const formData = req.body;
        if (!formData) throw new Error("Brak danych");

        const uniqueId = uuidv4();
        const qrName = `qr_${uniqueId}.png`;

        const csvPath = path.join(PUBLIC_DIR, MASTER_CSV_FILENAME);
        const qrPath = path.join(PUBLIC_DIR, qrName);

        // 1. Sprawdzamy czy plik CSV już istnieje
        let fileExists = false;
        try {
            await fs.access(csvPath);
            fileExists = true;
        } catch {
            fileExists = false;
        }

        // 2. Przygotowujemy wiersz danych
        const rowContent = getCSVRow(formData, uniqueId);

        // 3. Zapis (Append lub Create)
        if (fileExists) {
            // Plik jest -> Dopisujemy na końcu
            await fs.appendFile(csvPath, rowContent, 'utf8');
        } else {
            // Pliku nie ma -> Tworzymy Nagłówek + Pierwszy wiersz
            const header = getCSVHeader();
            await fs.writeFile(csvPath, header + rowContent, 'utf8');
        }

        // 4. Generujemy QR (Link do frontendu z ID zguby)
        // Dzięki temu po zeskanowaniu otworzy się strona Reacta z ID w URL
        const linkToItem = `${FRONTEND_URL}/${uniqueId}`;
        await QRCode.toFile(qrPath, linkToItem);

        // 5. Sukces
        res.status(200).json({
            success: true,
            files: {
                csv: `${MY_PUBLIC_HOST}/files/${MASTER_CSV_FILENAME}`,
                qr: `${MY_PUBLIC_HOST}/files/${qrName}`,
                itemLink: linkToItem
            }
        });

    } catch (error) {
        console.error("Błąd:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Serwer działa.`);
    console.log(`Rejestr (CSV): ${MASTER_CSV_FILENAME}`);
});
