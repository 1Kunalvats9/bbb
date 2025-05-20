"use client";
import React, { useState, createContext, useContext, useEffect } from 'react';

export const InventoryContext = createContext({
    inventoryItems: [],
    setInventoryItems: () => {},
});

const InventoryProvider = ({ children }) => {
    const [inventoryItems, setInventoryItems] = useState(() => {
        if (typeof window !== 'undefined') {
            const storedInventory = localStorage.getItem('inventoryItems');
            try {
                return storedInventory ? JSON.parse(storedInventory) : [];
            } catch (error) {
                console.error("Error parsing inventory data from localStorage:", error);
                return [];
            }
        }
        return [];
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('inventoryItems', JSON.stringify(inventoryItems));
        }
    }, [inventoryItems]);

    const contextValue = React.useMemo(() => ({
        inventoryItems,
        setInventoryItems,
    }), [inventoryItems, setInventoryItems]);

    return (
        <InventoryContext.Provider value={contextValue}>
            {children}
        </InventoryContext.Provider>
    );
};

export default InventoryProvider;

export const useInventory = () => {
    return useContext(InventoryContext);
};