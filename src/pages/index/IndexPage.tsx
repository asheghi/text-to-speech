import { useState } from "react";
import { fetchUntilFirstByte } from "../../utils/fetchUntilFirstByte";
import { textToFileName } from "../../utils/textToFilename";
import { Form } from "./components/Form";
import qs from 'qs'
import { RequestState } from "./components/consts/RequestState";
import { Player } from "./components/Player";

export const IndexPage = (): JSX.Element => {
    const [state, setState] = useState<RequestState | undefined>();
    const [url, setUrl] = useState<string>();
    const [filename, setFilename] = useState<string>();

    const handleFormSubmit = async function (params: { model: string; text: string; }): Promise<void> {
        const query = qs.stringify(params)
        const url = "/api/tts?" + query;
        setState(RequestState.PENDING);
        try {
            await fetchUntilFirstByte(url);
            setUrl(url);
            setFilename(textToFileName(params.text) + '.wav')
        } catch (error) {
            setState(RequestState.FAILED);
        }
        setState(RequestState.SUCCESS);
    };

    return <main className="mx-auto container">
        <Form isPending={state === RequestState.PENDING} onSubmit={handleFormSubmit} />
        <Player className="py-2" url={url} state={state} filename={filename} />
    </main>
}