// lost-items-gateway/server.js - WERSJA TESTOWA QR
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const xml2js = require('xml2js');
const QRCode = require('qrcode');

const app = express();
const port = 3001; 

// --- 1. Konfiguracja Globalna i Serwowanie QR ---
app.use(cors({
    origin: 'http://localhost:3000'
}));
app.use(express.json());
// Udostępnienie katalogu temp_uploads pod adresem /qr_images
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
        cb(null, 'test-' + uniqueSuffix + '.' + extension);
    }
});

const upload = multer({ storage: storage });
const BASE_QR_LINK = 'https://dane.gov.pl/zguby/podglad/';

// --- 3. TESTOWY ENDPOINT: Parsowanie, Ekstrakcja ID i Generowanie QR ---
// Łączy Krok 1, 2, 3 i 4 w jednym zapytaniu do szybkiego testu.
app.post('/api/test-qr', upload.single('dataFile'), async (req, res) => {
    
    if (!req.file) {
        return res.status(400).json({ error: 'Brak pliku do wgrania.' });
    }
    
    const tempFilePath = req.file.path;
    const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });
    
    try {
        const xmlContent = fs.readFileSync(tempFilePath, 'utf8');
        
        // Parsowanie XML
        const result = await parser.parseStringPromise(xmlContent);
        
        const zgloszenie = result.ZgloszenieZguby;
        
        if (!zgloszenie || !zgloszenie.Naglowek || !zgloszenie.Naglowek.IdentyfikatorUnikalny) {
            // Walidacja: Błąd struktury lub brak ID
            fs.unlinkSync(tempFilePath); 
            return res.status(400).json({ 
                message: 'Błąd: Plik XML nie zawiera unikalnego identyfikatora w Naglowku.' 
            });
        }
        
        // Ekstrakcja ID
        const unikalnyId = zgloszenie.Naglowek.IdentyfikatorUnikalny;
        const linkDoPodgladu = `${BASE_QR_LINK}${unikalnyId}`; 
        const qrFilename = `qr-${unikalnyId}.png`;
        const qrPath = `temp_uploads/${qrFilename}`;
        const qrPublicUrl = `http://localhost:${port}/qr_images/${qrFilename}`;
        
        // Generowanie Kodu QR jako pliku PNG
        await QRCode.toFile(qrPath, linkDoPodgladu);
        
        // Opcjonalnie: Usunięcie oryginalnego pliku XML po przetworzeniu, aby nie zaśmiecać dysku
        fs.unlinkSync(tempFilePath); 

        // Zwrócenie wyniku
        res.status(200).json({
            message: 'Sukces! Kod QR wygenerowany na podstawie Identyfikatora Unikalnego.',
            unikalnyId: unikalnyId,
            qrLink: linkDoPodgladu,
            qrPublicUrl: qrPublicUrl // Gotowy link do obrazu QR
        });

    } catch (e) {
        // Obsługa błędów parsowania i systemu plików
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        console.error('Błąd testu QR:', e);
        res.status(500).json({ 
            error: 'Wystąpił błąd serwera podczas przetwarzania XML.', 
            details: e.message 
        });
    }
});

// --- Uruchomienie serwera ---
app.listen(port, () => {
    console.log(`Express Gateway działa na http://localhost:${port}`);
    console.log('Gotowy do testowania QR na POST /api/test-qr');
});