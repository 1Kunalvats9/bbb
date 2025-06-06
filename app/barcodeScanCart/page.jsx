'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Barcode, Trash, PlusCircle, MinusCircle, Search } from 'lucide-react'; // Added Search icon
import { useInventory } from '@/context/inventoryContext';
import { useCart } from '@/context/cartContext';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

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

{/*removed customerName from function */ }

const Invoice = React.forwardRef(({ cartItems, customerPhone, totalAmount, invoiceDateTime }, ref) => {
    const date = invoiceDateTime ? new Date(invoiceDateTime) : new Date();
    const formattedDate = date.toLocaleDateString('en-IN');
    const formattedTime = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

    return (
        <div ref={ref} className="p-8 print:p-4 print:text-sm print:font-sans" style={{ width: '100mm', minHeight: 'auto', margin: '0 auto', fontFamily: 'monospace' }}>
            <div className="text-center mb-6 print:mb-2">
                <h1 className="text-2xl font-bold print:text-lg">Balaji Bachat Bazar</h1>
                <p className="text-md print:text-xs">Contact: 9982171806</p>
                <p className="text-md print:text-xs">Invoice</p>
            </div>

            <div className="mb-4 border-b pb-2 print:mb-1 print:pb-1 print:border-b print:border-dashed">
                {/* <p className="font-semibold print:text-xs">Customer: {customerName || 'N/A'}</p> */}
                <p className="font-semibold print:text-xs">Phone: {customerPhone || 'N/A'}</p>
                <p className="font-semibold print:text-xs">Date: {formattedDate}</p>
                <p className="font-semibold print:text-xs">Time: ${formattedTime}</p>
            </div>

            <table className="w-full text-left border-collapse mb-6 print:mb-2">
                <thead>
                    <tr className="border-b border-gray-400 print:border-b print:border-dashed">
                        <th className="py-1 pr-2 font-bold print:text-xs">Item</th>
                        <th className="py-1 px-2 font-bold text-right print:text-xs">Qty</th>
                        <th className="py-1 pl-2 font-bold text-right print:text-xs">Price</th>
                        <th className="py-1 pl-2 font-bold text-right print:text-xs">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {cartItems.map(item => (
                        <tr key={item.barcode}>
                            <td className="py-1 pr-2 print:text-xs">{item.itemName}</td>
                            <td className="py-1 px-2 text-right print:text-xs">{item.quantity}</td>
                            <td className="py-1 pl-2 text-right print:text-xs">₹{Number(item.price).toFixed(2)}</td>
                            <td className="py-1 pl-2 text-right print:text-xs">₹{(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="text-right border-t pt-2 print:border-t print:border-dashed print:pt-1">
                <p className="text-xl font-bold print:text-sm">Total: ₹{totalAmount.toFixed(2)}</p>
            </div>

            <div className="text-center mt-6 print:mt-2">
                <p className="print:text-xs">Thank you for your purchase!</p>
            </div>
        </div>
    );
});


const BarcodeScannerCartPage = () => {
    const [scannedBarcode, setScannedBarcode] = useState('');
    const [productSearchTerm, setProductSearchTerm] = useState(''); // New state for search term
    const [productSuggestions, setProductSuggestions] = useState([]); // New state for search suggestions
    const [isSearching, setIsSearching] = useState(false); // New state for search loading
    const { inventoryItems } = useInventory(); // Assuming inventoryItems might be used for client-side filtering if API not ready
    const { cartItems, setCartItems } = useCart();
    // const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [loadingCheckout, setLoadingCheckout] = useState(false);
    const [checkoutMessage, setCheckoutMessage] = useState('');
    const [currentInvoiceDateTime, setCurrentInvoiceDateTime] = useState(''); // State for invoice date/time
    const [isPrinting, setIsPrinting] = useState(false); // New state to manage printing status

    const barcodeInputRef = useRef(null);
    const router = useRouter();
    const printAreaRef = useRef(null); // Ref for the temporary hidden print area

    useEffect(() => {
        if (barcodeInputRef.current) {
            barcodeInputRef.current.focus();
        }
    }, []);

    useEffect(() => {
        setCheckoutMessage('');
    }, [cartItems]);

    // Debounced search function
    const performSearch = useCallback(debounce(async (term) => {
        if (term.length < 2) { // Only search if term is at least 2 characters
            setProductSuggestions([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        try {
            // Adjust this API route to your backend for product name search
            const response = await fetch(`/api/searchProductByName?name=${encodeURIComponent(term)}`);
            const data = await response.json();

            if (response.ok) {
                setProductSuggestions(data.products.slice(0, 6)); // Limit to top 6 suggestions
            } else {
                console.error("Failed to fetch product suggestions:", data.error);
                setProductSuggestions([]);
            }
        } catch (error) {
            console.error("Network error fetching product suggestions:", error);
            setProductSuggestions([]);
        } finally {
            setIsSearching(false);
        }
    }, 300), []); // Debounce by 300ms

    useEffect(() => {
        performSearch(productSearchTerm);
    }, [productSearchTerm, performSearch]);

    // Function to add item to cart (used by both barcode and name search)
    const addItemToCart = useCallback((product) => {
        const existingCartItem = cartItems.find(item => item.barcode === product.barcode);

        if (existingCartItem) {
            setCartItems(prevItems => {
                return prevItems.map(item =>
                    item.barcode === product.barcode
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            });
            toast.success(`Increased quantity of ${existingCartItem.itemName} to ${existingCartItem.quantity + 1}`);
        } else {
            setCartItems(prevItems => [
                ...prevItems,
                {
                    itemName: product.itemName,
                    price: product.discountedPrice || product.originalPrice,
                    quantity: 1,
                    barcode: product.barcode,
                }
            ]);
            toast.success(`Added ${product.itemName} to cart!`);
        }
        setProductSearchTerm(''); // Clear search term after adding
        setProductSuggestions([]); // Clear suggestions
        barcodeInputRef.current?.focus(); // Keep focus on barcode scanner
    }, [cartItems, setCartItems]);


    const lookupProductAndAddToCart = useCallback(async (barcode) => {
        if (!barcode) {
            toast.dismiss('barcode-scan');
            return;
        }

        const barcodeNumber = parseInt(barcode, 10);
        if (isNaN(barcodeNumber)) {
            toast.error('Invalid barcode format.', { id: 'barcode-scan' });
            setScannedBarcode('');
            barcodeInputRef.current?.focus();
            return;
        }

        const existingCartItem = cartItems.find(item => item.barcode === barcodeNumber);

        if (existingCartItem) {
            setCartItems(prevItems => {
                return prevItems.map(item =>
                    item.barcode === barcodeNumber
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            });
            toast.success(`Increased quantity of ${existingCartItem.itemName} to ${existingCartItem.quantity + 1}`, { id: 'barcode-scan' });
            setScannedBarcode('');
            barcodeInputRef.current?.focus();
            return;
        }

        toast.loading(`Searching for barcode: ${barcode}...`, { id: 'barcode-scan' });
        try {
            const response = await fetch('/api/scanBarcode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ barcode: barcodeNumber }),
            });
            const data = await response.json();

            if (response.ok) {
                const product = data.product;
                addItemToCart(product); // Use the common function
            } else if (response.status === 404) {
                toast.error(`Product with barcode ${barcode} not found.`, { id: 'barcode-scan' });
            } else {
                toast.error(data.error || `Error looking up barcode: ${response.status}`, { id: 'barcode-scan' });
            }
        } catch (err) {
            toast.error(`Network error: ${err.message}`, { id: 'barcode-scan' });
        } finally {
            toast.dismiss('barcode-scan');
            setScannedBarcode('');
            barcodeInputRef.current?.focus();
        }
    }, [setCartItems, cartItems, addItemToCart]); // Added addItemToCart to dependency array

    const handleQuantityChange = (barcode, newQuantity) => {
        const parsedQuantity = parseFloat(newQuantity); // Changed to parseFloat

        setCartItems(prevItems => {
            return prevItems.map(item => {
                if (item.barcode === barcode) {
                    // No minimum value constraint, just check if it's a valid number
                    const validatedQuantity = isNaN(parsedQuantity) ? 0 : parsedQuantity; // Can be 0 or less
                    return { ...item, quantity: validatedQuantity };
                }
                return item;
            });
        });
    };

    const handleConvertToKg = (barcode) => {
        setCartItems(prevItems => {
            return prevItems.map(item => {
                if (item.barcode === barcode) {
                    const convertedQuantity = parseFloat(item.quantity) / 1000;
                    toast.success('converted succesfully');
                    return { ...item, quantity: convertedQuantity };
                }
                return item;
            });
        });
    };

    const handleRemoveItem = (barcode) => {
        setCartItems(prevItems => prevItems.filter(item => item.barcode !== barcode));
    };

    const calculateTotal = () => {
        return cartItems.reduce((total, item) => total + (Number(item.price) * parseFloat(item.quantity)), 0);
    };

    const handleCheckout = async () => {
        if (cartItems.length === 0) {
            setCheckoutMessage("Your cart is empty. Please add items before checking out.");
            return;
        }

        if (!customerPhone.trim()) { // if*!cutomerName||cutsomerphone
            setCheckoutMessage("Please enter customer name and phone number.");
            return;
        }

        if (!/^\d{10}$/.test(customerPhone.trim())) {
            setCheckoutMessage("Please enter a valid 10-digit phone number.");
            return;
        }

        setLoadingCheckout(true);
        setCheckoutMessage('');

        // Capture the exact timestamp at the moment of checkout
        const orderDateISO = new Date().toISOString();

        const orderData = {
            customer: {
                // name: customerName.trim(),
                phone: customerPhone.trim(),
            },
            items: cartItems.map(item => ({
                productName: item.itemName,
                quantity: parseFloat(item.quantity), // Changed to parseFloat
                unitPrice: parseFloat(item.price),
                barcode: item.barcode,
            })),
            totalAmount: calculateTotal(),
            orderDate: orderDateISO, // Use the captured ISO string for the backend
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
                toast.success('Checkout was successful!');

                setCurrentInvoiceDateTime(orderDateISO);

                // Delay printing slightly to allow state updates and toast to appear
                setTimeout(() => {
                    handlePrintBill(); // Trigger the print function
                    setCartItems([]); // Clear cart after successful checkout and print attempt
                    // setCustomerName(''); // Clear customer details
                    setCustomerPhone('');
                    setCurrentInvoiceDateTime(''); // Clear invoice date after print/cart reset
                }, 500);

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

    const handlePrintBill = useCallback(() => {
        if (cartItems.length === 0) {
            toast.error("Cart is empty. Nothing to print!");
            return;
        }

        setIsPrinting(true);
        toast.loading('Preparing bill for printing...', { id: 'print-bill' });

        const date = new Date(currentInvoiceDateTime || new Date());
        const formattedDate = date.toLocaleDateString('en-IN');
        const formattedTime = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        const totalAmount = calculateTotal().toFixed(2);

        let itemsHtml = cartItems.map(item => `
            <tr>
                <td style="padding: 2px 4px; font-size: 0.75em;">${item.itemName}</td>
                <td style="padding: 2px 4px; text-align: right; font-size: 0.75em;">${item.quantity}</td>
                <td style="padding: 2px 4px; text-align: right; font-size: 0.75em;">₹${Number(item.price).toFixed(2)}</td>
                <td style="padding: 2px 4px; text-align: right; font-size: 0.75em;">₹${(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
            </tr>
        `).join('');

        const invoiceHtml = `
            <html>
            <head>
                <title>Customer Invoice - Balaji Bachat Bazar</title>
                <style>
                    @page {
                        size: 80mm auto; /* Common thermal printer width, height auto */
                        margin: 0;
                    }
                    body {
                        font-family: monospace; /* Monospace font for receipt look */
                        margin: 0;
                        padding: 10px; /* Padding for the entire receipt */
                        font-size: 12px;
                        color: #000;
                    }
                    .container {
                        width: 100%;
                        max-width: 80mm; /* Ensure it doesn't exceed thermal width */
                        margin: 0 auto;
                    }
                    .text-center { text-align: center; }
                    .mb-6 { margin-bottom: 12px; }
                    .mb-2 { margin-bottom: 4px; }
                    .mt-6 { margin-top: 12px; }
                    .mt-2 { margin-top: 4px; }
                    .border-b { border-bottom: 1px solid #ccc; }
                    .border-t { border-top: 1px solid #ccc; }
                    .pb-2 { padding-bottom: 4px; }
                    .pt-2 { padding-top: 4px; }
                    .font-bold { font-weight: bold; }
                    .text-2xl { font-size: 1.5em; } /* Approx 24px */
                    .text-lg { font-size: 1.125em; } /* Approx 18px */
                    .text-md { font-size: 1em; } /* Approx 16px */
                    .text-sm { font-size: 0.875em; } /* Approx 14px */
                    .text-xs { font-size: 0.75em; } /* Approx 12px */
                    .flex { display: flex; }
                    .justify-between { justify-content: space-between; }
                    .items-center { align-items: center; }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 12px;
                    }
                    th, td {
                        padding: 2px 0; /* Minimal padding for thermal print */
                        text-align: left;
                    }
                    th {
                        font-weight: bold;
                        border-bottom: 1px dashed #000;
                        padding-bottom: 4px;
                    }
                    .text-right { text-align: right; }
                    .border-dashed { border-style: dashed !important; } /* For specific dashed lines */
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="text-center mb-6">
                        <h1 class="text-2xl font-bold">Balaji Bachat Bazar</h1>
                        <p class="text-md">Contact: 9982171806</p>
                        <p class="text-md">Invoice</p>
                    </div>

                    <div class="mb-4 border-b pb-2 border-dashed">

                        <p class="font-bold text-sm">Phone: ${customerPhone || 'N/A'}</p>
                        <p class="font-bold text-sm">Date: ${formattedDate}</p>
                        <p class="font-bold text-sm">Time: ${formattedTime}</p>
                    </div>

                    <table>
                        <thead>
                            <tr class="border-b border-dashed">
                                <th style="font-size: 0.8em; padding-right: 4px;">Item</th>
                                <th style="text-align: right; font-size: 0.8em; padding-left: 4px; padding-right: 4px;">Qty</th>
                                <th style="text-align: right; font-size: 0.8em; padding-left: 4px; padding-right: 4px;">Price</th>
                                <th style="text-align: right; font-size: 0.8em; padding-left: 4px;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>

                    <div class="text-right border-t pt-2 border-dashed">
                        <p class="text-xl font-bold">Total: ₹${totalAmount}</p>
                    </div>

                    <div class="text-center mt-6">
                        <p class="text-sm">Thank you for your purchase!</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error("Pop-up blocked! Please allow pop-ups for this site to print the bill.", { id: 'print-bill', duration: 5000 });
            setIsPrinting(false);
            return;
        }

        printWindow.document.write(invoiceHtml);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();

        toast.success('Bill prepared. Please use your browser\'s print dialog.', { id: 'print-bill', duration: 5000 });

        setTimeout(() => {
            setIsPrinting(false);
        }, 1000);
    }, [cartItems, customerPhone, calculateTotal, currentInvoiceDateTime]);

    {/**removed customerName */ }

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
                        {/* Barcode Scanner Input */}
                        <div className="flex items-center gap-4">
                            <input
                                ref={barcodeInputRef}
                                type="text"
                                placeholder="Scan barcode here..."
                                value={scannedBarcode}
                                onChange={(e) => {
                                    setScannedBarcode(e.target.value);
                                    // Optionally clear search term if user is scanning
                                    if (e.target.value) setProductSearchTerm('');
                                }}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        if (scannedBarcode.length > 0) {
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
                                        barcodeInputRef.current?.focus();
                                    }}
                                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* Search by Name Input */}
                        <div className="relative">
                            <div className="flex items-center gap-4">
                                <input
                                    type="text"
                                    placeholder="Search product by name..."
                                    value={productSearchTerm}
                                    onChange={(e) => {
                                        setProductSearchTerm(e.target.value);
                                        // Clear barcode input if user starts typing a name
                                        if (e.target.value) setScannedBarcode('');
                                    }}
                                    className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#615FFF]"
                                />
                                {isSearching && (
                                    <span className="text-gray-500 text-sm">Searching...</span>
                                )}
                                <Search className="text-gray-400" size={20} />
                            </div>

                            {/* Suggestions Dropdown */}
                            {productSearchTerm.length > 1 && productSuggestions.length > 0 && (
                                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {productSuggestions.map((product) => (
                                        <div
                                            key={product.barcode}
                                            className="p-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                                            onClick={() => addItemToCart(product)}
                                        >
                                            <p className="font-semibold text-gray-800">{product.itemName}</p>
                                            <p className="text-sm text-gray-600">Barcode: {product.barcode} - ₹{product.discountedPrice || product.originalPrice}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {productSearchTerm.length > 1 && !isSearching && productSuggestions.length === 0 && (
                                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-md shadow-lg p-3 text-center text-gray-500">
                                    No matching products found.
                                </div>
                            )}
                        </div>
                    </div>


                    <div className="mt-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Cart Items</h2>
                        {cartItems.length === 0 ? (
                            <p className="text-center text-gray-600">Your cart is empty. Scan or search for an item to begin!</p>
                        ) : (
                            <div className="space-y-3">
                                {cartItems.map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-gray-50">
                                        <div className="flex-grow">
                                            <h3 className="text-lg font-semibold text-gray-800">{item.itemName}</h3>
                                            <p className="text-gray-600 text-sm">Barcode: {item.barcode}</p>
                                            <p className="text-gray-600">₹{(item.price || 0).toFixed(2)} per item</p>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <button
                                                // Decrementing now potentially goes into negative numbers as per no minimum constraint
                                                onClick={() => handleQuantityChange(item.barcode, (parseFloat(item.quantity) - 1).toFixed(2))}
                                                className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                                                title="Decrease quantity"
                                            >
                                                <MinusCircle size={18} />
                                            </button>
                                            <input
                                                type="number" 
                                                step="any"   
                                                value={item.quantity}
                                                onChange={(e) => handleQuantityChange(item.barcode, e.target.value)}
                                                className="w-16 p-1 text-black border border-gray-300 rounded-md text-center"
                                            />
                                            <button
                                                onClick={() => handleQuantityChange(item.barcode, (parseFloat(item.quantity) + 1).toFixed(2))}
                                                className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                                                title="Increase quantity"
                                            >
                                                <PlusCircle size={18} />
                                            </button>
                                            {/* "To Kg" button */}
                                            <button 
                                                className='px-2 py-1 rounded-lg bg-gray-200 cursor-pointer hover:bg-gray-300 duration-150' 
                                                onClick={() => handleConvertToKg(item.barcode)}
                                            >
                                                → to kg
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

                    <div className="bg-gray-50 p-6 rounded-lg shadow-sm mt-8">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Customer Information</h2>
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
                            disabled={loadingCheckout || cartItems.length === 0 || isPrinting}
                            className={`w-full py-3 px-4 rounded-md font-bold text-lg focus:outline-none focus:ring-2 focus:ring-opacity-50
                                ${loadingCheckout || cartItems.length === 0 || isPrinting
                                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500'
                                }`}
                        >
                            {loadingCheckout ? 'Processing...' : 'Proceed to Checkout'}
                        </button>

                        {/* {cartItems.length > 0 && (
                            <button
                                onClick={handlePrintBill}
                                disabled={isPrinting}
                                className={`w-full mt-4 py-3 px-4 rounded-md font-bold text-lg focus:outline-none focus:ring-2 focus:ring-opacity-50
                                ${isPrinting
                                        ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                        : 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500'
                                    }`}
                            >
                                {isPrinting ? 'Preparing Print...' : 'Print Bill'}
                            </button>
                        )} */}

                        <div style={{ display: 'none' }} ref={printAreaRef}>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BarcodeScannerCartPage;