"use client"
import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { useInventory } from '@/context/inventoryContext'
import Footer from '../components/Footer'
import { useAuth } from '@/context/authContext';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/cartContext'
import { Search } from 'lucide-react'
import InventoryProductCard from "@/app/components/InventoryProductCard"

const Page = () => {
    const { setInventoryItems } = useInventory();
    const [searchQuery, setSearchQuery] = useState('');
    const [localInventoryItems, setLocalInventoryItems] = useState([]);

    const { isLoggedIn } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoggedIn) {
            router.push('/login');
        }
    }, [isLoggedIn, router]);

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const res = await fetch('/api/getInventoryProducts', {
                    method: 'GET',
                    'Content-type': 'application/json'
                });

                if (!res.ok) {
                    throw new Error(`Failed to fetch inventory: ${res.status}`);
                }
                const data = await res.json();
                setLocalInventoryItems(data);
                setInventoryItems(data);

            } catch (error) {
                console.error("Error fetching inventory:", error);
            }
        }
        if (isLoggedIn) {
            fetchInventory();
        }
    }, [setInventoryItems, isLoggedIn]);

    const { cartItems } = useCart()
    const filteredInventoryItems = localInventoryItems.filter(item =>
        item.itemName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isLoggedIn) {
        return null;
    }

    return (
        <div className='w-full min-h-screen bg-white'>
            <Navbar />
            <div className='w-full bg-gray-100 min-h-[70vh] gap-4 px-10 py-20 flex flex-col items-center justify-start'>
                <div className='w-full flex items-center px-4 rounded-xl bg-white border border-gray-300'>
                    <Search className='text-gray-500' />
                    <input
                        type="text"
                        placeholder='Search for items..'
                        className='w-full rounded-xl text-black px-4 py-2 bg-white outline-none placeholder:text-gray-500'
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                        }}
                        value={searchQuery}
                    />
                </div>

                <div className="w-full grid grid-cols-[50px_2fr_1fr_1fr_1.5fr_0.5fr] gap-4 p-3 rounded-lg bg-gray-200 font-semibold text-gray-700">
                    <div>S.No.</div>
                    <div>Item Name</div>
                    <div>Price</div>
                    <div>Quantity</div>
                    <div>Add to Cart</div>
                    <div>Edit</div>
                </div>

                <div className='w-full flex flex-col gap-3'>
                    {
                        filteredInventoryItems.length > 0 ?
                            filteredInventoryItems.map((item, index) => {
                                return (
                                    <InventoryProductCard
                                        key={item.itemName}
                                        serialNumber={index + 1}
                                        itemName={item.itemName}
                                        availableQuantity={item.quantity}
                                        price={item.discountedPrice}
                                        itemId={item._id}
                                    />
                                );
                            }) :
                            searchQuery ? (
                                <p className='text-black text-xl text-center w-full'>No items found matching "{searchQuery}".</p>
                            ) : (
                                <p className='text-black text-xl text-center w-full'>No items in stock. Please add some items.</p>
                            )
                    }
                </div>
            </div>
            <Footer />
        </div>
    )
}

export default Page;