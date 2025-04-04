import classNames from "classnames";
import React from "react";

export default function IconButton({ children, className, ...rest }: React.HTMLAttributes<HTMLButtonElement>) {
    return (
        <button className={classNames([className, 'icon-button'])} {...rest}>
            <span className="material-symbols-outlined">{children}</span>
        </button>
    )
}
