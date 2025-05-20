// CartContext.js
"use client"
import React, { useState, createContext, useContext, useEffect } from 'react';

export const CartContext = createContext({
    cartItems: [],
    setCartItems: () => {},
});

const CartProvider = ({ children }) => {
    // Initialize cartItems with an empty array.
    // This value is consistent on both server and client during the initial render.
    const [cartItems, setCartItems] = useState([]);

    useEffect(() => {
        // This code only runs on the client-side after initial render (hydration).
        if (typeof window !== 'undefined') {
            const storedCart = localStorage.getItem('cartItems');
            try {
                if (storedCart) {
                    setCartItems(JSON.parse(storedCart));
                }
            } catch (error) {
                console.error("Error parsing cart data from localStorage:", error);
                // Optionally clear corrupted data or handle gracefully
                localStorage.removeItem('cartItems');
            }
        }
    }, []); // Empty dependency array means this runs once after the initial render.

    // This useEffect is correct for saving to localStorage on every change
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
        }
    }, [cartItems]);

    const contextValue = React.useMemo(() => ({
        cartItems,
        setCartItems,
    }), [cartItems, setCartItems]);

    return (
        <CartContext.Provider value={contextValue}>
            {children}
        </CartContext.Provider>
    );
};

export default CartProvider;

export const useCart = () => {
    return useContext(CartContext);
};