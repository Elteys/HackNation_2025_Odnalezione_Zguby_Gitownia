import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
});

const xmlStructure = `
<Zgloszenie>
  <Przedmiot>
    <Kategoria>ELEKTRONIKA lub DOKUMENTY lub ODZIEZ lub INNE</Kategoria>
    <Podkategoria>np. Telefon</Podkategoria>
    <Nazwa>Krótka nazwa</Nazwa>
    <Opis>Szczegółowy opis</Opis>
    <Cechy>
       <Kolor>np. czarny</Kolor>
       <Marka>np. Samsung</Marka>
       <Stan>np. uszkodzony</Stan>
    </Cechy>
  </Przedmiot>
</Zgloszenie>
`;

export const analyzeImage = async (base64Image) => {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Jesteś asystentem w biurze rzeczy znalezionych.
Twoim zadaniem jest analiza zdjęcia i zwrócenie wyłącznie kodu XML zgodnego ze wzorcem dostarczonym w zmiennej poniżej.

Skup się wyłącznie na opisie fizycznego przedmiotu widocznego na zdjęciu.
Ignoruj całkowicie:

tło i otoczenie (rośliny, meble, kubki, dekoracje itp.)

inne przedmioty, które ewidentnie nie są głównym obiektem zdjęcia

to, co jest tymczasowe lub zmienne (np. zawartość ekranu urządzeń, naklejki tymczasowe, powiadomienia, dokumenty leżące obok itp.)

Opisuj jedynie stałe, trwałe cechy głównego przedmiotu takie jak:

kształt, materiał

kolor

marka / model, jeśli widoczne

elementy konstrukcyjne

widoczne uszkodzenia

rozmiar orientacyjny

dodatkowe elementy fizyczne będące częścią przedmiotu

Nie opisuj tego, co jest na ekranie, co leży obok, ani co tworzy tło zdjęcia.
Nie twórz historii, domysłów ani funkcji przedmiotu — tylko wygląd.

Zwróć czysty XML, bez żadnych znaczników Markdown ani komentarzy.

Na końcu komunikatu znajduje się zmienna z dostarczonym wzorcem XML, którego masz bezwzględnie użyć. ${xmlStructure}`
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Przeanalizuj to zdjęcie i wypełnij XML." },
                        {
                            type: "image_url",
                            image_url: {
                                "url": base64Image,
                            },
                        },
                    ],
                },
            ],
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("Błąd OpenAI:", error);
        throw error;
    }
};