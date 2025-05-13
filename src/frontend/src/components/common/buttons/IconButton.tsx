import styled, { css } from 'styled-components';

export const iconButtonMixin = css`
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
`;

const IconButton = styled.button`
    ${iconButtonMixin}
`;

export default IconButton;
