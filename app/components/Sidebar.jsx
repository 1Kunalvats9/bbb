'use client'
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; 

const navLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Add Product', href: '/addProduct' },
    { name: 'Customer History', href: '/customerHistory' },
    { name: 'Cart', href: '/cart' },
];

const Sidebar = () => {
    const pathname = usePathname(); 
    const baseLinkClasses = "flex items-center px-4 py-3 rounded-lg text-lg font-medium text-gray-700 hover:bg-gray-200 transition-colors duration-200";
    const activeLinkClasses = "bg-indigo-100 text-indigo-800 font-semibold"; 

    return (
        <aside className="w-64 bg-white shadow-lg h-screen fixed top-0 left-0 pt-20 border-r border-gray-200 z-40">
            <nav className="p-4 space-y-2">
                {navLinks.map((link) => {
                    const isActive = pathname === link.href;

                    return (
                        // Changed: Removed passHref and legacyBehavior, moved className directly to Link
                        <Link href={link.href} key={link.name} className={`${baseLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
                            {link.name}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;