import { useRouteError } from "react-router-dom";

export const ErrorPage = (): JSX.Element => {
    const error = useRouteError() as { statusText: string, message: string } | undefined;

    console.error(error);

    return <main className="container">
        <div id="error-page">
            <h1>Oops!</h1>
            <p>Sorry, an unexpected error has occurred.</p>
            <p>
                <i>{error?.statusText || error?.message}</i>
            </p>
        </div>
    </main>
}