import styled, { keyframes } from 'styled-components';

const spin = keyframes`
    0% {
            transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
`;

const CircularLoader = styled.div`
    /* animation optimization */
    will-change: transform;
    transform: translateZ(0);
    backface-visibility: hidden;

    border: 3px solid #f3f3f3;
    border-top: 3px solid var(--primary-color);
    border-radius: 50%;
    width: 16px;
    height: 16px;
    animation: ${spin} 1s linear infinite;
`;

export default CircularLoader;
