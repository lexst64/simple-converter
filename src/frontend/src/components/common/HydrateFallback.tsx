import { Container, Spinner, Stack } from 'react-bootstrap';

export default function HydrateFallback() {
    return (
        <Container className="h-100 my-auto">
            <Stack className="text-center" gap={2}>
                <Spinner className="mx-auto"></Spinner>
                <h6 className="align-center">Loading...</h6>
            </Stack>
        </Container>
    );
}
