import styled from 'styled-components';
import FileConverterStateProvider from '../../context/FileConverterStateProvider';
import FileConverter from './fileconverter/FileConverter';
import H1 from '../common/headings/H1';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 30px;

    padding-top: 7vh;
`;

export default function Home() {
    return (
        <Wrapper>
            <H1>Audio & Video converter</H1>
            <FileConverterStateProvider>
                <FileConverter />
            </FileConverterStateProvider>
        </Wrapper>
    );
}
