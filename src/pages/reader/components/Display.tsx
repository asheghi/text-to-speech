import { useEffect, useRef } from "react";
import { SentenceType } from "../types/SentenceType"

export const Display = (props: {
    isPending: boolean;
    onSelect: (id: number) => void;
    sentences: SentenceType[];
    activeSentenceId: string | number;
}) => {
    const scrollContainer = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const activeElement = document.getElementById('sentence-' + props.activeSentenceId)
        if (!activeElement) return;
        // makse sure active element is visible or scroll the container to show the active element
        if (!scrollContainer.current) return;
        scrollContainer.current.scrollTop = activeElement.offsetTop - scrollContainer.current.clientHeight / 2 + activeElement.clientHeight / 2;
    }, [props.activeSentenceId])

    return <div className="border rounded-xl shadow-xl border-gray-300 overflow-hidden px-2 h-full flex-grow">
        <div ref={scrollContainer} className="flex flex-col gap-1 max-h-[80vh] overflow-x-auto scroll-smooth my-4">
            {props.sentences.map(it => {
                const isActive = it.id === props.activeSentenceId;
                return <span
                    onClick={() => {
                        props.onSelect(it.id)
                    }}
                    id={'sentence-' + it.id}
                    key={it.id} className={`rounded-md px-2 py-1 md:text-2xl text-lg self-start transition-all ` + (props.isPending && isActive ? "bg-gray-300" : isActive ? " bg-sky-200 " : " cursor-pointer hover:bg-gray-300")}>
                    {it.text}
                </span>
            })}
        </div>
    </div>
}