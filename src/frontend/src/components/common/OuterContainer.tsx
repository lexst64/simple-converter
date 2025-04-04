import React from "react"

export default function OuterContainer({ children }: React.PropsWithChildren) {
    return (
        <div className='outer-container'>
            {children}
        </div>
    )
}
