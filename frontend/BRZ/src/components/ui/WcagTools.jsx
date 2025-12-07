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
                    className="p-1.5 text-slate-600 hover:text-blue-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-gov rounded-md"
                    title="Zmniejsz czcionkę"
                >
                    <Minus size={16} strokeWidth={3} />
                </button>

                <div className="mx-1 flex flex-col items-center justify-center w-6" aria-hidden="true">
                    <span className="text-xs font-extrabold text-slate-700">A</span>
                    <div className="flex gap-0.5 mt-0.5">
                        {[...Array(MAX_FONT)].map((_, i) => (
                            <div key={i} className={`w-0.5 h-0.5 rounded-full ${i < fontSizeLevel ? 'bg-blue-600' : 'bg-slate-300'}`} />
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => handleFontChange(1)}
                    disabled={fontSizeLevel === MAX_FONT}
                    className="p-1.5 text-slate-600 hover:text-blue-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-gov rounded-md"
                    title="Zwiększ czcionkę"
                >
                    <Plus size={16} strokeWidth={3} />
                </button>
            </div>

            <div className="w-px h-5 bg-slate-300 mx-1 sm:mx-2" />

            {/* 2. KONTRAST (Klasa 'wcag-contrast-toggle' jest kluczowa dla CSS) */}
            <button
                onClick={cycleContrast}
                className="wcag-contrast-toggle flex items-center gap-2 px-2 py-1 rounded-md transition-all focus-gov border-2 border-transparent"
                title="Zmień kontrast"
                aria-label={`Zmień kontrast. Aktualny tryb: ${contrastMode}`}
            >
                <Sun size={18} className="icon-sun" fill={contrastMode !== 'normal' ? "currentColor" : "none"} />
                <span className="hidden lg:inline text-xs font-bold uppercase tracking-wider">
                    Kontrast
                </span>
            </button>

        </div>
    );
};

export default WcagTools;