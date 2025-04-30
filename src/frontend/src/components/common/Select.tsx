import classNames from 'classnames';
import { HTMLAttributes, useId } from 'react';

export interface Option {
    value: string;
    label: string;
}

interface SelectProps extends HTMLAttributes<HTMLSelectElement> {
    options: Option[];

    value?: string;
    label?: string;
}

export default function Select({ options, label, className, ...props }: SelectProps) {
    const selectId = useId();

    return (
        <p>
            {label && <label htmlFor={selectId}>{label}</label>}
            <select className={classNames('select', className)} id={selectId} {...props}>
                {options.map(opt => (
                    <option className="option" key={opt.value} value={opt.value}>
                        <span className="option-label">{opt.label}</span>
                    </option>
                ))}
            </select>
        </p>
    );
}
