import { useLoaderData } from 'react-router';
import { historyLoader } from '../../main';
import ConversionItem from './ConversionItem';
import { Container, Stack } from 'react-bootstrap';
import { useCallback } from 'react';

export default function History() {
    const conversions = useLoaderData<typeof historyLoader>();

    const handleDownload = useCallback((id: string) => {
        console.log(id);
    }, []);

    const handleDelete = useCallback((id: string) => {
        console.log(id);
    }, []);

    return (
        <Container>
            <Stack className="mt-3 mt-md-4 col-md-8 mx-auto gap-2">
                {conversions.length === 0 ? (
                    <p className="text-center">Nothing here so far</p>
                ) : (
                    <>
                        <h4 className="mx-4">Recent</h4>
                        <Stack className="gap-3">
                            {conversions.map(item => (
                                <ConversionItem
                                    onDownload={handleDownload}
                                    onDelete={handleDelete}
                                    key={item.id}
                                    conversionData={item}
                                />
                            ))}
                        </Stack>
                    </>
                )}
            </Stack>
        </Container>
    );
}
