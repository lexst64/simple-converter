import { MdRebaseEdit } from 'react-icons/md';
import styled from 'styled-components';
import { nonSelectableMixin } from '../../../mixins';

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;

    color: #ffffff;

    ${nonSelectableMixin}
`;

const Name = styled.span`
    @media (max-width: 400px) {
        display: none;
    }
`;

export default function NavbarLogo() {
    return (
        <Wrapper>
            <MdRebaseEdit size="1.5em" />
            <Name>Simple Converter</Name>
        </Wrapper>
    );
}
