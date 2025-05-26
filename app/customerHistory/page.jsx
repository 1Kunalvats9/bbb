'use client'

import React, { useState, useEffect } from 'react';

const CustomerHistoryPage = () => {
    const [search, setSearch] = useState('');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            setError(null);
            let url = '/api/customerHistory';
            if (search) {
                url = `/api/getCustomerHistory?search=${search}`; // Use the correct route
            }
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch history: ${response.status}`);
                }
                const data = await response.json();
                setHistory(data);
            } catch (err) {
                setError(err.message || 'An error occurred while fetching customer history.');
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [search]); //  search as dependency

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        };
        return date.toLocaleDateString(undefined, options);
    };

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-2xl md:text-3xl font-semibold mb-4 md:mb-6 text-gray-800">Customer Order History</h1>

            <div className="mb-4 md:mb-6 flex items-center">
                <input
                    type="text"
                    placeholder="Search by name or phone number..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full md:w-1/2 lg:w-1/3 border border-gray-300 text-black rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 ml-2 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
            </div>

            {loading ? (
                <p>Loading order history...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : history.length === 0 ? (
                <p>No order history found for the given search criteria.</p>
            ) : (
                <div className="space-y-4">
                    {history.map((order, index) => (
                        <div
                            key={index}
                            className="shadow-md border border-gray-200 rounded-md bg-white p-4 md:p-6"
                        >
                            <div className="flex justify-between items-start md:items-center flex-col md:flex-row">
                                <div className="mb-2 md:mb-0">
                                    {order.customerPhoneNumber && (
                                        <p className="text-lg font-bold text-gray-800">
                                            Phone number: {order.customerPhoneNumber}
                                        </p>
                                    )}
                                </div>

                                <div className="text-right">
                                    <p className="text-sm text-gray-600">
                                        Order Time: {formatDate(order.orderTime)}
                                    </p>
                                    <p className="text-lg font-semibold text-gray-800">
                                        Total: ₹{order.totalAmount.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Order Details:</h3>
                                {order.products.map((product, pIndex) => (
                                    <div
                                        key={pIndex}
                                        className="flex justify-between items-center py-1 border-b border-gray-200 last:border-b-0"
                                    >
                                        <p className="text-gray-600">
                                            {product.itemName} x {product.quantity}
                                        </p>
                                        <p className="text-gray-700">
                                            ₹{(product.price * product.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomerHistoryPage;