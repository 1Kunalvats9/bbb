"use client";
import React, { useState, createContext, useContext, useEffect, useCallback } from 'react';

// Define the shape of the InventoryContext
export const InventoryContext = createContext({
    inventoryItems: [],
    setInventoryItems: () => {},
    updateInventoryItem: () => {}, // New function to update a specific item
});

const InventoryProvider = ({ children }) => {
    // Initialize inventoryItems state from localStorage on component mount.
    // This ensures data persistence across browser sessions.
    const [inventoryItems, setInventoryItems] = useState(() => {
        if (typeof window !== 'undefined') {
            const storedInventory = localStorage.getItem('inventoryItems');
            try {
                // Attempt to parse stored JSON data. Handle potential parsing errors.
                return storedInventory ? JSON.parse(storedInventory) : [];
            } catch (error) {
                console.error("Error parsing inventory data from localStorage:", error);
                return []; // Return empty array on error to prevent app crash
            }
        }
        return []; // Default to empty array if window is not defined (e.g., server-side rendering)
    });

    // Effect to persist inventory items to localStorage whenever the inventoryItems state changes.
    // This keeps the localStorage in sync with the application's state.
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('inventoryItems', JSON.stringify(inventoryItems));
        }
    }, [inventoryItems]); // Dependency array ensures this runs only when inventoryItems changes

    // useCallback memoizes the updateInventoryItem function to prevent unnecessary re-renders
    // of child components that depend on this function.
    const updateInventoryItem = useCallback((itemId, updatedFields) => {
        setInventoryItems(prevItems => {
            // Map over previous items to find and update the specific item by its _id.
            // Use spread operator to merge existing item data with updatedFields.
            const updatedItems = prevItems.map(item =>
                item._id === itemId ? { ...item, ...updatedFields } : item
            );
            return updatedItems;
        });
    }, []); // Empty dependency array means this function is created once

    // Memoize the context value to prevent unnecessary re-renders of consumers.
    // Only re-create the context value if inventoryItems, setInventoryItems, or updateInventoryItem change.
    const contextValue = React.useMemo(() => ({
        inventoryItems,
        setInventoryItems,
        updateInventoryItem, // Include the new update function in the context value
    }), [inventoryItems, setInventoryItems, updateInventoryItem]);

    return (
        <InventoryContext.Provider value={contextValue}>
            {children}
        </InventoryContext.Provider>
    );
};

export default InventoryProvider;

// Custom hook to easily consume the InventoryContext in functional components.
export const useInventory = () => {
    return useContext(InventoryContext);
};
