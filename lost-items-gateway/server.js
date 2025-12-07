require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const xml2js = require('xml2js');
const { parse } = require('csv-parse/sync'); // Nowa biblioteka do czytania
const { stringify } = require('csv-stringify/sync'); // Nowa biblioteka do zapisu
const https = require('https'); // Upewnij się, że masz to na górze pliku!

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- KONFIGURACJA ---
const MY_PUBLIC_HOST = process.env.PUBLIC_HOST || `https://localhost:${port}`;

// Zmieniamy na link, który podałeś w pytaniu (z hashem #)
const FRONTEND_URL = 'https://localhost:5173/#/szczegoly'; 

const OFFICE_NAME = "Starostwo_Powiatowe_Gryfino";
const MASTER_CSV_FILENAME = `${OFFICE_NAME}.csv`;

const BASE_OUTPUT_DIR = path.join(__dirname, 'public_files');
const CSV_DIR = path.join(BASE_OUTPUT_DIR, 'csv');
const QR_DIR = path.join(BASE_OUTPUT_DIR, 'qr');
const TEMPLATE_XML_PATH = path.join(__dirname, 'template.xml');

// Upewnij się, że katalogi istnieją
if (!fsSync.existsSync(CSV_DIR)) fsSync.mkdirSync(CSV_DIR, { recursive: true });
if (!fsSync.existsSync(QR_DIR)) fsSync.mkdirSync(QR_DIR, { recursive: true });

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Udostępniamy pliki statycznie
app.use('/files', express.static(BASE_OUTPUT_DIR));

const CSV_FILE_PATH = path.join(CSV_DIR, MASTER_CSV_FILENAME);

// --- CSV HELPERS ---
async function readRecords() {
    try {
        // Sprawdzamy czy plik istnieje
        await fs.access(CSV_FILE_PATH);
        const content = await fs.readFile(CSV_FILE_PATH, 'utf8');
        
        // --- KLUCZOWA POPRAWKA ---
        // Usuwamy BOM (\uFEFF) jeśli istnieje na początku pliku
        // Bez tego csv-parse myśli, że pierwszy nagłówek jest uszkodzony
        let cleanContent = content;
        if (cleanContent.charCodeAt(0) === 0xFEFF) {
            cleanContent = cleanContent.slice(1);
        }

        return parse(cleanContent, { 
            columns: true, 
            skip_empty_lines: true, 
            trim: true,
            relax_quotes: true
        });
    } catch (e) {
        // Jeśli plik nie istnieje lub jest pusty, zwracamy pustą tablicę
        return [];
    }
}

async function writeRecords(records) {
    const columns = [
        "ID", "Kategoria", "Podkategoria", "Nazwa", "Opis",
        "Kolor", "Marka", "Stan", "DataZnalezienia",
        "Miejsce", "Lat", "Lon", "CzyOdebrany",
        "Resources", "Tags", "Supplements"
    ];

    const output = stringify(records, {
        header: true,
        columns: columns,
        quoted: true // Bezpieczeństwo: zawsze w cudzysłowach
    });

    await fs.writeFile(CSV_FILE_PATH, '\uFEFF' + output, 'utf8');
}

// --- XML PARSER ---
async function parseTemplateXML() {
    const xmlContent = await fs.readFile(TEMPLATE_XML_PATH, 'utf8');
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xmlContent);

    const datasets = result.datasets.dataset;
    // Jeśli tylko jeden dataset, zamień na tablicę
    return Array.isArray(datasets) ? datasets : [datasets];
}

// --- ENDPOINTY ---
// 1. Dodaj nowy rekord i generuj QR
app.post('/api/publish-data', async (req, res) => {
    try {
        const formData = req.body;
        if (!formData) throw new Error("Brak danych z formularza");

        const records = await readRecords();
        const templateDatasets = await parseTemplateXML();

        // Używamy tylko pierwszego dataset z XML jako szablon
        const xmlData = templateDatasets[0] || {};

        const newRecord = {
            ID: uuidv4(),
            Kategoria: xmlData.categories?.category ? (Array.isArray(xmlData.categories.category) ? xmlData.categories.category.join('|') : xmlData.categories.category) : '',
            Podkategoria: '', // Możesz uzupełnić z formularza jeśli chcesz
            Nazwa: formData.nazwa || '',
            Opis: formData.opis || '',
            Kolor: formData.cechy?.kolor || '',
            Marka: formData.cechy?.marka || '',
            Stan: formData.cechy?.stan || '',
            DataZnalezienia: formData.data || '',
            Miejsce: formData.miejsce || '',
            Lat: formData.lat || '',
            Lon: formData.lng || '',
            CzyOdebrany: 'false',
            Resources: xmlData.resources?.resource
                ? JSON.stringify(Array.isArray(xmlData.resources.resource) ? xmlData.resources.resource : [xmlData.resources.resource])
                : '',
            Tags: xmlData.tags?.tag
                ? JSON.stringify(Array.isArray(xmlData.tags.tag) ? xmlData.tags.tag : [xmlData.tags.tag])
                : '',
            Supplements: xmlData.supplements?.supplement
                ? JSON.stringify(Array.isArray(xmlData.supplements.supplement) ? xmlData.supplements.supplement : [xmlData.supplements.supplement])
                : ''
        };

        records.push(newRecord);
        await writeRecords(records);

        const qrName = `qr_${newRecord.ID}.png`;
        const qrPath = path.join(QR_DIR, qrName);
        const linkToItem = `${FRONTEND_URL}/${newRecord.ID}`;
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

// 2. Pobierz pojedynczy rekord
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
            lat: parseFloat(item.Lat),
            lng: parseFloat(item.Lon),
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

// 3. Aktualizacja statusu na ODEBRANY
app.post('/api/item/:id/return', async (req, res) => {
    try {
        const { id } = req.params;
        const records = await readRecords();
        const index = records.findIndex(r => r.ID === id);
        if (index === -1) return res.status(404).json({ error: "Nie znaleziono przedmiotu do aktualizacji" });

        records[index].CzyOdebrany = 'true';
        await writeRecords(records);

        res.json({ success: true, message: "Status zaktualizowany na ODEBRANY" });

    } catch (error) {
        console.error("Błąd aktualizacji:", error);
        res.status(500).json({ error: "Nie udało się zaktualizować CSV" });
    }
});

// Wczytujemy certyfikaty wygenerowane przez mkcert
try {
    // Szukamy plików w tym samym folderze co server.js
    const httpsOptions = {
        key: fsSync.readFileSync(path.join(__dirname, 'localhost-key.pem')),
        cert: fsSync.readFileSync(path.join(__dirname, 'localhost.pem'))
    };

    https.createServer(httpsOptions, app).listen(port, () => {
        console.log(`Bezpieczny serwer HTTPS działa na porcie ${port}`);
        console.log(`https://localhost:${port}`);
    });
} catch (error) {
    console.error("BŁĄD HTTPS: Nie znaleziono plików .pem! Uruchamiam zwykłe HTTP.");
    console.error("Upewnij się, że pliki localhost.pem i localhost-key.pem są w folderze:", __dirname);
    app.listen(port, () => console.log(`Http server: http://localhost:${port}`));
}