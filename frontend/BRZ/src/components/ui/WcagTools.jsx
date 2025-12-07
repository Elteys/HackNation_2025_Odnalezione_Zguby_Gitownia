import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { Sun, Minus, Plus } from 'lucide-react';

const WcagTools = () => {
    const { fontSizeLevel, setFont, contrastMode, setContrast } = useAccessibility();

    const MIN_FONT = 0;
    const MAX_FONT = 3;
    const contrastModes = ['normal', 'yellow-black', 'black-yellow', 'black-white'];

    const handleFontChange = (direction) => {
        const newLevel = fontSizeLevel + direction;
        if (newLevel >= MIN_FONT && newLevel <= MAX_FONT) {
            setFont(newLevel);
        }
    };

    const cycleContrast = () => {
        const currentIndex = contrastModes.indexOf(contrastMode);
        const nextIndex = (currentIndex + 1) % contrastModes.length;
        setContrast(contrastModes[nextIndex]);
    };

    // Klasa dla przycisków:
    // - "wcag-btn": nasza klasa do kolorów w CSS
    // - Reszta: Tailwind do rozmiarów i układu (to co zniknęło wcześniej)
    const btnClass = "wcag-btn p-1.5 rounded-md transition-all focus-gov flex items-center justify-center text-slate-600 hover:text-blue-900 hover:bg-slate-200/50 disabled:opacity-30 disabled:cursor-not-allowed";

    return (
        <div
            className="flex items-center gap-1 sm:gap-2 bg-slate-100/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200 shadow-sm"
            role="group"
            aria-label="Narzędzia dostępności"
        >

            {/* 1. ZMIANA CZCIONKI */}
            <div className="flex items-center" role="group" aria-label="Rozmiar tekstu">
                <button
                    onClick={() => handleFontChange(-1)}
                    disabled={fontSizeLevel === MIN_FONT}
                    className={btnClass}
                    title="Zmniejsz czcionkę"
                >
                    <Minus size={18} strokeWidth={2.5} />
                </button>

                {/* Wskaźnik poziomu (A i kropki) */}
                <div className="mx-2 flex flex-col items-center justify-center w-6 wcag-indicator" aria-hidden="true">
                    <span className="text-sm font-extrabold leading-none">A</span>
                    <div className="flex gap-0.5 mt-1">
                        {[...Array(MAX_FONT)].map((_, i) => (
                            <div key={i} className={`w-1 h-1 rounded-full ${i < fontSizeLevel ? 'bg-blue-600 active-dot' : 'bg-slate-300 inactive-dot'}`} />
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => handleFontChange(1)}
                    disabled={fontSizeLevel === MAX_FONT}
                    className={btnClass}
                    title="Zwiększ czcionkę"
                >
                    <Plus size={18} strokeWidth={2.5} />
                </button>
            </div>

            {/* Separator */}
            <div className="w-px h-6 bg-slate-300 mx-1 sm:mx-2 separator" />

            {/* 2. KONTRAST */}
            <button
                onClick={cycleContrast}
                className={`${btnClass} gap-2 px-2`}
                title="Zmień kontrast"
                aria-label={`Zmień kontrast. Aktualny tryb: ${contrastMode}`}
            >
                <Sun size={20} className="icon-sun" fill={contrastMode !== 'normal' ? "currentColor" : "none"} />
                <span className="hidden lg:inline text-xs font-bold uppercase tracking-wider">
                    Kontrast
                </span>
            </button>

        </div>
    );
};

export default WcagTools;