import { Card, Skeleton } from "@heroui/react"
import { useState } from "react"

function ManageCard({children, title, image}) {
    const [imageLoaded, setImageLoaded] = useState(false)

    return (
        <Card className="flex flex-col w-110 h-100 p-0 pb-4 gap-2 relative hover:scale-105 transition-all duration-150">
            <div className="h-[80%] flex justify-center items-center overflow-hidden relative p-0 m-0">
                <img 
                    src={image} 
                    alt={image.split("/").pop().split(".")[0]} 
                    className={`absolute object-fill w-full h-full ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageLoaded(false)} />
                {!imageLoaded && <Skeleton className='h-full w-full rounded-xl' />}
            </div>
            <div className=" px-4 flex flex-col gap-2">
                <span className="text-2xl font-bold">{title}</span>
            {children}
            </div>
        </Card>
    )
}

export default ManageCard
