import React from "react";

interface UploadButtonProps extends React.HTMLAttributes<HTMLLabelElement> {
    onFileChange: React.ChangeEventHandler<HTMLInputElement>
}

export default function FileSelectButton({ onFileChange, children, className }: UploadButtonProps) {
    return (
        <label className={className || 'primary-button'}>
            <input id="file" type="file" onChange={onFileChange} />
            {children}
        </label>
    )
}
