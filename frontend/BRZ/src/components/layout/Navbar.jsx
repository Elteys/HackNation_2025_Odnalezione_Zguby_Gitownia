import React, { useState } from 'react';
import { ShieldCheck, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import WcagTools from '../ui/WcagTools';
import Herb_Polski from "../../../public/Herb_Polski.svg"; 

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-colors">
            <div className="h-1 bg-gradient-to-r from-red-600 via-white to-red-600 w-full" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    <Link to="/" className="flex items-center gap-3 group" onClick={() => setIsMobileMenuOpen(false)}>
                        <img src={Herb_Polski} alt="Herb" className='h-10 w-9 group-hover:scale-105 transition-transform' />
                        <div className="flex flex-col">
                            <span className="text-lg font-bold text-slate-800 leading-tight">Odnalezione Zguby</span>
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Portal Urzędnika</span>
                        </div>
                    </Link>

                    <div className="hidden md:flex items-stretch gap-6">
                        <WcagTools />

                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                            <ShieldCheck size={16} />
                            <span>Jan Kowalski</span>
                        </div>
                    </div>

                    <div className="flex md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus-gov"
                            aria-label={isMobileMenuOpen ? "Zamknij menu" : "Otwórz menu"}
                            aria-expanded={isMobileMenuOpen}
                        >
                            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>

                </div>
            </div>

            {isMobileMenuOpen && (
                <div className="md:hidden border-t border-slate-200 bg-white animate-in slide-in-from-top-5 duration-200 shadow-xl">
                    <div className="px-4 py-4 flex flex-col items-center justify-center gap-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Dostępność serwisu
                        </p>
                        <WcagTools />
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;