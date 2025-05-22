'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Barcode, Trash, PlusCircle, MinusCircle } from 'lucide-react';
import { useInventory } from '@/context/inventoryContext'; // Still useful for general inventory awareness
import { useCart } from '@/context/cartContext'; // This is crucial for managing the cart
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

// Debounce Utility Function (kept for completeness)
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

// --- Invoice Component ---
// This component is responsible for the layout and content of the printed bill.
// It uses React.forwardRef to allow the parent component (BarcodeScannerCartPage)
// to attach a ref to it, useful if you need to render it on the main page or debug.
const Invoice = React.forwardRef(({ cartItems, customerName, customerPhone, totalAmount, invoiceDateTime }, ref) => {
    // Use the provided invoiceDateTime (captured at checkout) to ensure consistency.
    const date = invoiceDateTime ? new Date(invoiceDateTime) : new Date();

    // Format date and time using a specific locale for consistency.
    // 'en-IN' ensures DD/MM/YYYY and 24-hour time for India.
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
                <p className="font-semibold print:text-xs">Customer: {customerName || 'N/A'}</p>
                <p className="font-semibold print:text-xs">Phone: {customerPhone || 'N/A'}</p>
                <p className="font-semibold print:text-xs">Date: {formattedDate}</p>
                <p className="font-semibold print:text-xs">Time: {formattedTime}</p>
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
    const { inventoryItems } = useInventory();
    const { cartItems, setCartItems } = useCart();
    const [customerName, setCustomerName] = useState('');
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

                setCartItems(prevItems => [
                    ...prevItems,
                    {
                        itemName: product.itemName,
                        price: product.discountedPrice || product.originalPrice,
                        quantity: 1,
                        barcode: product.barcode,
                    }
                ]);
                toast.success(`Added ${product.itemName} to cart!`, { id: 'barcode-scan' });
            } else if (response.status === 404) {
                toast.error(`Product with barcode ${barcode} not found.`, { id: 'barcode-scan' });
            } else {
                toast.error(data.error || Error `looking up barcode: ${response.status}`, { id: 'barcode-scan' });
            }
        } catch (err) {
            toast.error(`Network error: ${err.message}`, { id: 'barcode-scan' });
        } finally {
            toast.dismiss('barcode-scan');
            setScannedBarcode('');
            barcodeInputRef.current?.focus();
        }
    }, [setCartItems, cartItems]);

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

        // Capture the exact timestamp at the moment of checkout
        const orderDateISO = new Date().toISOString();

        const orderData = {
            customer: {
                name: customerName.trim(),
                phone: customerPhone.trim(),
            },
            items: cartItems.map(item => ({
                productName: item.itemName,
                quantity: parseInt(item.quantity),
                unitPrice: parseFloat(item.price), // Use parseFloat for prices
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

                // Set the captured timestamp to be used by the Invoice component for printing
                setCurrentInvoiceDateTime(orderDateISO);

                // Delay printing slightly to allow state updates and toast to appear
                setTimeout(() => {
                    handlePrintBill(); // Trigger the print function
                    setCartItems([]); // Clear cart after successful checkout and print attempt
                    setCustomerName(''); // Clear customer details
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

        // Generate the invoice HTML dynamically
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
                        <p class="font-bold text-sm">Customer: ${customerName || 'N/A'}</p>
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

        // Open a new window
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error("Pop-up blocked! Please allow pop-ups for this site to print the bill.", { id: 'print-bill', duration: 5000 });
            setIsPrinting(false);
            return;
        }

        // Write the generated HTML to the new window
        printWindow.document.write(invoiceHtml);
        printWindow.document.close(); // Close the document to ensure content is rendered

        // Focus the new window and trigger print
        printWindow.focus();
        printWindow.print();

        // Optional: Close the print window after print dialog is initiated
        // Note: window.close() might not work in all browsers due to security policies.
        // It's often better to let the user close it.
        // printWindow.onafterprint = function() { printWindow.close(); };

        toast.success('Bill prepared. Please use your browser\'s print dialog.', { id: 'print-bill', duration: 5000 });

        // Clean up the printing state after a short delay
        setTimeout(() => {
            setIsPrinting(false);
        }, 1000); // Give a second for the print dialog to appear
    }, [cartItems, customerName, customerPhone, calculateTotal, currentInvoiceDateTime]);


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
                        <div className="flex items-center gap-4">
                            <input
                                ref={barcodeInputRef}
                                type="text"
                                placeholder="Scan barcode here..."
                                value={scannedBarcode}
                                onChange={(e) => {
                                    setScannedBarcode(e.target.value);
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
                    </div>

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
                            disabled={loadingCheckout || cartItems.length === 0 || isPrinting}
                            className={`w-full py-3 px-4 rounded-md font-bold text-lg focus:outline-none focus:ring-2 focus:ring-opacity-50
                                ${loadingCheckout || cartItems.length === 0 || isPrinting
                                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500'
                                }`}
                        >
                            {loadingCheckout ? 'Processing...' : 'Proceed to Checkout'}
                        </button>

                        {/* Print Bill Button - Visible only if there are items in the cart */}
                        {cartItems.length > 0 && (
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
                        )}

                        {/* This is a placeholder for potential hidden print content.
                            With the current window.open approach, it's not strictly necessary,
                            but it's good practice for other print methods. */}
                        <div style={{ display: 'none' }} ref={printAreaRef}>
                            {/* Invoice component content could be rendered here if not building HTML string */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BarcodeScannerCartPage;