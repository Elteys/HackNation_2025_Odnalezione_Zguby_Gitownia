// lost-items-gateway/server.js - WERSJA POPRAWIONA (Z WALIDACJĄ I QR)
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const xml2js = require('xml2js');
const QRCode = require('qrcode');

const app = express();
const port = 3001; 

// --- KONFIGURACJA STAŁYCH ---
const CKAN_API_URL = 'http://localhost:8000/api/3/action'; 
const DATASET_ID = 'rzeczy-znalezione-samorzady'; 
// Link kieruje na nasz frontend React (działa na porcie 3000), ze ścieżką /item/[UUID]
const BASE_QR_LINK = 'http://localhost:3000/item/'; 

// Oczekiwane kluczowe pola (do sprawdzenia, czy plik XML zawiera podstawową strukturę)
const WYMAGANE_POLA = [
    'IdentyfikatorUnikalny', 
    'KategoriaGlowna', 
    'Status', 
    'DataZnalezienia'
];

// --- 1. Konfiguracja Globalna i Serwowanie QR ---
app.use(cors({
    origin: 'http://localhost:3000'
}));
app.use(express.json());
// Udostępnienie katalogu temp_uploads pod adresem /qr_images (np. http://localhost:3001/qr_images/...)
app.use('/qr_images', express.static('temp_uploads')); 

// --- 2. Konfiguracja Multer do Przechowywania Plików ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync('temp_uploads')) {
            fs.mkdirSync('temp_uploads');
        }
        cb(null, 'temp_uploads/'); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = file.originalname.split('.').pop();
        cb(null, 'data-import-' + uniqueSuffix + '.' + extension);
    }
});

const upload = multer({ storage: storage });

// --- FUNKCJA POMOCNICZA: Walidacja i Parsowanie XML ---
/**
 * Wczytuje i parsuje XML, wykonując podstawową walidację schematu.
 * @param {string} tempFilePath Ścieżka do pliku na serwerze.
 * @returns {object} Znormalizowany obiekt JSON z danymi zgłoszenia.
 */
async function validateAndNormalizeXml(tempFilePath) {
    const xmlContent = fs.readFileSync(tempFilePath, 'utf8');
    const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });
    
    const result = await parser.parseStringPromise(xmlContent);
    const zgloszenie = result.ZgloszenieZguby;

    if (!zgloszenie) {
        throw new Error('Błąd struktury: Brak głównego tagu <ZgloszenieZguby>.');
    }

    // Uproszczona ekstrakcja kluczowych danych do łatwej walidacji
    const naglowek = zgloszenie.Naglowek || {};
    const przedmiot = zgloszenie.Przedmiot || {};
    const daneMagazynowe = zgloszenie.DaneMagazynowe || {};
    const kontekst = zgloszenie.KontekstZnalezienia || {};

    const extractedData = {
        IdentyfikatorUnikalny: naglowek.IdentyfikatorUnikalny,
        KategoriaGlowna: przedmiot.KategoriaGlowna,
        Status: daneMagazynowe.Status,
        DataZnalezienia: kontekst.DataZnalezienia
    };

    let bledy = [];
    for (const pole of WYMAGANE_POLA) {
        if (!extractedData[pole]) {
            bledy.push(`Brak wymaganego pola: ${pole}`);
        }
    }

    if (bledy.length > 0) {
        throw new Error(`Błąd walidacji schematu: ${bledy.join('; ')}`);
    }

    return zgloszenie;
}


// --- 3. TESTOWY ENDPOINT QR (Łączy Krok 1, 2, 3 i 4) ---
app.post('/api/test-qr', upload.single('dataFile'), async (req, res) => {
    
    if (!req.file) {
        return res.status(400).json({ error: 'Brak pliku do wgrania.' });
    }
    
    const tempFilePath = req.file.path;
    
    try {
        // 1. Walidacja i Parsowanie XML
        const zgloszenie = await validateAndNormalizeXml(tempFilePath);
        const unikalnyId = zgloszenie.Naglowek.IdentyfikatorUnikalny;
        
        // 2. Generowanie QR
        const linkDoPodgladu = `${BASE_QR_LINK}${unikalnyId}`; 
        const qrFilename = `qr-${unikalnyId}.png`;
        const qrPath = `temp_uploads/${qrFilename}`;
        const qrPublicUrl = `http://localhost:${port}/qr_images/${qrFilename}`;
        
        await QRCode.toFile(qrPath, linkDoPodgladu);
        
        // 3. Czyszczenie tymczasowego pliku XML po weryfikacji
        fs.unlinkSync(tempFilePath); 

        // 4. Zwrócenie wyniku
        res.status(200).json({
            message: 'Sukces! Walidacja OK i Kod QR wygenerowany.',
            unikalnyId: unikalnyId,
            qrLink: linkDoPodgladu,
            qrPublicUrl: qrPublicUrl // Gotowy link do obrazu QR dla frontendu
        });

    } catch (e) {
        // Obsługa błędów z parsowania lub walidacji
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        console.error('Błąd testu QR:', e.message);
        res.status(400).json({ 
            error: 'Błąd przetwarzania XML.', 
            details: e.message 
        });
    }
});


// --- 4. ENDPOINT PUBLIKACJI (Krok 5 - Symulacja) ---
// W prawdziwej aplikacji, ten endpoint przyjmie ID sesji/token
// i opublikuje wcześniej zweryfikowany plik.
app.post('/api/publish-data', async (req, res) => {
    
    const { finalFilePath, apiKey } = req.body; 

    // W normalnej wersji, tu powinno być sprawdzenie autoryzacji i wysyłka do CKAN.
    
    if (!apiKey || apiKey.length < 5) {
        return res.status(401).json({ error: 'Brak lub niepoprawny klucz API.' });
    }

    // Symulacja udanej publikacji
    // UWAGA: Musisz upewnić się, że plik istnieje, jeśli został wgrany i tylko zweryfikowany!
    // W tej testowej wersji, plik jest usuwany w /api/test-qr, więc ten endpoint 
    // wymagałby, aby dane zostały zapisane w trwałym miejscu lub w bazie danych po walidacji.
    
    // Zastąpmy symulację udaną publikacją, jeśli klucz jest OK.
    
    res.status(200).json({ 
        message: 'Krok 5: Publikacja (Symulacja) zakończona sukcesem! Dane są dostępne na dane.gov.pl.', 
        ckanUrl: `https://dane.gov.pl/dataset/${DATASET_ID}`
    });

});


// --- Uruchomienie serwera ---
app.listen(port, () => {
    console.log(`Express Gateway działa na http://localhost:${port}`);
    console.log(`Frontend URL dla QR: ${BASE_QR_LINK}`);
});