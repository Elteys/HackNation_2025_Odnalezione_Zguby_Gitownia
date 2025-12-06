import React from 'react';
import { motion } from 'framer-motion';

const PageTransition = ({ children }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.98 }} // Start: lekko przesunięty i zmniejszony
            animate={{ opacity: 1, x: 0, scale: 1 }}     // Koniec: normalny
            exit={{ opacity: 0, x: -20, scale: 0.98 }}   // Wyjście: przesunięty w drugą stronę
            transition={{ duration: 0.4, ease: "easeOut" }} // Płynne hamowanie
            className="w-full"
        >
            {children}
        </motion.div>
    );
};

export default PageTransition;