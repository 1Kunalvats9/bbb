"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/authContext'; 
import { useCart } from '@/context/cartContext';

const Navbar = () => {
    const [open, setOpen] = useState(false);
    const { isLoggedIn, logout } = useAuth(); 
    const { cartItems } = useCart()
    const router = useRouter();

    const handleRedirect = () => {
        if (isLoggedIn) {
          router.push('/');
        } else {
          router.push('/login');
        }
    };

    return (
        <nav className="flex items-center justify-between px-6 md:px-16 lg:px-24 xl:px-32 py-4 border-b border-gray-200 bg-white fixed top-0 left-0 w-full z-50 transition-all">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Balaji Bachat Bazar</span>
            </h2>

            {/* Desktop Menu */}
            <div className="hidden sm:flex items-center text-black gap-8">
                {/* <a href="/" className="hover:scale-105 duration-200">Home</a>
                <a href="#" className="hover:scale-105 duration-200">About</a>
                <a href="#" className="hover:scale-105 duration-200">Contact</a> */}

                {isLoggedIn && (
                    <>
                        <div className="relative cursor-pointer" onClick={()=>{router.push('/barcodeScanCart')}}>
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 14 14"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M.583.583h2.333l1.564 7.81a1.17 1.17 0 0 0 1.166.94h5.67a1.17 0 0 0 1.167-.94l.933-4.893H3.5m2.333 8.75a.583.583 0 1 1-1.167 0 .583.583 0 0 1 1.167 0m6.417 0a.583.583 0 1 1-1.167 0 .583.583 0 0 1 1.167 0"
                                    stroke="#615fff"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <button className="absolute -top-2 -right-3 text-xs text-white bg-indigo-500 w-[18px] h-[18px] rounded-full">
                                {cartItems.length}
                            </button>
                        </div>
                    </>
                )}
                <button
                    className="cursor-pointer px-8 py-2 bg-indigo-500 hover:bg-indigo-600 transition text-white rounded-full"
                    onClick={isLoggedIn ? logout : handleRedirect}
                >
                    {isLoggedIn ? 'Logout' : 'Login'}
                </button>
            </div>

            <div className={`flex items-center gap-6 sm:hidden`}>
                {/* Mobile Menu */}
                <button
                    onClick={() => setOpen(!open)}
                    aria-label="Menu"
                    className="sm:hidden"
                >
                    {/* Menu Icon SVG */}
                    <svg
                        width="21"
                        height="15"
                        viewBox="0 0 21 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <rect width="21" height="1.5" rx=".75" fill="#426287" />
                        <rect x="8" y="6" width="13" height="1.5" rx=".75" fill="#426287" />
                        <rect x="6" y="13" width="15" height="1.5" rx=".75" fill="#426287" />
                    </svg>
                </button>
            </div>

            {/* Mobile Menu */}
            <div
                className={`${open ? 'flex' : 'hidden'
                    } absolute top-[60px] left-0 w-full z-100 bg-white shadow-md py-4 flex-col items-start gap-2 px-5 text-sm md:hidden text-black duration-700`}
            >
                <a href="#" className="block">
                    Home
                </a>
                <a href="#" className="block">
                    About
                </a>
                <a href="#" className="block">
                    Contact
                </a>
                <button
                    className="cursor-pointer px-6 py-2 mt-2 bg-indigo-500 hover:bg-indigo-600 transition text-white rounded-full text-sm"
                    onClick={isLoggedIn ? logout : handleRedirect}
                >
                    {isLoggedIn ? 'Logout' : 'Login'}
                </button>
            </div>
        </nav>
    );
};

export default Navbar;