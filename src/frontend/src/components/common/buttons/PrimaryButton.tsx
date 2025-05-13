import styled, { css } from 'styled-components';

export const primaryButtonMixin = css`
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    border: 1px solid transparent;
    padding: 0.6em 1.2em;
    font-size: 1em;
    font-weight: 500;
    font-family: inherit;
    text-align: center;
    background-color: var(--primary-color);
    cursor: pointer;
    color: #ffffff;
    text-decoration: none;
    transition: box-shadow ease 0.3s;

    &:hover {
        box-shadow: 0px 1px 10px 0px rgba(0, 0, 0, 0.197);
        transition: box-shadow ease 0.3s;
    }

    &:focus,
    &:focus-visible {
        outline: 4px auto -webkit-focus-ring-color;
    }

    &:disabled {
        cursor: default;
        box-shadow: none;
        background-color: var(--primary-color-disabled);
    }
`;

const PrimaryButton = styled.button`
    ${primaryButtonMixin}
`;

export default PrimaryButton;
