import { Header } from "../Header/Header";

type PageProps = {
    headerTitle: string;
    backLink?: string;
    children: React.ReactNode;
}

export const Page = (props: PageProps) => {
    return <div className="page">
        <Header
            headerTitle={props.headerTitle}
            backLink={props.backLink}
        />
        <div className="page-content flex flex-col overflow-auto h-auto flex-grow pt-4" style={{height: "calc(100dvh - 50px)"}}>
            {props.children}
        </div>
    </div>;
}