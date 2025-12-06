import React, { createContext, useState, useContext } from 'react';

const FormContext = createContext();

export const FormProvider = ({ children }) => {
    // Główny stan aplikacji - tu trzymamy wszystkie dane z AI
    const [formData, setFormData] = useState({
        kategoria: '',
        podkategoria: '',
        nazwa: '',
        opis: '',      // PL
        opisEN: '',    // EN
        opisUA: '',    // UA
        cechy: {
            kolor: '',
            marka: '',
            stan: ''
        },
        miejsce: '',
        data: new Date().toISOString().split('T')[0],
        lat: null,
        lng: null
    });

    const [imagePreview, setImagePreview] = useState(null);

    // Funkcja do aktualizacji stanu (pojedyncze pole lub cały obiekt)
    const updateData = (field, value) => {
        if (typeof field === 'object') {
            setFormData(prev => ({ ...prev, ...field }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    return (
        <FormContext.Provider value={{ formData, updateData, imagePreview, setImagePreview }}>
            {children}
        </FormContext.Provider>
    );
};

export const useFormContext = () => useContext(FormContext);