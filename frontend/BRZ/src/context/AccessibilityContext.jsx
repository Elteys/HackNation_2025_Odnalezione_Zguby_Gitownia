import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

export const AccessibilityProvider = ({ children }) => {
    // --- 1. ROZMIAR CZCIONKI (0 - 3) ---
    // 0: 100% (16px), 1: 110%, 2: 120%, 3: 130%
    const [fontSizeLevel, setFontSizeLevel] = useState(() => {
        return parseInt(localStorage.getItem('fontSizeLevel') || '0');
    });

    // --- 2. KONTRAST (String) ---
    // 'normal', 'yellow-black', 'black-yellow', 'black-white'
    const [contrastMode, setContrastMode] = useState(() => {
        return localStorage.getItem('contrastMode') || 'normal';
    });

    // Efekt: Skalowanie czcionki (REM)
    useEffect(() => {
        const html = document.documentElement;
        // Bazowa wielkość czcionki przeglądarki to zazwyczaj 16px.
        // Zmieniamy procentowo, co przeskaluje wszystkie jednostki 'rem' w Tailwindzie.
        const sizes = ['100%', '110%', '120%', '130%'];
        html.style.fontSize = sizes[fontSizeLevel];

        localStorage.setItem('fontSizeLevel', fontSizeLevel);
    }, [fontSizeLevel]);

    // Efekt: Aplikowanie klasy kontrastu do BODY
    useEffect(() => {
        const body = document.body;
        // Najpierw usuń wszystkie stare klasy motywów
        body.classList.remove('theme-normal', 'theme-yellow-black', 'theme-black-yellow', 'theme-black-white');

        // Dodaj nową
        body.classList.add(`theme-${contrastMode}`);

        localStorage.setItem('contrastMode', contrastMode);
    }, [contrastMode]);

    const setFont = (level) => setFontSizeLevel(level);
    const setContrast = (mode) => setContrastMode(mode);

    const resetSettings = () => {
        setFontSizeLevel(0);
        setContrastMode('normal');
    };

    return (
        <AccessibilityContext.Provider value={{
            fontSizeLevel,
            contrastMode,
            setFont,
            setContrast,
            resetSettings
        }}>
            {children}
        </AccessibilityContext.Provider>
    );
};

export const useAccessibility = () => useContext(AccessibilityContext);