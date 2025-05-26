"use client"
import { Edit } from 'lucide-react';
import React, { useState } from 'react';
import { useCart } from '@/context/cartContext';
// Removed useInventory directly as updates will come via props from parent
import toast from 'react-hot-toast';

const InventoryProductCard = ({ serialNumber, itemName, availableQuantity, price, itemId, onInventoryUpdate }) => {
    const [quantityInput, setQuantityInput] = useState("1");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editedItemName, setEditedItemName] = useState(itemName);
    const [editedPrice, setEditedPrice] = useState(price);
    const [editedQuantity, setEditedQuantity] = useState(availableQuantity);

    const { setCartItems } = useCart();
    // Removed setInventoryItems as updates will be handled by onInventoryUpdate prop

    const handleAddToCart = () => {
        const quantity = parseInt(quantityInput, 10);

        if (isNaN(quantity) || quantity <= 0 || quantity > availableQuantity) {
            toast.error(`Please enter a valid quantity between 1 and ${availableQuantity}.`);
            return;
        }

        setCartItems(prevItems => {
            const existingItemIndex = prevItems.findIndex(item => item.itemName === itemName);

            if (existingItemIndex > -1) {
                const updatedItems = [...prevItems];
                updatedItems[existingItemIndex].quantity += quantity;
                return updatedItems;
            } else {
                return [...prevItems, { itemName, quantity, price, _id: itemId }]; // Ensure _id is passed to cart items
            }
        });

        // Update the inventory context immediately via the prop
        const newAvailableQuantity = availableQuantity - quantity;
        onInventoryUpdate(itemId, { quantity: newAvailableQuantity });

        toast.success(`${quantity} x ${itemName} added to cart!`);
        setQuantityInput("1");
    };

    const handleQuantityInputChange = (e) => {
        const value = e.target.value;
        if (value === "" || /^\d+$/.test(value)) {
            setQuantityInput(value);
        }
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

    const handleEditClick = () => {
        setIsEditModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsEditModalOpen(false);
        // Reset edited values to current item values if cancelled
        setEditedItemName(itemName);
        setEditedPrice(price);
        setEditedQuantity(availableQuantity);
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/updateInventoryProduct`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    itemId: itemId,
                    itemName: editedItemName,
                    price: parseFloat(editedPrice),
                    quantity: parseInt(editedQuantity, 10),
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Failed to update item: ${res.status}`);
            }

            // No need to get updatedProduct from response if the server only confirms success.
            // Directly update the context with the new values.
            onInventoryUpdate(itemId, {
                itemName: editedItemName,
                discountedPrice: parseFloat(editedPrice), // Assuming 'price' prop maps to 'discountedPrice' in context
                quantity: parseInt(editedQuantity, 10)
            });

            setIsEditModalOpen(false);
            toast.success('Item updated successfully!');

        } catch (error) {
            console.error("Error updating item:", error);
            toast.error(`Error updating item: ${error.message}`); // Use toast for errors
        }
    };


    return (
        <div className="w-full grid grid-cols-[50px_2fr_1fr_1fr_1.5fr_0.5fr] items-center gap-4 p-3 rounded-lg bg-white shadow-sm border border-gray-200 text-black">
            <div className="text-gray-800 font-medium">{serialNumber}.</div>
            <div className="font-semibold text-gray-800">{itemName}</div>
            <div className="font-bold text-green-600">₹{price.toFixed(2)}</div>
            <div className="text-gray-600">
                <span className="font-medium text-blue-600">{availableQuantity}</span>
            </div>

            <div className='flex items-center gap-2'>
                <input
                    type="number" // Changed to type="number" for better mobile input and validation
                    min="1"
                    max={availableQuantity} // Set max to available quantity
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
                    // Disable button if quantity is 0 or input is invalid
                    disabled={availableQuantity <= 0 || parseInt(quantityInput, 10) <= 0 || parseInt(quantityInput, 10) > availableQuantity}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Add to Cart
                </button>
            </div>

            <div className='flex justify-center'>
                <Edit color='#000' className='cursor-pointer hover:text-gray-700' onClick={handleEditClick} />
            </div>

            {isEditModalOpen && (
                <div className="fixed inset-0 bg-white/5 bg-opacity-0 backdrop-blur-2xl flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800">Edit Item</h2>
                        <form onSubmit={handleSaveEdit}>
                            <div className="mb-4">
                                <label htmlFor="itemName" className="block text-gray-700 text-sm font-bold mb-2">Item Name:</label>
                                <input
                                    type="text"
                                    id="itemName"
                                    value={editedItemName}
                                    onChange={(e) => setEditedItemName(e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="price" className="block text-gray-700 text-sm font-bold mb-2">Price:</label>
                                <input
                                    type="number"
                                    id="price"
                                    value={editedPrice}
                                    onChange={(e) => setEditedPrice(e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    step="0.01"
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label htmlFor="quantity" className="block text-gray-700 text-sm font-bold mb-2">Quantity:</label>
                                <input
                                    type="number"
                                    id="quantity"
                                    value={editedQuantity}
                                    onChange={(e) => setEditedQuantity(e.target.value)}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline cursor-pointer"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryProductCard;
