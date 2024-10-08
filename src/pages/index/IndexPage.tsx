import { useState } from "react";
import { fetchUntilFirstByte } from "../../utils/fetchUntilFirstByte";
import { Form } from "./components/Form";
import { RequestState } from "./components/consts/RequestState";
import { Player } from "./components/Player";
import { Page } from "@/components/Page";
import qs from 'qs';
import { FormType } from "./FormType";
import ReadIcon from '@mui/icons-material/AutoStories';
import {Button} from '@mui/joy'


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

    function handleStateChange(params: FormType): void {
        // compare formState with params
        if (JSON.stringify(params) !== JSON.stringify(formState)) {
            setFormState(params);
        }
    }

    const canRead = formState?.language && formState.model;

    return <Page headerTitle={appName} >
        <main className="mx-auto container flex flex-col gap-4">
            <Form
                player={state === RequestState.SUCCESS && <Player url={url} />}
                isPending={state === RequestState.PENDING}
                onFormChange={handleStateChange}
                onSubmit={handleFormSubmit} />
            {canRead && <Button
                className="self-end"
                component="a"
                href={readerLink}
                color="neutral"
            >
                <ReadIcon />
                Read ️
            </Button>}
        </main>
    </Page>
}