/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams } from "react-router-dom"
import { trpc } from "../../api"

export const WordDetailsPage = (): JSX.Element => {
    const params = useParams<{ word: string }>();

    if (!params.word) {
        return <div>No word</div>;
    }

    const wordQuery = trpc.words.getWord.useQuery({ word: decodeURI(params.word) })

    if (wordQuery.isLoading) {
        return <div>Loading...</div>
    }

    if (wordQuery.isError) {
        return <div> {wordQuery.error.message}</div>
    }

    const it = wordQuery.data;
    if (!it) {
        return <div>No word found</div>;
    }
    return <div className="container mx-auto">
        <h1>{it.word}</h1>
        <pre>{JSON.stringify(wordQuery.data, null, 2)}</pre>
    </div>
}