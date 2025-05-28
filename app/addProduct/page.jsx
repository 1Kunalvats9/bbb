'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Search, Barcode, PlusCircle, CheckCircle, Save, Sparkles } from 'lucide-react';
import { useInventory } from '@/context/inventoryContext';
import searchInventoryItems from '@/lib/searchInventoryItems';
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

const AddProductPage = () => {
    const [barcode, setBarcode] = useState('');
    const [itemName, setItemName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSavingNewProduct, setIsSavingNewProduct] = useState(false);
    const [error, setError] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [isProductFound, setIsProductFound] = useState(false);
    const { inventoryItems, setInventoryItems } = useInventory();
    const router = useRouter();

    const [originalPrice, setOriginalPrice] = useState('');
    const [discountedPrice, setDiscountedPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [quantityChange, setQuantityChange] = useState(''); // For adding/subtracting quantity during update

    const barcodeInputRef = useRef(null);

    useEffect(() => {
        if (barcodeInputRef.current) {
            barcodeInputRef.current.focus();
        }
    }, []);

    // --- Core Search and Lookup Functions ---
    const lookupProductByBarcode = useCallback(async (scannedBarcode) => {
        setError('');
        setSelectedItem(null);
        setIsProductFound(false);
        if (!scannedBarcode) {
            toast.dismiss('barcode-lookup');
            return;
        }

        const barcodeNumber = parseInt(scannedBarcode, 10);
        if (isNaN(barcodeNumber)) {
            setError('Invalid barcode: Barcode must be a number.');
            toast.error('Invalid barcode format.', { id: 'barcode-lookup' });
            return;
        }

        toast.loading(`Searching for barcode: ${scannedBarcode}...`, { id: 'barcode-lookup' });
        try {
            const response = await fetch('/api/scanBarcode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ barcode: barcodeNumber }),
            });
            const data = await response.json();

            if (response.ok) {
                const product = data.product;
                setSelectedItem(product);
                setItemName(product.itemName);
                setOriginalPrice(product.originalPrice?.toString() || '');
                setDiscountedPrice(product.discountedPrice?.toString() || '');
                // Convert quantity from DB (which is Number) to string for the input field
                setQuantity(product.quantity?.toString() || '');
                setIsProductFound(true);
                setSearchResults([]);
                toast.success(`Product found: ${product.itemName}`, { id: 'barcode-lookup' });
            } else if (response.status === 404) {
                setItemName('');
                setOriginalPrice('');
                setDiscountedPrice('');
                setQuantity('');
                setSelectedItem(null);
                setIsProductFound(false);
                toast.error(`No product found for barcode: ${scannedBarcode}. Please fill details to add it.`, { id: 'barcode-lookup' });
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

    const handleSearchByName = () => {
        if (!searchQuery.trim()) {
            setError('Please enter a search query for the item name.');
            setSearchResults([]);
            return;
        }
        setError('');
        const results = searchInventoryItems(inventoryItems, searchQuery);

        if (results.length > 0) {
            setSearchResults(results);
            if (results.length === 1) {
                handleSelectItem(results[0]);
            }
        } else {
            setSearchResults([]);
            setError('No matching items found for this name.');
            setSelectedItem(null);
            setIsProductFound(false);
        }
    };

    const handleSelectItem = (item) => {
        setSelectedItem(item);
        setItemName(item.itemName);
        setBarcode(item.barcode?.toString() || '');
        setOriginalPrice(item.originalPrice?.toString() || '');
        setDiscountedPrice(item.discountedPrice?.toString() || '');
        // Convert quantity from DB (which is Number) to string for the input field
        setQuantity(item.quantity?.toString() || '');
        setSearchResults([]);
        setError('');
        setIsProductFound(true);
        setQuantityChange(''); // Clear any previous quantity change input
    };

    // --- Form Management and Actions ---
    const handleClearForm = () => {
        setBarcode('');
        setItemName('');
        setOriginalPrice('');
        setDiscountedPrice('');
        setQuantity('');
        setQuantityChange('');
        setSearchQuery('');
        setSearchResults([]);
        setSelectedItem(null);
        setIsProductFound(false);
        setError('');
        barcodeInputRef.current?.focus();
    };

    const handleUpdateProduct = async () => {
        // Validate inputs using parseFloat for numerical fields
        if (!itemName.trim() || isNaN(parseFloat(originalPrice)) || isNaN(parseFloat(discountedPrice)) || isNaN(parseFloat(quantity)) || !barcode) {
            setError('Please fill all product fields with valid numbers and ensure a barcode is present.');
            return;
        }

        setError('');
        toast.loading(`Updating ${itemName}...`, { id: 'update-product' });

        try {
            let finalQuantity = parseFloat(quantity); // Get current quantity from the input field as float
            const qtyChangeValue = parseFloat(quantityChange); // Get quantity change as float

            // If quantityChange is a valid number, apply it as an adjustment
            if (!isNaN(qtyChangeValue)) {
                finalQuantity = finalQuantity + qtyChangeValue;
            }

            if (finalQuantity < 0) {
                setError('Final quantity cannot be negative.');
                toast.error('Final quantity cannot be negative.', { id: 'update-product' });
                return;
            }

            // The PUT endpoint is now at `/api/products` for general updates
            const res = await fetch(`/api/addProduct`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemName,
                    quantity: finalQuantity, // Send the calculated float quantity
                    originalPrice: parseFloat(originalPrice),
                    discountedPrice: parseFloat(discountedPrice),
                    barcode: parseInt(barcode, 10), // Barcode is an integer
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to update product.');
            }

            toast.success('Product updated successfully!', { id: 'update-product' });
            handleClearForm(); // Clear form after successful update

        } catch (err) {
            console.error('Error updating product:', err);
            setError(err.message);
            toast.error(err.message, { id: 'update-product' });
        }
    };

    const handleSaveNewProduct = async () => {
        // Validate inputs using parseFloat for numerical fields
        if (!itemName.trim() || isNaN(parseFloat(originalPrice)) || isNaN(parseFloat(discountedPrice)) || isNaN(parseFloat(quantity))) {
            setError('Please fill item name, original price, discounted price, and quantity with valid numbers to save.');
            return;
        }

        setIsSavingNewProduct(true);
        setError('');
        toast.loading('Saving product...', { id: 'save-product' });

        let finalBarcode = barcode ? parseInt(barcode, 10) : null; // Use existing barcode if present

        try {
            // Only generate a new barcode if the 'barcode' state is empty
            if (!finalBarcode) {
                const barcodeResponse = await fetch('/api/generateBarcode', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}),
                });
                const barcodeData = await barcodeResponse.json();

                if (!barcodeResponse.ok) {
                    throw new Error(barcodeData.error || "Failed to generate barcode");
                }
                finalBarcode = barcodeData.barcode;
                setBarcode(finalBarcode.toString()); // Update barcode state with newly generated one
            }

            // Use /api/products for POST/CREATE
            const productResponse = await fetch('/api/addProduct', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemName,
                    quantity: parseFloat(quantity), // Send quantity as float
                    originalPrice: parseFloat(originalPrice), // Send price as float
                    discountedPrice: parseFloat(discountedPrice), // Send price as float
                    barcode: finalBarcode,
                }),
            });
            const productData = await productResponse.json();

            if (!productResponse.ok) {
                throw new Error(productData.error || `Failed to add product.`);
            }
            setInventoryItems(prevItems => [...prevItems, productData.product]);

            toast.success('New item added successfully!', { id: 'save-product' });
            handleClearForm(); // Clear form after successful save

        } catch (err) {
            console.error('Error during product saving:', err);
            setError(err.message);
            toast.error(err.message, { id: 'save-product' });
        } finally {
            setIsSavingNewProduct(false);
            toast.dismiss('save-product');
        }
    };

    const handleGoBack = () => {
        router.back();
    };

    // Check if the form has enough valid numerical data to attempt a save/update action
    const isFormReadyForAction = itemName.trim() && !isNaN(parseFloat(originalPrice)) && !isNaN(parseFloat(discountedPrice)) && !isNaN(parseFloat(quantity));

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
                            <Barcode className="mr-2 text-[#615FFF]" /> Product Inventory
                        </h1>
                        <p className="text-gray-500 text-sm">Scan barcode, search by name, or add a new product.</p>
                    </div>

                    <div className="space-y-4">
                        {/* Barcode Input Section */}
                        <div className="flex items-center gap-4">
                            <input
                                ref={barcodeInputRef}
                                type="text" // Keep as text, parse with parseInt
                                placeholder="Scan barcode or enter manually"
                                value={barcode}
                                onChange={(e) => {
                                    const newBarcode = e.target.value;
                                    setBarcode(newBarcode);
                                    if (newBarcode.length > 0) {
                                        debouncedLookupProduct(newBarcode);
                                    } else {
                                        handleClearForm(); // Clear form when barcode is empty
                                    }
                                }}
                                 className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#615FFF]"
                            />
                            {barcode && (
                                <button
                                    onClick={handleClearForm}
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
                                    className="border flex-1 border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#615FFF]"
                                />
                                <button
                                    onClick={handleSearchByName}
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

                        {/* Product Details Display/Input */}
                        {selectedItem && (
                            <div className="bg-gray-100 p-3 rounded-md border">
                                <p className="font-semibold text-gray-800">Editing Product: {selectedItem.itemName}</p>
                                <p className="text-gray-600">Barcode: {selectedItem.barcode}</p>
                                <p className="text-sm text-gray-700 mt-2">Modify fields below to update details and quantity.</p>
                            </div>
                        )}
                        {barcode && !isProductFound && (
                            <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 text-yellow-800">
                                Barcode entered. This barcode does not exist. Fill details to create a **new** product.
                            </div>
                        )}
                        {searchQuery && searchResults.length === 0 && !selectedItem && (
                            <div className="bg-red-50 p-3 rounded-md border border-red-200 text-red-800">
                                No matching item found for "{searchQuery}". You can fill details to create a new one.
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
                                type="number" // Use type="number" for prices
                                step="any"   // Allows decimal input for prices
                                placeholder="Original Price"
                                value={originalPrice}
                                onChange={(e) => setOriginalPrice(e.target.value)}
                                className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#615FFF]"
                            />
                            <input
                                type="number" // Use type="number" for prices
                                step="any"   // Allows decimal input for prices
                                placeholder="Discounted Price"
                                value={discountedPrice}
                                onChange={(e) => setDiscountedPrice(e.target.value)}
                                className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#615FFF]"
                            />
                            <input
                                type="number" // Use type="number" for quantity
                                step="any"   // Allows decimal input for quantity
                                placeholder="Quantity"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#615FFF]"
                            />
                        </div>
                        {/* New input for quantity change - only relevant for updates */}
                        {isProductFound && selectedItem && (
                            <div className="mt-2">
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="Add/Subtract Quantity (e.g., -0.5 or 2.0)"
                                    value={quantityChange}
                                    onChange={(e) => setQuantityChange(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#615FFF]"
                                />
                                <p className="text-gray-600 text-sm mt-1">Enter a positive number to add stock, a negative number to reduce stock.</p>
                            </div>
                        )}

                        {error && <p className="text-red-500 text-sm">{error}</p>}
                    </div>

                    <div className="mt-4 flex flex-col gap-3">
                        {isProductFound && barcode && (
                            <button
                                onClick={handleUpdateProduct}
                                className="bg-green-600 text-white hover:bg-green-700 px-6 py-3 flex items-center justify-center gap-1 cursor-pointer rounded-md w-full"
                                disabled={!isFormReadyForAction}
                            >
                                <CheckCircle className="mr-2" /> Update Product
                            </button>
                        )}

                        {!isProductFound && (
                            <button
                                onClick={handleSaveNewProduct}
                                className="bg-[#615FFF] text-white hover:bg-[#4a3fbc] px-6 py-3 flex items-center justify-center gap-1 rounded-md cursor-pointer w-full"
                                disabled={isSavingNewProduct || !isFormReadyForAction}
                            >
                                {isSavingNewProduct ? (
                                    <>Saving...</>
                                ) : (
                                    <>
                                        {barcode ? (
                                            <>
                                                <Save className="mr-2" /> Save New Product with Scanned Barcode
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="mr-2" /> Generate Barcode & Save New Product
                                            </>
                                        )}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddProductPage;