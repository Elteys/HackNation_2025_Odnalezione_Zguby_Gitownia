import OpenAI from "openai";
import { KATEGORIE, STANY } from "../utils/dictionaries";

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
});

// Generujemy tekst słownika dla AI
const slownikPrompt = Object.entries(KATEGORIE)
    .map(([kat, podkaty]) => `- ${kat}: ${podkaty.join(", ")}`)
    .join("\n");

const stanyPrompt = STANY.join(", ");

// Wzorzec XML (prosty i czytelny)
const xmlStructure = `
<Zgloszenie>
  <Przedmiot>
    <Kategoria>Tutaj wpisz KATEGORIĘ GŁÓWNĄ (wielkimi literami)</Kategoria>
    <Podkategoria>Tutaj wpisz Podkategorię</Podkategoria>
    <Nazwa>Krótka nazwa przedmiotu</Nazwa>
    <Opis>Szczegółowy opis wizualny</Opis>
    <Cechy>
       <Kolor>np. czarny</Kolor>
       <Marka>np. Samsung</Marka>
       <Stan>np. Używany</Stan>
    </Cechy>
  </Przedmiot>
</Zgloszenie>
`;

export const analyzeImage = async (base64Image) => {
    try {
        console.log("Wysyłam zapytanie do OpenAI...");

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Jesteś API, które analizuje zdjęcia zgubionych rzeczy.
                    Twoim zadaniem jest zwrócić TYLKO I WYŁĄCZNIE kod XML.
                    Nie dodawaj żadnych znaczników Markdown (typu \`\`\`xml). Nie pisz "Oto XML".

                    SŁOWNIK KATEGORII (TRZYMAJ SIĘ GO ŚCIŚLE):
                    ${slownikPrompt}
                    
                    SŁOWNIK STANÓW: ${stanyPrompt}

                    WZORZEC XML:
                    ${xmlStructure}`
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Przeanalizuj to i wypełnij XML." },
                        { type: "image_url", image_url: { "url": base64Image } },
                    ],
                },
            ],
        });

        const rawContent = response.choices[0].message.content;
        console.log("Surowa odpowiedź AI:", rawContent);

        // --- CZYSZCZENIE ODPOWIEDZI ---
        // To naprawia problem "nic nie wypełnia"
        const cleanContent = rawContent
            .replace(/```xml/g, '') // Usuń znacznik początku kodu
            .replace(/```/g, '')    // Usuń znacznik końca kodu
            .trim();                // Usuń spacje

        return cleanContent;

    } catch (error) {
        console.error("Błąd OpenAI:", error);
        throw error;
    }
};