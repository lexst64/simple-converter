import styled from 'styled-components';

const SearchBar = styled.input.attrs(() => ({ type: 'text' }))`
    padding: 5px 10px;
    border-radius: 8px;
    background: none;
    color: var(--text-color);
    border: 2px solid #999;
    outline: none;
    transition: border 0.2s ease;
`;

export default SearchBar;
