import { useEffect, useRef } from "react";
import { SentenceType } from "../types/SentenceType"
import "./Display.scss"

export const Display = (props: {
    isPending: boolean;
    onSelect: (id: number) => void;
    sentences: SentenceType[];
    activeSentenceId: string | number;
    className?: string;
}) => {
    const scrollContainer = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const activeElement = document.getElementById('sentence-' + props.activeSentenceId)
        if (!activeElement) return;
        // makse sure active element is visible or scroll the container to show the active element
        if (!scrollContainer.current) return;
        scrollContainer.current.scrollTop = activeElement.offsetTop - scrollContainer.current.clientHeight / 2 + activeElement.clientHeight / 2;
    }, [props.activeSentenceId])

    return <div className={"display-wrapper " + props.className}>
        <div ref={scrollContainer} className="display" style={{
            height: 'calc(100dvh - 170px)'
        }}>
            <p>
                {props.sentences.map((it, index) => {
                    const isActive = index === props.activeSentenceId;
                    return <>
                        <span
                            onClick={() => {
                                props.onSelect(index)
                            }}
                            id={'sentence-' + index}
                            key={index}
                            className={`sentence ` + (props.isPending && isActive ? " loading " : isActive ? " active " : "")}>
                            {it.trim()}
                        </span>
                        {it.endsWith('\n') && <br className="block mb-3" style={{ content: "''" }} />}
                    </>
                })}
            </p>
        </div>
    </div>
}