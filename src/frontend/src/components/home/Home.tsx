import FileConverter from './fileconverter/FileConverter';

export default function Home() {
    return (
        <div className="home">
            <h1>Video converter</h1>
            <FileConverter />
        </div>
    );
}
