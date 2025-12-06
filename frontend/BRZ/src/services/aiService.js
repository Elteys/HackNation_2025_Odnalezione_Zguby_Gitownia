import OpenAI from "openai";
import { KATEGORIE, STANY } from "../utils/dictionaries";

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
});

// Generowanie promptu ze słownikiem
const slownikPrompt = Object.entries(KATEGORIE)
    .map(([kat, podkaty]) => `KATEGORIA: "${kat}" -> PODKATEGORIE: [${podkaty.join(", ")}]`)
    .join("\n");

const stanyPrompt = STANY.join(", ");

// Wzorzec XML (z tłumaczeniami)
const xmlStructure = `
<Zgloszenie>
  <Przedmiot>
    <Kategoria>NAZWA KATEGORII Z LISTY</Kategoria>
    <Podkategoria>NAZWA PODKATEGORII Z LISTY</Podkategoria>
    <Nazwa>Krótka nazwa (PO POLSKU)</Nazwa>
    
    <Opis>Szczegółowy opis fizyczny (PO POLSKU)</Opis>
    <OpisEN>Tłumaczenie opisu na język ANGIELSKI</OpisEN>
    <OpisUA>Tłumaczenie opisu na język UKRAIŃSKI</OpisUA>

    <Cechy>
       <Kolor>np. czarny</Kolor>
       <Marka>np. Samsung</Marka>
       <Stan>Jeden z: ${stanyPrompt}</Stan>
    </Cechy>
  </Przedmiot>
</Zgloszenie>
`;

// 1. ANALIZA ZDJĘCIA (Zwraca XML)
export const analyzeImage = async (base64Image) => {
    try {
        console.log("AI Service: Analizuję zdjęcie...");

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Jesteś robotem indeksującym. Analizujesz zdjęcie zguby.

                    ZASADY KRYTYCZNE:
                    1. Wybieraj wartości TYLKO ze słownika poniżej.
                    2. Ignoruj tło zdjęcia i ekrany urządzeń.
                    3. Generuj opisy w 3 językach (PL, EN, UA).

                    SŁOWNIK:
                    ${slownikPrompt}
                    *Jeśli nic nie pasuje, wybierz kategorię "INNE".*

                    WZORZEC XML (ZWRÓĆ TYLKO TO, BEZ MARKDOWN):
                    ${xmlStructure}`
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Przeanalizuj zdjęcie i wypełnij XML." },
                        { type: "image_url", image_url: { "url": base64Image } },
                    ],
                },
            ],
            temperature: 0.0, // Precyzja > Kreatywność
        });

        const rawContent = response.choices[0].message.content;

        // Czyszczenie odpowiedzi (usuwanie ```xml )
        const cleanContent = rawContent
            .replace(/```xml/g, '')
            .replace(/```/g, '')
            .trim();

        return cleanContent;

    } catch (error) {
        console.error("AI Service Error:", error);
        throw error;
    }
};

// 2. TŁUMACZENIE RĘCZNE (Zwraca JSON) - To naprawia tryb manualny
export const generateTranslations = async (textPL) => {
    try {
        console.log("AI Service: Tłumaczę tekst...", textPL);
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Jesteś tłumaczem urzędowym. Przetłumacz opis na ANGIELSKI (en) i UKRAIŃSKI (ua).
                    Zwróć TYLKO JSON: { "en": "...", "ua": "..." }`
                },
                {
                    role: "user",
                    content: `Tekst: "${textPL}"`
                }
            ],
            temperature: 0.3,
        });

        const raw = response.choices[0].message.content;
        const cleanJson = raw.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanJson);
    } catch (error) {
        console.error("Translation Error:", error);
        throw error;
    }
};