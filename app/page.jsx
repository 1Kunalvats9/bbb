"use client"
import FeatureCard from "./components/FeatureCard";
import Footer from "./components/Footer";
import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import FeedbackForm from "./components/FeedbackForm";
import { useRouter } from "next/navigation";


export default function Home() {
  const router = useRouter()
  const [isLoggedIn, setisLoggedIn] = useState(false)

  useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) {
            setisLoggedIn(false)
            router.push('/')
        } else {
            setisLoggedIn(true)
        }
    }, [isLoggedIn])
    useEffect(()=>{
      router.refresh()
      return
    },[])
  return (
    <div>
      <Navbar isLoggedIn={isLoggedIn} setisLoggedIn={setisLoggedIn}/>
      {/*Intro Section */}
      <section id="home" className="w-full mt-14 flex items-center justify-center text-center py-24 px-4 bg-white">
        <div className="max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Apni Dukaan</span> Smart Tool for Every Local Shop
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Easily manage your shop's inventory, track sales, and use a simple checkout system – all in one place. Apni Dukaan helps local shopkeepers run their business smarter and faster, without any hassle.
          </p>
          <div className="flex justify-center space-x-4">
            <button onClick={() => {
              isLoggedIn ? router.push('/dashboard'):router.push('/login')
            }} className="px-6 py-3 hover:bg-[#3e3be5] cursor-pointer text-white rounded-md bg-[#615FFF] transition">
              Dashboard
            </button>
            <button onClick={() => {
              isLoggedIn ? router.push('/dashboard'):router.push('/login')
            }} className="px-6 cursor-pointer py-3 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition">
              Get Started
            </button>
          </div>
        </div>
      </section>
      {/*Feature Section */}
      <section className="px-4 py-20 bg-gray-100">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-12">
            Our features
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
            <FeatureCard image="https://png.pngtree.com/png-vector/20230407/ourmid/pngtree-cogwheel-line-icon-vector-png-image_6680436.png" title="Inventory Control" description="Add, remove, or update products easily to keep your stock in check." />
            <FeatureCard image="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBqvw9fFq2uIc9H7kVCAz964W5Lw9CvK7BrQ&s" title="Quantity Edit" description="Quickly change product quantities as items come and go." />
            <FeatureCard image="https://static.vecteezy.com/system/resources/previews/005/101/577/non_2x/checkout-icon-style-vector.jpg" title="Easy Checkout" description="Simple checkout system to manage every sale smoothly." />
            <FeatureCard image="https://static.vecteezy.com/system/resources/thumbnails/000/583/708/small/shop.jpg" title="Online Storefront" description="Get your own webpage where customers can browse and shop locally." />
            <FeatureCard image="https://cdn.iconscout.com/icon/free/png-256/free-pre-order-icon-download-in-svg-png-gif-file-formats--shopping-ecommerce-shop-e-commerce-pack-icons-2702030.png?f=webp&w=256" title="Preorder System" description="Let customers preorder items for easy pickup or delivery." />
            <FeatureCard image="https://static.thenounproject.com/png/4303242-200.png" title="Real-Time Updates" description="Keep your product list and stock status always up-to-date." />
          </div>
        </div>
      </section>
      <div className="w-full bg-[#F5F7FF] py-10 h-full flex items-center justify-center">
        <FeedbackForm />
      </div>
      <Footer />
    </div>
  );
}
