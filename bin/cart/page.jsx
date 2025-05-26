"use client"
import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/cartContext';
import { ArrowLeft, Trash } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../../app/components/Navbar';

const CartPage = () => {
    const { cartItems, setCartItems } = useCart();
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkoutMessage, setCheckoutMessage] = useState('');

    useEffect(() => {
        setCheckoutMessage('');
    }, [cartItems]);

    const handleQuantityChange = (itemName, newQuantity) => {
        const parsedQuantity = parseInt(newQuantity, 10);

        setCartItems(prevItems => {
            return prevItems.map(item => {
                if (item.itemName === itemName) {
                    const validatedQuantity = isNaN(parsedQuantity) || parsedQuantity < 1
                        ? 1
                        : parsedQuantity;
                    return { ...item, quantity: validatedQuantity };
                }
                return item;
            });
        });
    };

    const handleRemoveItem = (itemName) => {
        setCartItems(prevItems => prevItems.filter(item => item.itemName !== itemName));
    };

    const calculateTotal = () => {
        return cartItems.reduce((total, item) => total + (Number(item.price) * Number(item.quantity)), 0);
    };

    const handleCheckout = async () => {
        if (cartItems.length === 0) {
            setCheckoutMessage("Your cart is empty. Please add items before checking out.");
            return;
        }

        if (!customerName.trim() || !customerPhone.trim()) {
            setCheckoutMessage("Please enter your name and phone number.");
            return;
        }
        
        if (!/^\d{10}$/.test(customerPhone.trim())) {
            setCheckoutMessage("Please enter a valid 10-digit phone number.");
            return;
        }

        setLoading(true);
        setCheckoutMessage('');

        const orderData = {
            customer: {
                name: customerName.trim(),
                phone: customerPhone.trim(),
            },
            items: cartItems.map(item => ({
                productName: item.itemName,
                quantity: parseInt(item.quantity),
                unitPrice: parseInt(item.price),
            })),
            totalAmount: calculateTotal(),
            orderDate: new Date().toISOString(),
        };

        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });

            if (response.ok) {
                const result = await response.json();
                setCheckoutMessage(`Order placed successfully! Order ID: ${result.orderId || 'N/A'}`);
                setCartItems([]); // Clear cart after successful checkout
                setCustomerName(''); // Clear customer details
                setCustomerPhone('');
                toast.success('Checkout was successfull')
            } else {
                const errorData = await response.json();
                console.log(errorData)
                setCheckoutMessage(`Checkout failed: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error during checkout:', error);
            setCheckoutMessage('An error occurred during checkout. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    const handleGoBack = () => {
        window.history.back();
    };

    return (
        <div className="min-h-screen p-4 relative bg-white">
            <button
                onClick={handleGoBack}
                className="absolute top-4 left-4 text-[#615FFF] border border-[#615FFF] px-3 py-2 rounded-lg hover:text-white hover:bg-[#615FFF] duration-150 cursor-pointer flex items-center z-10"
            >
                <ArrowLeft className="mr-2" /> Back
            </button>
            <div className="container mx-auto px-6 rounded-lg  shadow-xl mt-10">
                <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">Your Shopping Cart</h1>

                {cartItems.length === 0 ? (
                    <p className="text-center text-gray-600 text-lg">Your cart is empty. Start adding some products!</p>
                ) : (
                    <div className="space-y-4 mb-8">
                        {cartItems.map(item => (
                            <div key={item.itemName} className="flex items-center justify-between p-4 border-b border-gray-200">
                                <div className="flex-grow">
                                    <h3 className="text-lg font-semibold text-gray-800">{item.itemName}</h3>
                                    <p className="text-gray-600">₹{(item.price || 0).toFixed(2)} per item</p>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => handleQuantityChange(item.itemName, e.target.value)}
                                        className="w-20 p-2 text-black border border-gray-300 rounded-md text-center"
                                    />
                                    <p className="text-lg font-bold text-green-600">₹{(Number(item.price) * Number(item.quantity)).toFixed(2)}</p>
                                    <button
                                        onClick={() => handleRemoveItem(item.itemName)}
                                        className="p-2 text-red-600 cursor-pointer hover:text-red-800 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
                                    >
                                        <Trash size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {cartItems.length > 0 && (
                    <div className="text-right text-2xl font-bold text-gray-800 mb-8 pt-4 border-t border-gray-300">
                        Total: ₹{calculateTotal().toFixed(2)}
                    </div>
                )}

                <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Customer Information</h2>
                    <div className="mb-4">
                        <label htmlFor="customerName" className="block text-gray-700 text-sm font-bold mb-2">
                            Name:
                        </label>
                        <input
                            type="text"
                            id="customerName"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Enter your name"
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="customerPhone" className="block text-gray-700 text-sm font-bold mb-2">
                            Phone Number:
                        </label>
                        <input
                            type="tel" 
                            id="customerPhone"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            placeholder="e.g., 9876543210"
                            maxLength="10" // Optional: enforce 10 digits
                        />
                    </div>

                    {checkoutMessage && (
                        <p className={`mb-4 text-center ${checkoutMessage.includes("successfully") ? 'text-green-600' : 'text-red-600'} font-semibold`}>
                            {checkoutMessage}
                        </p>
                    )}

                    <button
                        onClick={handleCheckout}
                        disabled={loading || cartItems.length === 0}
                        className={`w-full py-3 px-4 rounded-md font-bold text-lg focus:outline-none focus:ring-2 focus:ring-opacity-50
                            ${loading || cartItems.length === 0
                                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500'
                            }`}
                    >
                        {loading ? 'Processing...' : 'Proceed to Checkout'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CartPage;