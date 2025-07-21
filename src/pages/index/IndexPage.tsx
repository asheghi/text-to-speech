import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUntilFirstByte } from "../../utils/fetchUntilFirstByte";
import { Form } from "./components/Form";
import { RequestState } from "./components/consts/RequestState";
import { Player } from "./components/Player";
import { Page } from "@/components/Page";
import qs from 'qs';
import { FormType } from "./FormType";
import { trpc } from "../../api";


export const IndexPage = (): JSX.Element => {
    const navigate = useNavigate();
    const shareContentMutation = trpc.tts.shareContent.useMutation();
    
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

    const handleRead = async function (): Promise<void> {
        if (!formState?.text?.trim() || !formState?.language || !formState?.model) {
            return;
        }

        try {
            const result = await shareContentMutation.mutateAsync({
                content: formState.text,
                language: formState.language,
                model: formState.model,
                speed: 1.0 // Default speed for IndexPage
            });
            
            navigate(`/reader/${result.shareId}`);
        } catch (error) {
            console.error('Failed to save content for reading:', error);
        }
    };


    const appName = import.meta.env.VITE_APP_TITLE ?? "Text To Speech";

    function handleStateChange(params: FormType): void {
        // compare formState with params
        if (JSON.stringify(params) !== JSON.stringify(formState)) {
            setFormState(params);
        }
    }


    return <Page headerTitle={appName} >
        <main className="mx-auto container flex flex-col gap-4">
            <Form
                player={state === RequestState.SUCCESS && <Player url={url} />}
                isPending={state === RequestState.PENDING}
                onFormChange={handleStateChange}
                onSubmit={handleFormSubmit}
                onRead={handleRead} />
        </main>
    </Page>
}