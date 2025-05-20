"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/authContext';

const LoginPage = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, isLoggedIn } = useAuth();

    useEffect(() => {
        if (isLoggedIn) {
            router.push('/dashboard');
        }
    }, [isLoggedIn, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                login(data.token, email);
            } else {
                setError(data.message);
                toast.error(data.message);
            }
        } catch (err) {
            toast.error('Cannot login');
            console.error('Error in user login:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white w-screen h-screen flex items-center gap-5 justify-center">
            <form
                className="max-w-96 w-full text-center border px-8 bg-gray-400/10 backdrop-blur-md border-white/30 rounded-xl shadow-sm p-6"
                onSubmit={handleSubmit}
            >
                <h1 className="text-gray-900 text-3xl mt-10 font-medium">Login</h1>
                <p className="text-gray-500 text-sm mt-2">Please sign in to continue</p>
                <div className="flex items-center w-full mt-10 bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
                    <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M0 .55.571 0H15.43l.57.55v9.9l-.571.55H.57L0 10.45zm1.143 1.138V9.9h13.714V1.69l-6.503 4.8h-.697zM13.749 1.1H2.25L8 5.356z"
                            fill="#6B7280"
                        />
                    </svg>
                    <input
                        type="email"
                        placeholder="Email id"
                        className="bg-transparent text-gray-500 placeholder-gray-500 outline-none text-sm w-full h-full"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="flex items-center mt-4 w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
                    <svg width="13" height="17" viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z"
                            fill="#6B7280"
                        />
                    </svg>
                    <input
                        type="password"
                        placeholder="Password"
                        className="bg-transparent text-gray-500 placeholder-gray-500 outline-none text-sm w-full h-full"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <div className="mt-5 text-left text-indigo-500">
                    <a className="text-sm cursor-pointer" href="#">Forgot password?</a>
                </div>
                {error && (
                    <div className="mt-5 text-left text-red-500">
                        <h1>{error}</h1>
                    </div>
                )}

                <button
                    type="submit"
                    className="mt-2 w-full h-11 rounded-full text-white bg-indigo-500 hover:opacity-90 transition-opacity cursor-pointer"
                    disabled={loading}
                >
                    {loading ? 'Logging in....' : 'Log in'}
                </button>
                <p className="text-gray-500 cursor-pointer text-sm mt-3 mb-11">
                    Don’t have an account?{' '}
                    <span
                        className="text-indigo-500"
                        onClick={() => router.push('/register')}
                    >
                        Sign up
                    </span>
                </p>
            </form>
        </div>
    );
};

export default LoginPage;