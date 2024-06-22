import { trpc } from "./api"

export const Component = () => {
    const userQuery = trpc.getUser.useQuery('bilbo');
    const wordsCount = trpc.words.getCount.useQuery();

    return <div>
        <h1>Component! ({wordsCount.data})</h1>
        <br />
        <pre>{JSON.stringify(userQuery.data, null, 2)}</pre>
    </div>
}