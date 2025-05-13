import styled from 'styled-components';
import { secondaryButtonMixin } from './SecondaryButton';

const SecondaryLinkButton = styled.a<{ $small: boolean }>`
    ${secondaryButtonMixin}
`;

export default SecondaryLinkButton;
