import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CartProvider from "@/context/cartContext";
import { Toaster } from "react-hot-toast";
import InventoryProvider from "@/context/inventoryContext";
import AuthProvider from "@/context/authContext";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Balaji Bachat Bazar",
  description: "Buy more save more with balaji bachat bazar, your everyday place for groceries!!",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" webcrx="">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <CartProvider>
            <InventoryProvider>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <div className="flex flex-1 mt-16">
                  <Sidebar />
                  <main className="flex-1 ml-64 bg-gray-100">
                    {children}
                  </main>
                </div>
              </div>
              <Toaster position="bottom-right" />
            </InventoryProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
