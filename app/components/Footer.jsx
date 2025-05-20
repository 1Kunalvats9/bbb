import React from 'react'

const Footer = () => {
  return (
    <footer  className="px-6 md:px-16 lg:px-24 xl:px-32 pt-8 w-full text-gray-500">
    <div className="flex flex-col md:flex-row justify-between w-full gap-10 border-b border-gray-500/30 pb-6">
        <div className="md:max-w-96">
            <img className="h-9" src="https://res.cloudinary.com/dzjlp82fv/image/upload/v1744896060/apnidukaanlogo_gp5akm.png" alt="dummyLogoDark" />
            <p className="mt-6 text-sm">
            Easily manage your shop's inventory, track sales, and use a simple checkout system – all in one place. Apni Dukaan helps local shopkeepers run their business smarter and faster, without any hassle.
            </p>
        </div>
        <div className="flex-1 flex items-start md:justify-end gap-20">
            <div>
                <h2 className="font-semibold mb-5 text-black">Company</h2>
                <ul className="text-sm space-y-2">
                    <li><a href="#" className='cursor-pointer hover:text-blue-500 duration-200'>Home</a></li>
                    <li><a href="#" className='cursor-pointer hover:text-blue-500 duration-200'>About us</a></li>
                    <li><a href="#" className='cursor-pointer hover:text-blue-500 duration-200'>Contact us</a></li>
                    <li><a href="#" className='cursor-pointer hover:text-blue-500 duration-200'>Privacy policy</a></li>
                </ul>
            </div>
            <div>
                <h2 className="font-semibold mb-5 text-black">Get in touch</h2>
                <div className="text-sm space-y-2">
                    <p className='cursor-pointer hover:text-blue-500 duration-200'>+1-212-456-7890</p>
                    <p className='cursor-pointer hover:text-blue-500 duration-200'>contact@example.com</p>
                </div>
            </div>
        </div>
    </div>
    <p className="pt-4 text-center text-xs md:text-sm pb-5">
        Copyright 2024 © Company name. All Right Reserved.
    </p>
</footer>
  )
}

export default Footer
