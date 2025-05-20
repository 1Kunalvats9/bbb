"use client"
import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import DashboardHeroCard from '../components/DashboardHeroCard'
import { useInventory } from '@/context/inventoryContext'
import Footer from '../components/Footer'
import { useAuth } from '@/context/authContext';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/cartContext'
import { Search } from 'lucide-react'
import InventoryProductCard from '../components/InventoryProductCard'

const Page = () => {
    const { cartItems } = useCart()
    const [searchQuery, setSearchQuery] = useState('')
    const { inventoryItems } = useInventory();
    const { isLoggedIn } = useAuth();
    const router = useRouter();

    if (!isLoggedIn) {
        return null;
    }

    const filteredInventoryItems = inventoryItems.filter(item =>
        item.itemName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className='w-full min-h-screen bg-white'>
            <Navbar />
            <div className='w-full bg-gray-100 min-h-[70vh] gap-4 px-10 py-20 flex flex-col items-center justify-start'>
                {/* <div className='flex items-center relative gap-4 py-6 border md:py-10 px-6 md:px-20 w-full'> */}
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
                {/* </div> */}

                <div className='grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5  w-full'>
                    {
                        filteredInventoryItems.length > 0 ?
                            filteredInventoryItems.map((item) => {
                                return <InventoryProductCard
                                    key={item.itemName}
                                    itemName={item.itemName}
                                    availableQuantity={item.quantity}
                                    price={item.discountedPrice}
                                />
                            }) :
                            searchQuery ? (
                                <p className='text-black text-xl'>No items found matching "{searchQuery}".</p>
                            ) : (
                                <p className='text-black text-xl'>No items in stock. Please add some items.</p>
                            )
                    }
                </div>
            </div>
            <Footer />
        </div>
    )
}

export default Page;