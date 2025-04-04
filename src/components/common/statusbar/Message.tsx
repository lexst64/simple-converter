import { ReactNode } from "react";
import { StatusMessageLevel } from "../../../types";
import IconButton from "../IconButton";


interface MessageProps {
    level: StatusMessageLevel;
    children: ReactNode;

    onClose: () => void;
}

export default function Message({ children, level = 'info', onClose }: MessageProps) {
    return (
        <div className={`status-bar-message ${level}`}>
            {children}
            <IconButton onClick={onClose}>close</IconButton>
        </div>
    )
}
