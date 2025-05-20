'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Search, Barcode, PlusCircle, CheckCircle } from 'lucide-react';
import { useInventory } from '@/context/inventoryContext'; // Assuming you have this context
import searchInventoryItems from '@/lib/searchInventoryItems'; // Assuming this utility
import toast from 'react-hot-toast'; // For notifications
import { useRouter } from 'next/navigation'; // For navigation

const AddProductPage = () => {
    const [barcode, setBarcode] = useState('');
    const [itemName, setItemName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isGeneratingBarcode, setIsGeneratingBarcode] = useState(false);
    const [error, setError] = useState('');
    const [selectedItem, setSelectedItem] = useState(null); // To hold item selected from search or barcode lookup
    const [isBarcodeSaved, setIsBarcodeSaved] = useState(false); // Indicates if barcode corresponds to a saved item
    const { inventoryItems, setInventoryItems } = useInventory(); // Get inventory state and setter
    const router = useRouter();

    const [originalPrice, setOriginalPrice] = useState('');
    const [discountedPrice, setDiscountedPrice] = useState('');
    const [quantity, setQuantity] = useState('');

    const barcodeInputRef = useRef(null);

    useEffect(() => {
        // Focus on the barcode input when the component mounts
        if (barcodeInputRef.current) {
            barcodeInputRef.current.focus();
        }
    }, []);

    // Function to look up product by barcode
    const lookupProductByBarcode = useCallback(async (scannedBarcode) => {
        setError('');
        setSelectedItem(null); // Clear any previously selected item
        setIsBarcodeSaved(false); // Reset saved status

        if (!scannedBarcode) {
            return;
        }

        toast.loading(`Searching for barcode: ${scannedBarcode}...`, { id: 'barcode-lookup' });

        try {
            const response = await fetch('/api/scanBarcode', { // Assuming you have a /api/scanBarcode endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ barcode: scannedBarcode }),
            });

            const data = await response.json();

            if (response.ok) {
                const product = data.product;
                // If product found, pre-fill all fields
                setSelectedItem(product);
                setItemName(product.itemName);
                setOriginalPrice(product.originalPrice || '');
                setDiscountedPrice(product.discountedPrice || '');
                setQuantity(product.quantity || ''); // Fill quantity if available
                setBarcode(product.barcode.toString());
                setIsBarcodeSaved(true); // Mark as found/saved
                setSearchResults([]); // Clear search results if a product is found via barcode
                toast.success(`Product found: ${product.itemName}`, { id: 'barcode-lookup' });
            } else if (response.status === 404) {
                // If barcode doesn't exist, clear fields and let user add new product
                setItemName('');
                setOriginalPrice('');
                setDiscountedPrice('');
                setQuantity('');
                setSelectedItem(null);
                setIsBarcodeSaved(false); // Not saved
                toast.error(`No product found for barcode: ${scannedBarcode}. Fill details to add it.`, { id: 'barcode-lookup' });
            } else {
                setError(data.message || `Error looking up barcode: ${response.status}`);
                toast.error(`Error: ${data.message || 'Unknown error'}`, { id: 'barcode-lookup' });
            }
        } catch (err) {
            setError(`Network error: ${err.message}`);
            toast.error(`Network error: ${err.message}`, { id: 'barcode-lookup' });
        } finally {
            toast.dismiss('barcode-lookup');
        }
    }, []);

    const handleBarcodeInputKeyDown = useCallback((e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission
            lookupProductByBarcode(barcode);
        }
    }, [barcode, lookupProductByBarcode]);

    // Function to handle item search by name
    const handleSearch = () => {
        if (!searchQuery.trim()) {
            setError('Please enter a search query.');
            setSearchResults([]);
            return;
        }

        // Assuming searchInventoryItems filters from your local inventoryItems context
        const results = searchInventoryItems(inventoryItems, searchQuery);
        setSearchResults(results);
        if (results.length === 0) {
            setError('No matching items found.');
        } else {
            setError('');
        }
    };

    // Function to select an item from search results
    const handleSelectItem = (item) => {
        setSelectedItem(item);
        setItemName(item.itemName);
        setBarcode(item.barcode ? item.barcode.toString() : '');
        setOriginalPrice(item.originalPrice || '');
        setDiscountedPrice(item.discountedPrice || '');
        setQuantity(item.quantity || ''); // Fill quantity if available
        setSearchResults([]); // Clear results after selection
        setError('');
        setIsBarcodeSaved(true); // Mark as found/saved
    };

    // Function to generate barcode and add item
    const handleGenerateBarcodeAndAddItem = async () => {
        if (!itemName.trim() || originalPrice === '' || discountedPrice === '' || quantity === '') {
            setError('Please enter item name, original price, discounted price, and quantity.');
            return;
        }
        if (isNaN(parseFloat(originalPrice)) || isNaN(parseFloat(discountedPrice)) || isNaN(parseInt(quantity, 10))) {
            setError('Prices and quantity must be valid numbers.');
            return;
        }

        setIsGeneratingBarcode(true);
        setError('');
        toast.loading('Generating barcode and adding item...', { id: 'add-item' });

        try {
            // Step 1: Generate a new barcode
            const barcodeResponse = await fetch('/api/generateBarcode', { // Assuming /api/generateBarcode endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}), // May or may not need a body depending on your API
            });

            const barcodeData = await barcodeResponse.json();

            if (!barcodeResponse.ok) {
                setError(barcodeData.error || "Failed to generate barcode");
                toast.error(barcodeData.error || "Failed to generate barcode", { id: 'add-item' });
                setIsGeneratingBarcode(false);
                return;
            }

            const newBarcode = barcodeData.barcode;
            setBarcode(newBarcode); // Update barcode state

            // Step 2: Add the product to inventory with the new barcode
            const productResponse = await fetch('/api/products', { // Your /api/products POST endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemName,
                    quantity: parseInt(quantity, 10),
                    originalPrice: parseFloat(originalPrice),
                    discountedPrice: parseFloat(discountedPrice),
                    barcode: newBarcode,
                }),
            });

            const productData = await productResponse.json();

            if (productResponse.ok) {
                // Update global inventory state
                setInventoryItems(prevItems => [...prevItems, productData.product]);
                toast.success('New item generated and added successfully!', { id: 'add-item' });
                // Reset form fields
                setBarcode('');
                setItemName('');
                setOriginalPrice('');
                setDiscountedPrice('');
                setQuantity('');
                setSelectedItem(null);
                setIsBarcodeSaved(false);
                barcodeInputRef.current?.focus(); // Re-focus for next input
            } else {
                setError(`Error saving product: ${productData.error}`);
                toast.error(`Error saving product: ${productData.error}`, { id: 'add-item' });
            }

        } catch (err) {
            setError(`Error during barcode generation or product saving: ${err.message}`);
            toast.error(`Network error: ${err.message}`, { id: 'add-item' });
        } finally {
            setIsGeneratingBarcode(false);
            toast.dismiss('add-item');
        }
    };

    const handleGoBack = () => {
        router.back();
    };

    const isFormValid = itemName.trim() && originalPrice !== '' && discountedPrice !== '' && quantity !== '';

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
                            <Barcode className="mr-2 text-[#615FFF]" /> Barcode Management
                        </h1>
                        <p className="text-gray-500 text-sm">Scan barcode or search for item</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <input
                                ref={barcodeInputRef}
                                type="text"
                                placeholder="Scan barcode or enter manually"
                                value={barcode}
                                onChange={(e) => {
                                    setBarcode(e.target.value);
                                    // If barcode input changes after a product was loaded, reset fields
                                    if (isBarcodeSaved && e.target.value !== selectedItem?.barcode?.toString()) {
                                        setSelectedItem(null);
                                        setItemName('');
                                        setOriginalPrice('');
                                        setDiscountedPrice('');
                                        setQuantity('');
                                        setIsBarcodeSaved(false);
                                        setSearchResults([]); // Clear search results as barcode input changed
                                    }
                                }}
                                onKeyDown={handleBarcodeInputKeyDown}
                                className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#615FFF]"
                            />
                            {barcode && (
                                <button
                                    onClick={() => {
                                        setBarcode('');
                                        setItemName('');
                                        setOriginalPrice('');
                                        setDiscountedPrice('');
                                        setQuantity('');
                                        setSelectedItem(null);
                                        setIsBarcodeSaved(false);
                                        setSearchResults([]);
                                        setError('');
                                        barcodeInputRef.current?.focus();
                                    }}
                                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* Show search input and results only if no barcode is currently entered or a product isn't loaded */}
                        {(!isBarcodeSaved || !barcode) && (
                            <div className='flex flex-col gap-2'>
                                <div className="flex items-center w-full gap-2">
                                    <input
                                        type="text"
                                        placeholder="Search for item by name"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="border flex-1 border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#615FFF]"
                                    />
                                    <button
                                        onClick={handleSearch}
                                        className="bg-[#615FFF] cursor-pointer flex items-center  text-white hover:bg-[#4a3fbc] px-4 py-2 rounded-md"
                                    >
                                        <Search className="mr-2" /> Search
                                    </button>
                                </div>

                                {searchResults.length > 0 && (
                                    <div className="border rounded-md p-2 max-h-48 overflow-y-auto">
                                        <ul className="space-y-1">
                                            {searchResults.map((item, idx) => (
                                                <li
                                                    key={idx}
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
                        )}

                        {/* Message if an item is selected from search or found via barcode */}
                        {selectedItem && (
                            <div className="bg-gray-100 p-3 rounded-md border">
                                Selected Item: <span className="font-semibold">{selectedItem.itemName}</span>
                                {selectedItem.barcode && <p>Barcode: {selectedItem.barcode}</p>}
                                <p className="text-sm text-gray-600">
                                    {isBarcodeSaved ? "Product found. Update details below." : "Item selected from search. Fill details if adding to inventory."}
                                </p>
                            </div>
                        )}
                        {/* Message if a barcode is entered but no product is found for it */}
                        {barcode && !isBarcodeSaved && (
                            <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 text-yellow-800">
                                Barcode entered. This barcode does not exist. Fill details to create a new product.
                            </div>
                        )}

                        <input
                            type="text"
                            placeholder="Item Name"
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            className="mb-2 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#615FFF] w-full"
                        />

                        <div className="flex items-center gap-4 mb-2">
                            <input
                                type="number"
                                placeholder="Original Price"
                                value={originalPrice}
                                onChange={(e) => setOriginalPrice(e.target.value)}
                                className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#615FFF]"
                            />
                            <input
                                type="number"
                                placeholder="Discounted Price"
                                value={discountedPrice}
                                onChange={(e) => setDiscountedPrice(e.target.value)}
                                className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#615FFF]"
                            />
                            <input
                                type="number"
                                placeholder="Quantity"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#615FFF]"
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}
                    </div>

                    <div className="mt-4">
                        <button
                            onClick={handleGenerateBarcodeAndAddItem}
                            className="bg-[#615FFF] text-white hover:bg-[#4a3fbc] px-6 py-3 flex items-center justify-center gap-1 rounded-md cursor-pointer w-full"
                            disabled={isGeneratingBarcode || !isFormValid}
                        >
                            {isGeneratingBarcode ? (
                                <>Generating...</>
                            ) : (
                                <>
                                    <PlusCircle className="mr-2" /> Generate Barcode & Add Item
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddProductPage;