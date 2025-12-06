import OpenAI from "openai";
import { KATEGORIE, STANY } from "../utils/dictionaries";

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
});

// Budujemy bardzo dokładną listę dla AI
const slownikPrompt = Object.entries(KATEGORIE)
    .map(([kat, podkaty]) => `KATEGORIA: "${kat}" -> PODKATEGORIE: [${podkaty.map(p => `"${p}"`).join(", ")}]`)
    .join("\n");

const stanyPrompt = STANY.map(s => `"${s}"`).join(", ");

const xmlStructure = `
<Zgloszenie>
  <Przedmiot>
    <Kategoria>NAZWA KATEGORII Z LISTY</Kategoria>
    <Podkategoria>NAZWA PODKATEGORII Z LISTY</Podkategoria>
    <Nazwa>Krótka nazwa</Nazwa>
    <Opis>Opis fizyczny</Opis>
    <Cechy>
       <Kolor>np. czarny</Kolor>
       <Marka>np. Samsung</Marka>
       <Stan>Jeden z: ${stanyPrompt}</Stan>
    </Cechy>
  </Przedmiot>
</Zgloszenie>
`;

export const analyzeImage = async (base64Image) => {
    try {
        console.log("Wysyłam zapytanie do OpenAI (Tryb Strict)...");

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Jesteś robotem indeksującym. Analizujesz zdjęcie i zwracasz dane w XML.

                    ZASADY KRYTYCZNE (JEŚLI ICH NIE SPEŁNISZ, SYSTEM SIĘ ZEPSUJE):
                    1. Wybieraj wartości TYLKO I WYŁĄCZNIE z podanych list.
                    2. NIE UŻYWAJ SYNONIMÓW (np. jeśli widzisz "Smartfon", a na liście jest "Telefon" -> wpisz "Telefon").
                    3. Zachowaj WIELKOŚĆ LITER z list (np. "Telefon", nie "telefon").
                    
                    DOSTĘPNE KATEGORIE I PODKATEGORIE:
                    ${slownikPrompt}
                    *Jeśli przedmiot nie pasuje do żadnej podkategorii, wybierz "Inne".*

                    DOSTĘPNE STANY:
                    [${stanyPrompt}]

                    ZASADY OPISU:
                    - Ignoruj tło, ekrany laptopów/telefonów. Opisuj tylko fizyczny przedmiot.

                    ZWROĆ TYLKO CZYSTY KOD XML WEDŁUG WZORCA:
                    ${xmlStructure}`
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Dopasuj ten przedmiot do słownika i wypełnij XML." },
                        { type: "image_url", image_url: { "url": base64Image } },
                    ],
                },
            ],
            temperature: 0.0, // ZERO KREATYWNOŚCI = WYŻSZA ZGODNOŚĆ ZE SŁOWNIKIEM
        });

        const rawContent = response.choices[0].message.content;

        // Czyszczenie
        const cleanContent = rawContent
            .replace(/```xml/g, '')
            .replace(/```/g, '')
            .trim();

        console.log("Otrzymany XML:", cleanContent);
        return cleanContent;

    } catch (error) {
        console.error("Błąd OpenAI:", error);
        throw error;
    }
};