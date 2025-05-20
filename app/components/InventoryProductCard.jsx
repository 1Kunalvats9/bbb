"use client"
import { Edit, Trash } from 'lucide-react';
import React, { useState } from 'react';
import { useCart } from '@/context/cartContext';


const InventoryProductCard = ({ itemName, availableQuantity, price }) => {
    const [quantityInput, setQuantityInput] = useState("1");
    const { setCartItems } = useCart();

    const handleAddToCart = () => {
        const quantity = parseInt(quantityInput, 10); 

        if (isNaN(quantity) || quantity <= 0 || quantity > availableQuantity) {
            alert(`Please enter a valid quantity between 1 and ${availableQuantity}.`);
            return;
        }

        setCartItems(prevItems => {
            const existingItemIndex = prevItems.findIndex(item => item.itemName === itemName);

            if (existingItemIndex > -1) {
                const updatedItems = [...prevItems];
                updatedItems[existingItemIndex].quantity += quantity;
                return updatedItems;
            } else {
                return [...prevItems, { itemName, quantity, price }];
            }
        });
        setQuantityInput("1"); 
    };

    const handleQuantityInputChange = (e) => {
        const value = e.target.value;
        // Allow empty string or string representation of numbers for user input flexibility
        if (value === "" || /^\d+$/.test(value)) {
            setQuantityInput(value);
        }
        // You could add more sophisticated validation here if needed,
        // but the main validation happens on `handleAddToCart`.
    };

    const handleBlurOrEnter = (e) => {
        if (e.type === 'blur' || e.key === 'Enter') {
            let value = parseInt(quantityInput, 10);
            if (isNaN(value) || value < 1) {
                value = 1; 
            } else if (value > availableQuantity) {
                value = availableQuantity; 
            }
            setQuantityInput(String(value)); 
        }
    };

    return (
        <div className="flex items-start justify-between p-4 rounded-lg bg-white shadow-md">
            <div className='flex flex-col'>
                <h3 className="text-lg font-semibold text-gray-800">{itemName}</h3>
                <div className="text-gray-600">
                    Available: <span className="font-medium text-blue-600">{availableQuantity}</span>
                </div>
                <div className="text-xl font-bold text-green-600">
                    ₹{price.toFixed(2)}
                </div>
            </div>

            <div className='flex items-center gap-2'>
                <input
                    type="text" 
                    value={quantityInput}
                    onChange={handleQuantityInputChange}
                    onBlur={handleBlurOrEnter} 
                    onKeyPress={(e) => { 
                        if (e.key === 'Enter') {
                            handleBlurOrEnter(e);
                        }
                    }}
                    className="w-20 p-2 border text-black placeholder:text-gray-400 border-gray-300 rounded-md text-center"
                    placeholder="Qty"
                />
                <button
                    onClick={handleAddToCart}
                    className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                    Add to Cart
                </button>
                <Edit color='#000'/>
                <Trash color='red' />
            </div>
        </div>
    );
};

export default InventoryProductCard;