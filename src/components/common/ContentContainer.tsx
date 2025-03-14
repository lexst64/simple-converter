import React from "react"

export default function ContentContainer({ children }: React.PropsWithChildren) {
    return (
        <div className='content-container'>
            {children}
        </div>
    )
}
