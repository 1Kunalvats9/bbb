'use client'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import React from 'react'

const dashboardHeroCard = ({title, link="", value=""}) => {
    const router = useRouter()
  return (
    <div className='flex-1 rounded-xl min-h-[90px] md:min-h-[110px] cursor-pointer transition-all hover:scale-105 hover:border border-black duration-200 bg-white px-4 py-3 hover:bg-blue-100' onClick={()=>{
        router.push(link)
    }}>
        <h1 className='text-lg md:text-xl lg:text-2xl font-medium tracking-wider hover:text-blue-300 duration-200 text-black'>{title}</h1>
        {
            value.length>0 && <p className='text-green-500 text-xl md:text-2xl lg:text-3xl font-medium mt-2'>{value}</p>
        }
    </div>
  )
}

export default dashboardHeroCard
