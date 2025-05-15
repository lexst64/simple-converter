import { Badge, Button, Card, Stack } from 'react-bootstrap';
import { ConversionData } from '../../main';
import { MdArrowForward } from 'react-icons/md';
import { toHumanReadable, toRelativeTime } from '../../utils';

interface ConversionItemProps {
    onDownload: (conversionId: string) => void;
    onDelete: (conversionId: string) => void;

    conversionData: ConversionData;
}

export default function ConversionItem({
    conversionData,
    onDownload,
    onDelete,
}: ConversionItemProps) {
    return (
        <Card bg="light">
            <Card.Body>
                <Stack className="gap-3">
                    <Stack
                        direction="horizontal"
                        className="justify-content-between align-items-center"
                    >
                        <Stack direction="vertical">
                            <Card.Subtitle>
                                <Stack direction="horizontal">
                                    <span>{conversionData.filename}</span>
                                    <div className="vr mx-2"></div>
                                    <small className="text-body-secondary">
                                        {toHumanReadable(conversionData.size)}
                                    </small>
                                </Stack>
                            </Card.Subtitle>
                            <Card.Text>{toRelativeTime(conversionData.timestamp)}</Card.Text>
                        </Stack>
                        <Stack direction="horizontal" gap={1}>
                            <Badge bg="secondary">{conversionData.inputFormat.toUpperCase()}</Badge>
                            <MdArrowForward size={'1em'} />
                            <Badge bg="success">{conversionData.outputFormat.toUpperCase()}</Badge>
                        </Stack>
                    </Stack>
                    <Stack direction="horizontal" gap={1}>
                        <Button
                            as="a"
                            href="#"
                            onClick={() => onDownload(conversionData.id)}
                            variant="primary"
                            size="sm"
                        >
                            Download
                        </Button>
                        <Button
                            onClick={() => onDelete(conversionData.id)}
                            variant="outline-danger"
                            size="sm"
                        >
                            Delete
                        </Button>
                    </Stack>
                </Stack>
            </Card.Body>
        </Card>
    );
}
