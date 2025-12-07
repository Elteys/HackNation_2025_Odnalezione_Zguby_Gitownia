import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';

const WcagTools = () => {
    const { fontSizeLevel, setFont, contrastMode, setContrast } = useAccessibility();

    // Opcje czcionek
    const fontOptions = [
        { level: 0, label: 'A', size: 'text-xs', title: 'Rozmiar domyślny' },
        { level: 1, label: 'A', size: 'text-sm', title: 'Rozmiar średni' },
        { level: 2, label: 'A', size: 'text-base', title: 'Rozmiar duży' },
        { level: 3, label: 'A', size: 'text-lg', title: 'Rozmiar bardzo duży' },
    ];

    // Opcje kontrastu
    const contrastOptions = [
        { mode: 'normal', bg: 'bg-white', border: 'border-slate-300', text: 'text-slate-900', label: 'Standardowy' },
        { mode: 'yellow-black', bg: 'bg-black', border: 'border-yellow-400', text: 'text-yellow-400', label: 'Żółty na czarnym' },
        { mode: 'black-yellow', bg: 'bg-yellow-400', border: 'border-black', text: 'text-black', label: 'Czarny na żółtym' },
        { mode: 'black-white', bg: 'bg-white', border: 'border-black', text: 'text-black', label: 'Czarny na białym' },
    ];

    return (
        <div className="flex items-center gap-4 bg-slate-100/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 shadow-sm" role="group" aria-label="Narzędzia dostępności">

            {/* SEKCJA 1: ROZMIAR CZCIONKI */}
            <div className="flex items-baseline gap-1 border-r border-slate-300 pr-4">
                {fontOptions.map((opt) => (
                    <button
                        key={opt.level}
                        onClick={() => setFont(opt.level)}
                        className={`
              ${opt.size} font-bold px-1.5 rounded transition-all focus-gov
              ${fontSizeLevel === opt.level
                                ? 'text-blue-900 bg-blue-100 ring-2 ring-blue-200'
                                : 'text-slate-500 hover:text-slate-900'}
            `}
                        title={opt.title}
                        aria-label={opt.title}
                        aria-pressed={fontSizeLevel === opt.level}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* SEKCJA 2: KONTRAST */}
            <div className="flex items-center gap-2">
                {contrastOptions.map((opt) => (
                    <button
                        key={opt.mode}
                        onClick={() => setContrast(opt.mode)}
                        className={`
              w-6 h-6 rounded-full border-2 shadow-sm transition-transform hover:scale-110 focus-gov
              ${opt.bg} ${opt.border}
              ${contrastMode === opt.mode ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''}
            `}
                        title={`Kontrast: ${opt.label}`}
                        aria-label={`Zmień kontrast na: ${opt.label}`}
                        aria-pressed={contrastMode === opt.mode}
                    >
                        {/* W środku literka 'A' pokazująca kolor tekstu */}
                        <span className={`flex items-center justify-center h-full w-full text-[10px] font-bold ${opt.text}`}>
                            A
                        </span>
                    </button>
                ))}
            </div>

        </div>
    );
};

export default WcagTools;