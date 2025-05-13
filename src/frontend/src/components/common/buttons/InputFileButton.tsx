import React from 'react';
import styled from 'styled-components';
import { primaryButtonMixin } from './PrimaryButton';
import { secondaryButtonMixin } from './SecondaryButton';

interface InputFileButtonProps extends React.HTMLAttributes<HTMLLabelElement> {
    primary?: boolean;
    onFileChange: React.ChangeEventHandler<HTMLInputElement>;
}

const FileInputLabel = styled.label<{ $primary: boolean; $small: boolean }>`
    ${props => (props.$primary ? primaryButtonMixin : secondaryButtonMixin)};
`;

const FileInput = styled.input`
    display: none;
`;

export default function InputFileButton({
    onFileChange,
    children,
    primary = false,
}: InputFileButtonProps) {
    return (
        <FileInputLabel $primary={primary} $small={false}>
            <FileInput id="file" type="file" onChange={onFileChange} />
            {children}
        </FileInputLabel>
    );
}
