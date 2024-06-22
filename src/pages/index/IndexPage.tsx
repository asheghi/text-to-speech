import { Link } from "react-router-dom";
import { trpc } from "../../api"

export const IndexPage = (): JSX.Element => {
    const wordsQuery = trpc.words.getWordsList.useQuery();

    if (wordsQuery.isPending) {
        return <p>Loading...</p>
    }

    if (wordsQuery.isError) {
        return <p>Error</p>
    }

    return <main className="container mx-auto">
        <div className="flex flex-col gap-1">
            {wordsQuery.data?.map((word) => {
                return <Link key={word._id} to={`/word/${word.word}`}>
                    {word.word}
                </Link>
            })
            }
        </div>
    </main>
}