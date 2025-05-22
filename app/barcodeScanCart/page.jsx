'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Barcode, Trash, PlusCircle, MinusCircle } from 'lucide-react';
import { useInventory } from '@/context/inventoryContext'; // Still useful for general inventory awareness
import { useCart } from '@/context/cartContext'; // This is crucial for managing the cart
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

// Debounce Utility Function
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func.apply(null, args);
        }, delay);
    };
};

const BarcodeScannerCartPage = () => {
    const [scannedBarcode, setScannedBarcode] = useState('');
    const { inventoryItems } = useInventory(); // To lookup products locally if needed
    const { cartItems, setCartItems } = useCart();
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [loadingCheckout, setLoadingCheckout] = useState(false);
    const [checkoutMessage, setCheckoutMessage] = useState('');

    const barcodeInputRef = useRef(null);
    const router = useRouter(); // Initialize router for navigation

    useEffect(() => {
        if (barcodeInputRef.current) {
            barcodeInputRef.current.focus();
        }
    }, []);

    useEffect(() => {
        setCheckoutMessage(''); // Clear checkout message when cart items change
    }, [cartItems]);

    // --- Core Barcode Lookup and Add to Cart ---
    const lookupProductAndAddToCart = useCallback(async (barcode) => {
        if (!barcode) {
            toast.dismiss('barcode-scan');
            return;
        }

        const barcodeNumber = parseInt(barcode, 10);
        if (isNaN(barcodeNumber)) {
            toast.error('Invalid barcode format.', { id: 'barcode-scan' });
            setScannedBarcode(''); // Clear input on invalid format
            barcodeInputRef.current?.focus();
            return;
        }

        // Check if the product is already in the cart
        const existingCartItem = cartItems.find(item => item.barcode === barcodeNumber);

        if (existingCartItem) {
            setCartItems(prevItems => {
                return prevItems.map(item =>
                    item.barcode === barcodeNumber
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            });
            toast.success(`Increased quantity of ${existingCartItem.itemName} to ${existingCartItem.quantity + 1}!`, { id: 'barcode-scan' });
            setScannedBarcode(''); // Clear the input after processing
            barcodeInputRef.current?.focus(); // Re-focus for continuous scanning
            return; // Exit as item was already in cart and quantity updated
        }

        toast.loading(`Searching for barcode: ${barcode}...`, { id: 'barcode-scan' });
        try {
            const response = await fetch('/api/scanBarcode', { // Use your existing API endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ barcode: barcodeNumber }),
            });
            const data = await response.json();

            if (response.ok) {
                const product = data.product;

                // Add new item with quantity 1
                setCartItems(prevItems => [
                    ...prevItems,
                    {
                        itemName: product.itemName,
                        price: product.discountedPrice || product.originalPrice, // Use discounted if available
                        quantity: 1,
                        barcode: product.barcode,
                    }
                ]);
                toast.success(`Added ${product.itemName} to cart!`, { id: 'barcode-scan' });
            } else if (response.status === 404) {
                toast.error(`Product with barcode ${barcode} not found.`, { id: 'barcode-scan' });
            } else {
                toast.error(data.error || `Error looking up barcode: ${response.status}`, { id: 'barcode-scan' });
            }
        } catch (err) {
            toast.error(`Network error: ${err.message}`, { id: 'barcode-scan' });
        } finally {
            toast.dismiss('barcode-scan');
            setScannedBarcode(''); // Clear the input after processing
            barcodeInputRef.current?.focus(); // Re-focus for continuous scanning
        }
    }, [setCartItems, cartItems]); // Added cartItems to dependency array

    // Removed debouncedLookupAndAddToCart as it will now be triggered only on Enter key press

    const handleQuantityChange = (barcode, newQuantity) => {
        const parsedQuantity = parseInt(newQuantity, 10);

        setCartItems(prevItems => {
            return prevItems.map(item => {
                if (item.barcode === barcode) {
                    const validatedQuantity = isNaN(parsedQuantity) || parsedQuantity < 1
                        ? 1
                        : parsedQuantity;
                    return { ...item, quantity: validatedQuantity };
                }
                return item;
            });
        });
    };

    const handleRemoveItem = (barcode) => {
        setCartItems(prevItems => prevItems.filter(item => item.barcode !== barcode));
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
            setCheckoutMessage("Please enter customer name and phone number.");
            return;
        }

        if (!/^\d{10}$/.test(customerPhone.trim())) {
            setCheckoutMessage("Please enter a valid 10-digit phone number.");
            return;
        }

        setLoadingCheckout(true);
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
                barcode: item.barcode, // Include barcode for order history
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
                toast.success('Checkout was successful!');
            } else {
                const errorData = await response.json();
                console.error('Checkout error:', errorData);
                setCheckoutMessage(`Checkout failed: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error during checkout:', error);
            setCheckoutMessage('An error occurred during checkout. Please try again.');
        } finally {
            setLoadingCheckout(false);
        }
    };

    const handleGoBack = () => {
        router.back();
    };

    return (
        <div className="bg-white relative text-black w-full min-h-screen">
            <button
                onClick={handleGoBack}
                className="absolute top-4 left-4 text-[#615FFF] border border-[#615FFF] px-3 py-2 rounded-lg hover:text-white hover:bg-[#615FFF] duration-150 cursor-pointer flex items-center z-10"
            >
                <ArrowLeft className="mr-2" /> Back
            </button>

            <div className="flex flex-col items-center justify-start min-h-screen py-20">
                <div className="w-full max-w-2xl shadow-lg bg-white rounded-lg p-6">
                    <div className="mb-4">
                        <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
                            <Barcode className="mr-2 text-[#615FFF]" /> Barcode Scanner to Cart
                        </h1>
                        <p className="text-gray-500 text-sm">Scan items to add them directly to the cart.</p>
                    </div>

                    <div className="space-y-4 mb-6">
                        {/* Barcode Input Section */}
                        <div className="flex items-center gap-4">
                            <input
                                ref={barcodeInputRef}
                                type="text"
                                placeholder="Scan barcode here..."
                                value={scannedBarcode}
                                onChange={(e) => {
                                    // Only update the state on change
                                    setScannedBarcode(e.target.value);
                                }}
                                // Handle Enter key for manual input/testing or scanner input
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        if (scannedBarcode.length > 0) {
                                            // Call the lookup function directly on Enter
                                            lookupProductAndAddToCart(scannedBarcode);
                                        }
                                    }
                                }}
                                className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#615FFF]"
                            />
                            {scannedBarcode && (
                                <button
                                    onClick={() => {
                                        setScannedBarcode('');
                                        barcodeInputRef.current?.focus(); // Re-focus after clearing
                                    }}
                                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Cart Items Display */}
                    <div className="mt-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Cart Items</h2>
                        {cartItems.length === 0 ? (
                            <p className="text-center text-gray-600">Your cart is empty. Scan an item to begin!</p>
                        ) : (
                            <div className="space-y-3">
                                {cartItems.map(item => (
                                    <div key={item.barcode} className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-gray-50">
                                        <div className="flex-grow">
                                            <h3 className="text-lg font-semibold text-gray-800">{item.itemName}</h3>
                                            <p className="text-gray-600 text-sm">Barcode: {item.barcode}</p>
                                            <p className="text-gray-600">₹{(item.price || 0).toFixed(2)} per item</p>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <button
                                                onClick={() => handleQuantityChange(item.barcode, item.quantity - 1)}
                                                disabled={item.quantity <= 1}
                                                className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                                                title="Decrease quantity"
                                            >
                                                <MinusCircle size={18} />
                                            </button>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => handleQuantityChange(item.barcode, e.target.value)}
                                                className="w-16 p-1 text-black border border-gray-300 rounded-md text-center"
                                            />
                                            <button
                                                onClick={() => handleQuantityChange(item.barcode, item.quantity + 1)}
                                                className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                                                title="Increase quantity"
                                            >
                                                <PlusCircle size={18} />
                                            </button>
                                            <p className="text-lg font-bold text-green-600 min-w-[70px] text-right">₹{(Number(item.price) * Number(item.quantity)).toFixed(2)}</p>
                                            <button
                                                onClick={() => handleRemoveItem(item.barcode)}
                                                className="p-2 text-red-600 cursor-pointer hover:text-red-800 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
                                                title="Remove item"
                                            >
                                                <Trash size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {cartItems.length > 0 && (
                            <div className="text-right text-2xl font-bold text-gray-800 mt-6 pt-4 border-t border-gray-300">
                                Total: ₹{calculateTotal().toFixed(2)}
                            </div>
                        )}
                    </div>

                    {/* Checkout Section */}
                    <div className="bg-gray-50 p-6 rounded-lg shadow-sm mt-8">
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
                                placeholder="Enter customer name"
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
                                maxLength="10"
                            />
                        </div>

                        {checkoutMessage && (
                            <p className={`mb-4 text-center ${checkoutMessage.includes("successfully") ? 'text-green-600' : 'text-red-600'} font-semibold`}>
                                {checkoutMessage}
                            </p>
                        )}

                        <button
                            onClick={handleCheckout}
                            disabled={loadingCheckout || cartItems.length === 0}
                            className={`w-full py-3 px-4 rounded-md font-bold text-lg focus:outline-none focus:ring-2 focus:ring-opacity-50
                                ${loadingCheckout || cartItems.length === 0
                                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500'
                                }`}
                        >
                            {loadingCheckout ? 'Processing...' : 'Proceed to Checkout'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BarcodeScannerCartPage;
