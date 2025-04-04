import { useContext } from "react";
import { StatusContext, StatusContextType } from "../context/StatusProvider";

export const useStatus = (): StatusContextType => {
    const context = useContext(StatusContext);
    if (!context) {
        throw new Error("useStatus must be used within a StatusProvider");
    }
    return context;
}
