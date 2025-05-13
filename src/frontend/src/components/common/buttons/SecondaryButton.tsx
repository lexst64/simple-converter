import styled, { css } from 'styled-components';

export const secondaryButtonMixin = css<{ $small: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 8px;
    border: 2px solid var(--primary-color);
    font-family: inherit;
    text-align: center;
    background: none;
    cursor: pointer;
    color: var(--primary-color);
    text-decoration: none;

    ${props =>
        props.$small
            ? css`
                  padding: 0.25em 0.8em;
                  font-size: 0.9em;
              `
            : css`
                  padding: 0.6em 1.2em;
                  font-size: 1em;
              `}

    transition: box-shadow ease 0.3s;
`;

const SecondaryButton = styled.button<{ $small: boolean }>`
    ${secondaryButtonMixin}
`;

export default SecondaryButton;
