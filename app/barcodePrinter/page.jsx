'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Search, Printer, Tag } from 'lucide-react';
import { useInventory } from '@/context/inventoryContext'; // Assuming this context exists
import searchInventoryItems from '@/lib/searchInventoryItems'; // Assuming this utility exists
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

// Debounce Utility Function - ADDED THIS SECTION
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

const BarcodeLabelPrinterPage = () => {
    const [scannedBarcode, setScannedBarcode] = useState(''); // State for the barcode input
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [labelQuantity, setLabelQuantity] = useState(1);
    const [error, setError] = useState('');
    const [isPrinting, setIsPrinting] = useState(false);

    const { inventoryItems } = useInventory(); // Get inventory items from context
    const router = useRouter();
    const barcodeInputRef = useRef(null); // Ref for the barcode input field
    const printAreaRef = useRef(null); // Ref for the temporary hidden print area

    // Effect to load JsBarcode if it's not already global (for client-side rendering)
    // This useEffect has been moved inside the component body.
    useEffect(() => {
        if (typeof window !== 'undefined' && typeof window.JsBarcode === 'undefined') {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js";
            script.async = true;
            script.onload = () => console.log('JsBarcode loaded.');
            script.onerror = () => console.error('Failed to load JsBarcode script.');
            document.body.appendChild(script);
            return () => {
                if (document.body.contains(script)) {
                    document.body.removeChild(script);
                }
            };
        }
    }, []); // Empty dependency array means it runs once on mount

    useEffect(() => {
        if (barcodeInputRef.current) {
            barcodeInputRef.current.focus();
        }
    }, []);

    // --- Core Barcode Lookup Function (for auto-filling) ---
    const lookupProductByBarcode = useCallback(async (barcodeValue) => {
        setError('');
        setSelectedProduct(null); // Clear any previously selected product
        if (!barcodeValue) {
            toast.dismiss('barcode-lookup');
            return;
        }

        const barcodeNumber = parseInt(barcodeValue, 10);
        if (isNaN(barcodeNumber)) {
            setError('Invalid barcode: Barcode must be a number.');
            toast.error('Invalid barcode format.', { id: 'barcode-lookup' });
            return;
        }

        toast.loading(`Searching for barcode: ${barcodeValue}...`, { id: 'barcode-lookup' });
        try {
            const response = await fetch('/api/scanBarcode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ barcode: barcodeNumber }),
            });
            const data = await response.json();

            if (response.ok) {
                const product = data.product;
                setSelectedProduct(product); // Auto-select the product
                setSearchQuery(product.itemName); // Fill search query with item name
                setLabelQuantity(1); // Reset quantity to 1 for new selection
                setSearchResults([]); // Clear search results
                toast.success(`Product found: ${product.itemName}`, { id: 'barcode-lookup' });
            } else if (response.status === 404) {
                setSelectedProduct(null);
                toast.error(`No product found for barcode: ${barcodeValue}.`, { id: 'barcode-lookup' });
            } else {
                setError(data.error || `Error looking up barcode: ${response.status}`);
                toast.error(`Error: ${data.error || 'Unknown error'}`, { id: 'barcode-lookup' });
            }
        } catch (err) {
            setError(`Network error: ${err.message}`);
            toast.error(`Network error: ${err.message}`, { id: 'barcode-lookup' });
        } finally {
            toast.dismiss('barcode-lookup');
        }
    }, []);

    const debouncedLookupProduct = useCallback(debounce(lookupProductByBarcode, 300), [lookupProductByBarcode]);

    // Handle search for inventory items by name or barcode
    const handleSearch = () => {
        if (!searchQuery.trim()) {
            setError('Please enter a search query (name or barcode).');
            setSearchResults([]);
            return;
        }
        setError('');

        // Try to search by barcode first (exact match)
        const barcodeNumber = parseInt(searchQuery, 10);
        let results = [];
        if (!isNaN(barcodeNumber)) {
            const productByBarcode = inventoryItems.find(item => item.barcode === barcodeNumber);
            if (productByBarcode) {
                results = [productByBarcode];
            }
        }

        // If no exact barcode match or search query is not a number, search by name
        if (results.length === 0) {
            results = searchInventoryItems(inventoryItems, searchQuery);
        }

        if (results.length > 0) {
            setSearchResults(results);
            if (results.length === 1) {
                handleSelectItem(results[0]); // Auto-select if only one result
            }
        } else {
            setSearchResults([]);
            setError(`No matching items found for "${searchQuery}".`);
            setSelectedProduct(null);
        }
    };

    // Handle selection of a product from search results
    const handleSelectItem = (item) => {
        setSelectedProduct(item);
        setScannedBarcode(item.barcode?.toString() || ''); // Set the barcode input
        setSearchQuery(item.itemName); // Pre-fill search query with item name
        setSearchResults([]); // Clear search results
        setError('');
        setLabelQuantity(1); // Reset quantity to 1 for new selection
    };

    // Handle the printing of labels
    const handlePrintLabels = useCallback(() => {
        if (!selectedProduct) {
            setError('Please select a product to print labels for.');
            return;
        }
        if (labelQuantity < 1) {
            setError('Label quantity must be at least 1.');
            return;
        }
        if (typeof window.JsBarcode === 'undefined') {
            setError('Barcode generation library not loaded. Please try again or refresh.');
            toast.error("Barcode generation library not loaded.", { id: 'print-labels' });
            return;
        }

        setIsPrinting(true);
        setError('');
        toast.loading('Preparing labels for printing...', { id: 'print-labels' });

        // Create a temporary hidden div to render labels for printing
        const printContent = document.createElement('div');
        printContent.style.display = 'none'; // Keep it hidden
        printContent.style.position = 'absolute';
        printContent.style.left = '-9999px';
        document.body.appendChild(printContent);
        printAreaRef.current = printContent; // Store ref for cleanup

        let labelsHtml = '';
        for (let i = 0; i < labelQuantity; i++) {
            // Each label will have a unique ID for JsBarcode to target
            const barcodeId = `barcode-${selectedProduct.barcode}-${i}`;
            labelsHtml += `
                <div class="label" style="
                    width: 2.5in; /* Standard label width, adjust as needed */
                    height: 1in;  /* Standard label height, adjust as needed */
                    border: 1px solid #ccc;
                    padding: 5px;
                    margin: 5px;
                    display: inline-block; /* For multiple labels per row */
                    text-align: center;
                    font-family: 'Inter', sans-serif;
                    box-sizing: border-box;
                    page-break-inside: avoid; /* Prevent breaking labels across pages */
                ">
                    <p class="item-name" style="font-size: 0.7em; font-weight: bold; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${selectedProduct.itemName}
                    </p>
                    <p class="price" style="font-size: 0.8em; font-weight: bold; margin-bottom: 5px;">
                        ₹${(selectedProduct.discountedPrice || selectedProduct.originalPrice || 0).toFixed(2)}
                    </p>
                    <svg id="${barcodeId}" style="width: 100%; height: 50px;"></svg>
                    <p class="barcode-text" style="font-size: 0.6em; margin-top: 2px;">
                        ${selectedProduct.barcode}
                    </p>
                </div>
            `;
        }
        printContent.innerHTML = labelsHtml;

        // Use a small delay to ensure the DOM is updated before rendering barcodes
        setTimeout(() => {
            for (let i = 0; i < labelQuantity; i++) {
                const barcodeElement = printContent.querySelector(`#barcode-${selectedProduct.barcode}-${i}`);
                if (barcodeElement) {
                    try {
                        // JsBarcode(element, data, options)
                        window.JsBarcode(barcodeElement, String(selectedProduct.barcode), {
                            format: "EAN13", // Common retail barcode format
                            displayValue: false, // Don't display the number below the barcode (we'll add it manually)
                            height: 40,
                            width: 1.5,
                            margin: 0,
                            flat: true // For cleaner rendering
                        });
                    } catch (e) {
                        console.error("Error generating barcode:", e);
                        setError("Failed to generate one or more barcodes. Check console for details.");
                        toast.error("Failed to generate barcodes.", { id: 'print-labels' });
                        setIsPrinting(false);
                        // Clean up the print content if an error occurs
                        if (printAreaRef.current) {
                            document.body.removeChild(printAreaRef.current);
                            printAreaRef.current = null;
                        }
                        return;
                    }
                }
            }

            // Trigger print dialog
            const printWindow = window.open('', '_blank'); // Open a new blank window
            printWindow.document.write(`
                <html>
                <head>
                    <title>Print Barcode Labels</title>
                    <style>
                        @page { size: auto; margin: 0; } /* Remove default margins */
                        body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
                        .label-container {
                            display: flex;
                            flex-wrap: wrap;
                            justify-content: flex-start; /* Align labels to the left */
                            padding: 10px; /* Overall padding for the print area */
                        }
                        .label {
                            width: 2.5in;
                            height: 1in;
                            border: 1px solid #ccc;
                            padding: 5px;
                            margin: 5px; /* Spacing between labels */
                            display: inline-block;
                            text-align: center;
                            font-family: 'Inter', sans-serif;
                            box-sizing: border-box;
                            page-break-inside: avoid; /* Keep label intact on one page */
                            break-after: avoid; /* Prevent page break immediately after a label */
                            break-before: avoid; /* Prevent page break immediately before a label */
                        }
                        .label p {
                            margin: 0;
                            line-height: 1.2;
                        }
                        .label .item-name {
                            font-size: 0.7em;
                            font-weight: bold;
                            margin-bottom: 2px;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        }
                        .label .price {
                            font-size: 0.8em;
                            font-weight: bold;
                            margin-bottom: 5px;
                        }
                        .label .barcode-text {
                            font-size: 0.6em;
                            margin-top: 2px;
                        }
                        svg {
                            width: 100%;
                            height: 50px;
                        }
                    </style>
                </head>
                <body>
                    <div class="label-container">
                        ${labelsHtml}
                    </div>
                    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
                    <script>
                        // Re-render barcodes in the new window
                        window.onload = function() {
                            const labels = document.querySelectorAll('.label');
                            labels.forEach((label, index) => {
                                const barcodeElement = label.querySelector('svg');
                                const barcodeData = label.querySelector('.barcode-text').textContent.trim();
                                if (barcodeElement && barcodeData) {
                                    JsBarcode(barcodeElement, barcodeData, {
                                        format: "EAN13",
                                        displayValue: false,
                                        height: 40,
                                        width: 1.5,
                                        margin: 0,
                                        flat: true
                                    });
                                }
                            });
                            window.print();
                            // Optional: Close the print window after printing (might not work in all browsers)
                            // window.onafterprint = function() { window.close(); }
                        };
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close(); // Close the document opened by .write()

            // Wait for the content to load and then print
            printWindow.focus(); // Focus the new window

            toast.success('Labels prepared. Please use your browser\'s print dialog.', { id: 'print-labels', duration: 5000 });

        }, 100); // Small delay to ensure DOM update

        // Cleanup the temporary div after printing (or after a short delay)
        setTimeout(() => {
            if (printAreaRef.current && document.body.contains(printAreaRef.current)) {
                document.body.removeChild(printAreaRef.current);
                printAreaRef.current = null;
            }
            setIsPrinting(false);
        }, 3000); // Give some time for print dialog to appear
    }, [selectedProduct, labelQuantity]);


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
                            <Tag className="mr-2 text-[#615FFF]" /> Print Barcode Labels
                        </h1>
                        <p className="text-gray-500 text-sm">Scan barcode or search for products to print labels.</p>
                    </div>

                    <div className="space-y-4">
                        {/* Barcode Input Section - Auto-fills on scan */}
                        <div className="flex items-center gap-4">
                            <input
                                ref={barcodeInputRef}
                                type="text"
                                placeholder="Scan barcode here..."
                                value={scannedBarcode}
                                onChange={(e) => {
                                    const newBarcode = e.target.value;
                                    setScannedBarcode(newBarcode);
                                    // Trigger lookup only if a barcode value is present
                                    if (newBarcode.length > 0) {
                                        debouncedLookupProduct(newBarcode);
                                    } else {
                                        // If input is cleared, reset states
                                        setSelectedProduct(null);
                                        setSearchQuery('');
                                        setSearchResults([]);
                                        setError('');
                                        setLabelQuantity(1);
                                    }
                                }}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        if (scannedBarcode.length > 0) {
                                            lookupProductByBarcode(scannedBarcode); // Call directly without debounce for Enter
                                        }
                                    }
                                }}
                                className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#615FFF]"
                            />
                            {scannedBarcode && (
                                <button
                                    onClick={() => {
                                        setScannedBarcode('');
                                        setSelectedProduct(null);
                                        setSearchQuery('');
                                        setSearchResults([]);
                                        setError('');
                                        setLabelQuantity(1);
                                        barcodeInputRef.current?.focus();
                                    }}
                                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* Product Name Search Section */}
                        <div className='flex flex-col gap-2'>
                            <div className="flex items-center w-full gap-2">
                                <input
                                    type="text"
                                    placeholder="Search for item by name"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') handleSearch();
                                    }}
                                    className="border flex-1 border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#615FFF]"
                                />
                                <button
                                    onClick={handleSearch}
                                    className="bg-[#615FFF] cursor-pointer flex items-center text-white hover:bg-[#4a3fbc] px-4 py-2 rounded-md"
                                >
                                    <Search className="mr-2" /> Search
                                </button>
                            </div>

                            {searchResults.length > 0 && (
                                <div className="border rounded-md p-2 max-h-48 overflow-y-auto">
                                    <ul className="space-y-1">
                                        {searchResults.map((item, idx) => (
                                            <li
                                                key={item.barcode || idx}
                                                onClick={() => handleSelectItem(item)}
                                                className="cursor-pointer p-2 rounded-md hover:bg-gray-100 flex items-center justify-between"
                                            >
                                                <span>{item.itemName}</span>
                                                {item.barcode ? (
                                                    <span className="text-gray-500 text-sm">Barcode: {item.barcode}</span>
                                                ) : (
                                                    <span className="text-red-500 text-sm">No Barcode</span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        {/* Selected Product and Quantity Input */}
                        {selectedProduct && (
                            <div className="bg-gray-100 p-4 rounded-md border border-gray-200 mt-4">
                                <h2 className="text-lg font-semibold text-gray-800">Selected Product:</h2>
                                <p className="text-gray-700"><strong>Name:</strong> {selectedProduct.itemName}</p>
                                <p className="text-gray-700"><strong>Barcode:</strong> {selectedProduct.barcode}</p>
                                <p className="text-gray-700"><strong>Price:</strong> ₹{(selectedProduct.discountedPrice || selectedProduct.originalPrice || 0).toFixed(2)}</p>

                                <div className="mt-4 flex items-center gap-4">
                                    <label htmlFor="labelQuantity" className="text-gray-700 font-medium">
                                        Number of Labels:
                                    </label>
                                    <input
                                        type="number"
                                        id="labelQuantity"
                                        min="1"
                                        value={labelQuantity}
                                        onChange={(e) => setLabelQuantity(Math.max(1, parseInt(e.target.value || '1', 10)))}
                                        className="w-24 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#615FFF]"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Print Button */}
                    <div className="mt-6">
                        <button
                            onClick={handlePrintLabels}
                            disabled={!selectedProduct || labelQuantity < 1 || isPrinting}
                            className={`w-full py-3 px-4 rounded-md font-bold text-lg flex items-center justify-center gap-2
                                ${!selectedProduct || labelQuantity < 1 || isPrinting
                                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                    : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                                }`}
                        >
                            {isPrinting ? (
                                <>Preparing Print...</>
                            ) : (
                                <>
                                    <Printer size={20} /> Print Labels
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            {/* This div is used to render content for printing. It's hidden from view. */}
            {/* The content will be dynamically generated and moved to a new window for actual printing. */}
        </div>
    );
};

export default BarcodeLabelPrinterPage;
