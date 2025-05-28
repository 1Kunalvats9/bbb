'use client'
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const AnalyticsPage = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [inventoryData, setInventoryData] = useState([]);
    const [orderHistoryData, setOrderHistoryData] = useState([]);

    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const inventoryRes = await fetch('/api/getInventoryProducts');
                if (!inventoryRes.ok) {
                    const errorData = await inventoryRes.json();
                    throw new Error(errorData.error || 'Failed to fetch inventory data');
                }
                const inventoryItems = await inventoryRes.json();
                setInventoryData(inventoryItems);
                const historyRes = await fetch('/api/getAllCustomerHistory');
                if (!historyRes.ok) {
                    const errorData = await historyRes.json();
                    throw new Error(errorData.error || 'Failed to fetch order history data');
                }
                const history = await historyRes.json();
                setOrderHistoryData(history);

            } catch (err) {
                console.error("Error fetching analytics data:", err);
                setError(err.message);
                toast.error(`Error: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []); 
    const totalProductsInInventory = inventoryData.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
    const totalWorthInInventory = inventoryData.reduce((sum, item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const price = (item.discountedPrice !== undefined && item.discountedPrice !== null) ? parseFloat(item.discountedPrice) : parseFloat(item.originalPrice);
        return sum + (quantity * (price || 0));
    }, 0);
    const totalCheckouts = orderHistoryData.length;
    const totalSales = orderHistoryData.reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0);

    const handleGoBack = () => {
        router.back();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-700">
                <p className="text-xl">Loading analytics data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 text-red-700 p-4">
                <p className="text-xl font-semibold">Error loading analytics:</p>
                <p className="text-lg mt-2">{error}</p>
                <button
                    onClick={handleGoBack}
                    className="mt-6 text-[#615FFF] border border-[#615FFF] px-4 py-2 rounded-lg hover:text-white hover:bg-[#615FFF] duration-150 cursor-pointer flex items-center"
                >
                    <ArrowLeft className="mr-2" /> Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white relative text-black w-full min-h-screen p-8">
            <button
                onClick={handleGoBack}
                className="absolute top-4 left-4 text-[#615FFF] border border-[#615FFF] px-3 py-2 rounded-lg hover:text-white hover:bg-[#615FFF] duration-150 cursor-pointer flex items-center z-10"
            >
                <ArrowLeft className="mr-2" /> Back
            </button>

            <div className="flex flex-col items-center justify-start min-h-screen pt-20">
                <div className="w-full max-w-4xl shadow-lg bg-white rounded-lg p-8">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center">
                            <TrendingUp className="mr-3 text-[#615FFF]" size={32} /> Sales Analytics
                        </h1>
                        <p className="text-gray-600 mt-2">Insights into your inventory and sales performance.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-blue-50 p-6 rounded-lg shadow-md flex flex-col items-center text-center border border-blue-200">
                            <Package size={48} className="text-blue-600 mb-3" />
                            <h2 className="text-xl font-semibold text-gray-800">Total Products</h2>
                            <p className="text-3xl font-bold text-blue-800 mt-2">{totalProductsInInventory.toFixed(2)}</p>
                            <p className="text-sm text-gray-500">Units in stock</p>
                        </div>
                        <div className="bg-green-50 p-6 rounded-lg shadow-md flex flex-col items-center text-center border border-green-200">
                            <DollarSign size={48} className="text-green-600 mb-3" />
                            <h2 className="text-xl font-semibold text-gray-800">Inventory Worth</h2>
                            <p className="text-3xl font-bold text-green-800 mt-2">₹{totalWorthInInventory.toFixed(2)}</p>
                            <p className="text-sm text-gray-500">Estimated value</p>
                        </div>
                        <div className="bg-purple-50 p-6 rounded-lg shadow-md flex flex-col items-center text-center border border-purple-200">
                            <ShoppingCart size={48} className="text-purple-600 mb-3" />
                            <h2 className="text-xl font-semibold text-gray-800">Total Checkouts</h2>
                            <p className="text-3xl font-bold text-purple-800 mt-2">{totalCheckouts}</p>
                            <p className="text-sm text-gray-500">Number of orders</p>
                        </div>
                        <div className="bg-yellow-50 p-6 rounded-lg shadow-md flex flex-col items-center text-center border border-yellow-200">
                            <TrendingUp size={48} className="text-yellow-600 mb-3" />
                            <h2 className="text-xl font-semibold text-gray-800">Total Sales</h2>
                            <p className="text-3xl font-bold text-yellow-800 mt-2">₹{totalSales.toFixed(2)}</p>
                            <p className="text-sm text-gray-500">Revenue generated</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;