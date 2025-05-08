import { InputHTMLAttributes } from 'react';

export default function SearchBar(props: InputHTMLAttributes<HTMLInputElement>) {
    return <input className="search-bar" type="text" {...props} />;
}
