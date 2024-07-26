import { useState } from "react";
import { fetchUntilFirstByte } from "../../utils/fetchUntilFirstByte";
import { Form } from "./components/Form";
import { RequestState } from "./components/consts/RequestState";
import { Player } from "./components/Player";
import { Page } from "@/components/Page";
import { Link } from "react-router-dom";
import qs from 'qs';
import { FormType } from "./FormType";


export const IndexPage = (): JSX.Element => {
    const [state, setState] = useState<RequestState | undefined>();
    const [url, setUrl] = useState<string>();
    const [formState, setFormState] = useState<FormType>();

    const handleFormSubmit = async function (): Promise<void> {
        const query = qs.stringify(formState)
        const url = "/api/tts.wav?" + query;
        setState(RequestState.PENDING);
        try {
            await fetchUntilFirstByte(url);
            setUrl(url);
        } catch (error) {
            setState(RequestState.FAILED);
        }
        setState(RequestState.SUCCESS);
    };

    const readerLink = '/reader?' + qs.stringify(formState)


    const appName = import.meta.env.VITE_APP_TITLE ?? "Text To Speech";
    
    return <Page headerTitle={appName} >
        <main className="mx-auto container flex flex-col gap-4">
            <Form player={<Player url={url} state={state} />} isPending={state === RequestState.PENDING} onFormChange={state => setFormState(state)} onSubmit={handleFormSubmit} />
            <Link
                type="submit"
                className="self-end bg-blue-500 text-white px-4 py-2 rounded-md text-xl font-semibold"
                to={readerLink}
            >Read ️📖</Link>
        </main>
    </Page>
}