import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

export const AccessibilityProvider = ({ children }) => {
    const [fontSizeLevel, setFontSizeLevel] = useState(() => {
        return parseInt(localStorage.getItem('fontSizeLevel') || '0');
    });

    const [contrastMode, setContrastMode] = useState(() => {
        return localStorage.getItem('contrastMode') || 'normal';
    });

    useEffect(() => {
        const html = document.documentElement;
        const sizes = ['100%', '110%', '120%', '130%'];
        html.style.fontSize = sizes[fontSizeLevel];

        localStorage.setItem('fontSizeLevel', fontSizeLevel);
    }, [fontSizeLevel]);

    useEffect(() => {
        const body = document.body;
        body.classList.remove('theme-normal', 'theme-yellow-black', 'theme-black-yellow', 'theme-black-white');

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