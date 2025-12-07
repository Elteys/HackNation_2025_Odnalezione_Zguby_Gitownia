require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises; 
const fsSync = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const https = require('https');
const xml2js = require('xml2js'); // Pamiętaj o: npm install xml2js

const app = express();
const port = process.env.PORT || 3001;

const MY_PUBLIC_HOST = process.env.PUBLIC_HOST || `https://localhost:${port}`;
const FRONTEND_URL = 'https://localhost:5173/#/szczegoly'; 

// ID Starosty ustawione na sztywno (zgodnie z prośbą)
const OFFICE_ID = "2"; 

const BASE_OUTPUT_DIR = path.join(__dirname, 'public_files');
const CSV_DIR = path.join(BASE_OUTPUT_DIR, 'csv');
const QR_DIR = path.join(BASE_OUTPUT_DIR, 'qr');
const XML_PATH = path.join(__dirname, 'zguby.xml');

if (!fsSync.existsSync(CSV_DIR)) fsSync.mkdirSync(CSV_DIR, { recursive: true });
if (!fsSync.existsSync(QR_DIR)) fsSync.mkdirSync(QR_DIR, { recursive: true });

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use('/files', express.static(BASE_OUTPUT_DIR));

async function getCsvFilePath() {
    try {
        // 1. Wczytaj XML
        const xmlContent = await fs.readFile(XML_PATH, 'utf8');
        
        // 2. Parsuj XML do JSON
        const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });
        const result = await parser.parseStringPromise(xmlContent);

        // 3. Znajdź listę datasetów
        // Uwaga: jeśli jest tylko 1 dataset, xml2js zwraca obiekt, jeśli więcej - tablicę.
        let datasets = result.datasets.dataset;
        if (!Array.isArray(datasets)) {
            datasets = [datasets];
        }

        // 4. Znajdź dataset dla naszego OFFICE_ID (intIdent == 1)
        const targetDataset = datasets.find(d => d.intIdent === OFFICE_ID);

        if (!targetDataset) {
            throw new Error(`Nie znaleziono w XML datasetu o ID: ${OFFICE_ID}`);
        }

        // 5. Wyciągnij nazwę pliku z URL
        // URL w XML: https://localhost:3001/api/csv/Starostwo_Powiatowe_Gryfino
        // Bierzemy to co po ostatnim slashu
        const urlParts = targetDataset.url.split('/');
        const fileNameBase = urlParts[urlParts.length - 1]; // "Starostwo_Powiatowe_Gryfino"
        
        const fileName = `${fileNameBase}.csv`;
        
        console.log(`[INFO] Wybrano plik CSV na podstawie XML (ID ${OFFICE_ID}): ${fileName}`);
        
        return path.join(CSV_DIR, fileName);

    } catch (error) {
        console.error("Błąd podczas czytania konfiguracji z XML:", error);
        // Fallback w razie błędu XML - żeby serwer nie padł
        return path.join(CSV_DIR, 'backup_data.csv');
    }
}

// --- ZMODYFIKOWANE HELPERY DO CSV ---

// Czytanie rekordów (teraz pobiera ścieżkę dynamicznie)
async function readRecords() {
    try {
        const filePath = await getCsvFilePath(); // Dynamiczna ścieżka
        await fs.access(filePath);
        const content = await fs.readFile(filePath, 'utf8');
        
        // Usuwamy BOM (\uFEFF) jeśli istnieje, żeby nie psuł nagłówków
        const cleanContent = content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;

        return parse(cleanContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            relax_quotes: true
        });
    } catch (e) {
        return [];
    }
}

// Zapisywanie rekordów (teraz pobiera ścieżkę dynamicznie)
async function writeRecords(records) {
    const filePath = await getCsvFilePath(); // Dynamiczna ścieżka

    const columns = [
        "ID", "Kategoria", "Podkategoria", "Nazwa", "Opis", 
        "Kolor", "Marka", "Stan", "DataZnalezienia", 
        "Miejsce", "Lat", "Lon", "CzyOdebrany"
    ];

    const output = stringify(records, {
        header: true,
        columns: columns,
        quoted: true
    });

    // Zapisz z BOM dla poprawnego kodowania polskich znaków w Excelu
    await fs.writeFile(filePath, '\uFEFF' + output, 'utf8');
}

app.post('/api/publish-data', async (req, res) => {
    try {
        const formData = req.body;
        if (!formData) throw new Error("Brak danych");

        const uniqueId = uuidv4();
        const qrName = `qr_${uniqueId}.png`;
        const qrPath = path.join(QR_DIR, qrName);

        // 1. Wczytaj istniejące (z dynamicznego pliku)
        const records = await readRecords();

        // 2. Dodaj nowy rekord
        const newRecord = {
            ID: uniqueId,
            Kategoria: formData.kategoria || '',
            Podkategoria: formData.podkategoria || '',
            Nazwa: formData.nazwa || '',
            Opis: formData.opis || '',
            Kolor: formData.cechy?.kolor || '',
            Marka: formData.cechy?.marka || '',
            Stan: formData.cechy?.stan || '',
            DataZnalezienia: formData.data || '',
            Miejsce: formData.miejsce || '',
            Lat: formData.lat || '',
            Lon: formData.lng || '',
            CzyOdebrany: 'false'
        };

        records.push(newRecord);

        // 3. Zapisz całość
        await writeRecords(records);

        // 4. Generuj QR
        const linkToItem = `${FRONTEND_URL}/${uniqueId}`;
        await QRCode.toFile(qrPath, linkToItem);

        // Musimy wiedzieć jaką nazwę pliku odesłać w odpowiedzi
        const filePath = await getCsvFilePath();
        const fileName = path.basename(filePath);

        res.status(200).json({
            success: true,
            files: {
                csv: `${MY_PUBLIC_HOST}/files/csv/${fileName}`,
                qr: `${MY_PUBLIC_HOST}/files/qr/${qrName}`,
                itemLink: linkToItem
            }
        });

    } catch (error) {
        console.error("Błąd zapisu:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/item/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const records = await readRecords();
        
        const item = records.find(r => r.ID === id);

        if (!item) {
            return res.status(404).json({ error: "Nie znaleziono przedmiotu" });
        }

        const responseData = {
            id: item.ID,
            nazwa: item.Nazwa,
            kategoria: item.Kategoria,
            opis: item.Opis,
            data: item.DataZnalezienia,
            miejsce: item.Miejsce,
            lat: parseFloat(item.Lat),
            lng: parseFloat(item.Lon),
            cechy: {
                kolor: item.Kolor,
                marka: item.Marka,
                stan: item.Stan
            },
            CzyOdebrany: item.CzyOdebrany === 'true'
        };

        res.json(responseData);

    } catch (error) {
        console.error("Błąd odczytu:", error);
        res.status(500).json({ error: "Błąd serwera podczas szukania w CSV" });
    }
});

app.post('/api/item/:id/return', async (req, res) => {
    try {
        const { id } = req.params;
        const records = await readRecords();

        const index = records.findIndex(r => r.ID === id);
        
        if (index === -1) {
            return res.status(404).json({ error: "Nie znaleziono przedmiotu do aktualizacji" });
        }

        records[index].CzyOdebrany = 'true';
        await writeRecords(records);

        res.json({ success: true, message: "Status zaktualizowany na ODEBRANY" });

    } catch (error) {
        console.error("Błąd aktualizacji:", error);
        res.status(500).json({ error: "Nie udało się zaktualizować CSV" });
    }
});

app.get('/api/csv/:office', async (req, res) => {
    try {
        const { office } = req.params;
        const filename = `${office}.csv`;
        const filePath = path.join(CSV_DIR, filename);

        if (!fsSync.existsSync(filePath)) {
            return res.status(404).json({ success: false, error: "Nie znaleziono pliku CSV dla podanego biura" });
        }

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');

        const fileContent = await fs.readFile(filePath, 'utf8');
        res.send(fileContent);

    } catch (error) {
        console.error("Błąd pobierania CSV:", error);
        res.status(500).json({ success: false, error: "Błąd serwera przy pobieraniu CSV" });
    }
});

app.get('/api/zguby', (req, res) => {
    // 1. Logowanie dla celów debugowania
    console.log(`[INFO] Próba pobrania XML z: ${XML_PATH}`);

    // 2. Sprawdzenie czy plik istnieje
    if (!fsSync.existsSync(XML_PATH)) {
        console.error("[BŁĄD] Plik zguby.xml nie istnieje w podanej ścieżce!");
        return res.status(404).json({ success: false, error: "Nie znaleziono pliku zguby.xml" });
    }

    // 3. Użycie res.download - Express sam ogarnie nagłówki i Content-Type
    res.download(XML_PATH, 'zguby.xml', (err) => {
        if (err) {
            console.error("[BŁĄD] Błąd podczas wysyłania pliku:", err);
            if (!res.headersSent) {
                res.status(500).send("Błąd serwera przy pobieraniu pliku.");
            }
        }
    });
});


try {
    const httpsOptions = {
        key: fsSync.readFileSync(path.join(__dirname, 'localhost-key.pem')),
        cert: fsSync.readFileSync(path.join(__dirname, 'localhost.pem'))
    };

    https.createServer(httpsOptions, app).listen(port, async () => {
        console.log(`Bezpieczny serwer HTTPS działa na porcie ${port}`);
        console.log(`Weryfikacja XML...`);
        await getCsvFilePath();
    });
} catch (error) {
    console.error("BŁĄD HTTPS: Nie znaleziono plików .pem! Uruchamiam zwykłe HTTP.");
    app.listen(port, async () => {
        console.log(`Http server: http://localhost:${port}`);
        await getCsvFilePath();
    });
}
