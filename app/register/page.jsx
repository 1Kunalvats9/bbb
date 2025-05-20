'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const Page = () => {
    const [shopName, setShopName] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [city, setCity] = useState('');
    const [loading, setLoading] = useState(false); 
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = { shopName, ownerName, email, password, city, phoneNumber };
        setLoading(true); 
        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await res.json();

            if (res.ok) {
                console.log('User created');
                toast.success('Registered Successfully');
                router.push('/login');
            } else {
                let errorMessage = 'Failed to register. Please try again.';
                if (res.status === 409) {
                    errorMessage = result.message || 'Email already exists.'; // Use result.message if available
                }
                toast.error(errorMessage);
                console.error('Error in registering the user', result);
            }
        } catch (err) {
            const errorMessage = 'An error occurred. Please check your network and try again.';
            toast.error(errorMessage);
            console.log('Error in registering the user', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white w-[100vw] h-[100vh] flex items-center gap-5 justify-center">
            <form
                className="max-w-[85%] md:max-w-[50%] w-full text-center border px-8 bg-gray-400/10 backdrop-blur-md border-white/30 rounded-xl shadow-sm p-6"
                onSubmit={handleSubmit}
            >
                <h1 className="text-gray-900 text-3xl mt-10 font-medium">Register</h1>
                <p className="text-gray-500 text-sm mt-2">Please sign up to continue</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-10 place-items-center">
                    <div className="flex items-center justify-center w-full  bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width={20} height={16} fill="#6B7280" viewBox="0 0 512 512">
                            <path d="M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Shop Name"
                            className="bg-transparent text-gray-500 placeholder-gray-500 outline-none text-sm w-full h-full"
                            required
                            value={shopName}
                            onChange={(e) => setShopName(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center justify-center w-full  bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width={20} height={16} fill="#6B7280" viewBox="0 0 448 512">
                            <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Owner Name"
                            className="bg-transparent text-gray-500 placeholder-gray-500 outline-none text-sm w-full h-full"
                            required
                            value={ownerName}
                            onChange={(e) => setOwnerName(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
                        <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M0 .55.571 0H15.43l.57.55v9.9l-.571.55H.57L0 10.45zm1.143 1.138V9.9h13.714V1.69l-6.503 4.8h-.697zM13.749 1.1H2.25L8 5.356z" fill="#6B7280" />
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
                    <div className="flex items-center w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
                        <svg width="13" height="17" viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z" fill="#6B7280" />
                        </svg>
                        <input
                            type="number"
                            placeholder="Phone number"
                            className="bg-transparent appearance-none text-gray-500 placeholder-gray-500 outline-none text-sm w-full h-full"
                            required
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width={20} height={16} fill="#6B7280" viewBox="0 0 640 512">
                            <path d="M480 48c0-26.5-21.5-48-48-48L336 0c-26.5 0-48 21.5-48 48l0 48-64 0 0-72c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 72-64 0 0-72c0-13.3-10.7-24-24-24S64 10.7 64 24l0 72L48 96C21.5 96 0 117.5 0 144l0 96L0 464c0 26.5 21.5 48 48 48l256 0 32 0 96 0 160 0c26.5 0 48-21.5 48-48l0-224c0-26.5-21.5-48-48-48l-112 0 0-144zm96 320l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16zM240 416l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16zM128 400c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 32zM560 256c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16l32 0zM256 176l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16zM112 160c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16l32 0zM256 304c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 32zM112 320l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16zm304-48l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16zM400 64c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16l32 0zm16 112l0 32c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="City name"
                            className="bg-transparent text-gray-500 placeholder-gray-500 outline-none text-sm w-full h-full"
                            required
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex items-center w-full md:w-1/2 mt-5 bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
                    <svg width="13" height="17" viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z" fill="#6B7280" />
                    </svg>
                    <input
                        type="password"
                        placeholder="Password"
                        className="bg-transparent appearance-none text-gray-500 placeholder-gray-500 outline-none text-sm w-full h-full"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <button
                    type="submit"
                    className="mt-10 w-full h-11 rounded-full text-white bg-indigo-500 hover:opacity-90 transition-opacity cursor-pointer"
                    disabled={loading}
                >
                    {loading ? 'Registering...' : 'Register'}
                </button>
                <p className="text-gray-500 cursor-pointer text-sm mt-3 mb-11">
                    Already have an account?{' '}
                    <a
                        className="text-indigo-500"
                        onClick={() => {
                            router.push('/login');
                        }}
                    >
                        Log in
                    </a>
                </p>
            </form>
        </div>
    );
};

export default Page;
