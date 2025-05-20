"use client";

import React, { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

const AuthContext = createContext({
    isLoggedIn: false,
    login: () => { },
    logout: () => { },
});

const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token); 
    }, []);

    const login = (token, email) => {
        setIsLoggedIn(true);
        localStorage.setItem('token', token);
        localStorage.setItem('email', email);
        toast.success('Logged in successfully!');
        router.push('/'); 
    };

    const logout = () => {
        setIsLoggedIn(false);
        localStorage.removeItem('token');
        localStorage.removeItem('email');
        toast.success('Logged out successfully!');
        router.push('/'); 
    };

    const contextValue = {
        isLoggedIn,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;