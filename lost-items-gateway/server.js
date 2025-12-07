require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises; 
const fsSync = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { parse } = require('csv-parse/sync'); // Nowa biblioteka do czytania
const { stringify } = require('csv-stringify/sync'); // Nowa biblioteka do zapisu

const app = express();
const port = process.env.PORT || 3001;

// --- KONFIGURACJA ---
const MY_PUBLIC_HOST = process.env.PUBLIC_HOST || `http://localhost:${port}`;
// Zmieniamy na link, który podałeś w pytaniu (z hashem #)
const FRONTEND_URL = 'http://localhost:3000/#/szczegoly'; 

const OFFICE_NAME = "Starostwo_Powiatowe_Gryfino"; 
const MASTER_CSV_FILENAME = `${OFFICE_NAME}.csv`;

const BASE_OUTPUT_DIR = path.join(__dirname, 'output');
const CSV_DIR = path.join(BASE_OUTPUT_DIR, 'csv');
const QR_DIR = path.join(BASE_OUTPUT_DIR, 'qr');

if (!fsSync.existsSync(CSV_DIR)) fsSync.mkdirSync(CSV_DIR, { recursive: true });
if (!fsSync.existsSync(QR_DIR)) fsSync.mkdirSync(QR_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/files', express.static(BASE_OUTPUT_DIR));

// Ścieżka do głównego pliku
const CSV_FILE_PATH = path.join(CSV_DIR, MASTER_CSV_FILENAME);

// --- HELPERY DO CSV ---

// Czytanie wszystkich rekordów jako tablica obiektów
async function readRecords() {
    try {
        await fs.access(CSV_FILE_PATH); // Sprawdź czy plik istnieje
        const content = await fs.readFile(CSV_FILE_PATH, 'utf8');
        return parse(content, {
            columns: true, // Pierwszy wiersz to nagłówki
            skip_empty_lines: true,
            trim: true
        });
    } catch (e) {
        return []; // Jeśli plik nie istnieje, zwróć pustą tablicę
    }
}

// Zapisywanie rekordów z powrotem do pliku
async function writeRecords(records) {
    // Definiujemy kolejność kolumn (żeby była zgodna ze standardem)
    const columns = [
        "ID", "Kategoria", "Podkategoria", "Nazwa", "Opis", 
        "Kolor", "Marka", "Stan", "DataZnalezienia", 
        "Miejsce", "Lat", "Lon", "CzyOdebrany"
    ];

    const output = stringify(records, {
        header: true,
        columns: columns,
        quoted: true // Bezpieczeństwo: zawsze w cudzysłowach
    });

    await fs.writeFile(CSV_FILE_PATH, output, 'utf8');
}


// --- ENDPOINTY ---

// 1. OPUBLIKUJ (DODAJ NOWY)
app.post('/api/publish-data', async (req, res) => {
    try {
        const formData = req.body;
        if (!formData) throw new Error("Brak danych");

        const uniqueId = uuidv4();
        const qrName = `qr_${uniqueId}.png`;
        const qrPath = path.join(QR_DIR, qrName);

        // 1. Wczytaj istniejące
        const records = await readRecords();

        // 2. Dodaj nowy rekord
        const newRecord = {
            ID: uniqueId,
            Kategoria: formData.kategoria,
            Podkategoria: formData.podkategoria,
            Nazwa: formData.nazwa,
            Opis: formData.opis,
            Kolor: formData.cechy?.kolor,
            Marka: formData.cechy?.marka,
            Stan: formData.cechy?.stan,
            DataZnalezienia: formData.data,
            Miejsce: formData.miejsce,
            Lat: formData.lat || '',
            Lon: formData.lng || '',
            CzyOdebrany: 'false' // Domyślnie false
        };

        records.push(newRecord);

        // 3. Zapisz całość
        await writeRecords(records);

        // 4. Generuj QR (Linkuje do: http://localhost:3000/#/szczegoly/UUID)
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
        console.error("Błąd zapisu:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. POBIERZ POJEDYNCZY REKORD (Dla DetailsPage.jsx)
app.get('/api/item/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const records = await readRecords();
        
        const item = records.find(r => r.ID === id);

        if (!item) {
            return res.status(404).json({ error: "Nie znaleziono przedmiotu" });
        }

        // Mapowanie CSV (wielkie litery) na JSON Frontendu (małe litery, struktura cech)
        // Frontend oczekuje konkretnej struktury w DetailsPage.jsx
        const responseData = {
            id: item.ID,
            nazwa: item.Nazwa,
            kategoria: item.Kategoria,
            opis: item.Opis,
            data: item.DataZnalezienia,
            miejsce: item.Miejsce,
            cechy: {
                kolor: item.Kolor,
                marka: item.Marka,
                stan: item.Stan
            },
            // Zwracamy boolean (true/false) zamiast stringa 'true'/'false'
            CzyOdebrany: item.CzyOdebrany === 'true'
        };

        res.json(responseData);

    } catch (error) {
        console.error("Błąd odczytu:", error);
        res.status(500).json({ error: "Błąd serwera podczas szukania w CSV" });
    }
});

// 3. ZAKTUALIZUJ STATUS (Dla przycisku "ODBIERZ")
app.post('/api/item/:id/return', async (req, res) => {
    try {
        const { id } = req.params;
        const records = await readRecords();

        const index = records.findIndex(r => r.ID === id);
        
        if (index === -1) {
            return res.status(404).json({ error: "Nie znaleziono przedmiotu do aktualizacji" });
        }

        // Aktualizacja statusu
        records[index].CzyOdebrany = 'true';

        // Nadpisanie pliku CSV
        await writeRecords(records);

        res.json({ success: true, message: "Status zaktualizowany na ODEBRANY" });

    } catch (error) {
        console.error("Błąd aktualizacji:", error);
        res.status(500).json({ error: "Nie udało się zaktualizować CSV" });
    }
});

app.listen(port, () => {
    console.log(`Serwer działa na porcie ${port}`);
    console.log(`Baza danych (CSV): ${CSV_FILE_PATH}`);
});