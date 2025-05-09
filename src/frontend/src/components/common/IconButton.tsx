import classNames from 'classnames';
import React from 'react';

export default function IconButton({
    children,
    className,
    ...props
}: React.HTMLAttributes<HTMLButtonElement>) {
    return (
        <button className={classNames([className, 'icon-button'])} {...props}>
            {children}
        </button>
    );
}
