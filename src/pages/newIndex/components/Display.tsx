import { FormEvent, useEffect, useRef, useState } from "react";
import EditIcon from '@mui/icons-material/Edit';
import { SentenceType } from "../types/SentenceType"
import "./Display.scss"
import SaveIcon from '@mui/icons-material/Save';
import EditOffIcon from '@mui/icons-material/EditOff';
import { IconButton } from "@mui/joy";

export const Display = (props: {
    isPending: boolean;
    onSelect: (id: number) => void;
    sentences: SentenceType[];
    activeSentenceId: string | number;
    className?: string;
    onTextChange: (text: string) => void;
    text: string;
}) => {
    const scrollContainer = useRef<HTMLDivElement>(null);
    const [isEditable, setIsEditable] = useState(false);
    const [text, setText] = useState(props.text)

    useEffect(() => {
        const activeElement = document.getElementById('sentence-' + props.activeSentenceId)
        if (!activeElement) return;
        // makse sure active element is visible or scroll the container to show the active element
        if (!scrollContainer.current) return;
        scrollContainer.current.scrollTop = activeElement.offsetTop - scrollContainer.current.clientHeight / 2 + activeElement.clientHeight / 2;
    }, [props.activeSentenceId])

    function handleEdit(): void {
        setIsEditable(true);
    }

    function handleReset(): void {
        setIsEditable(false);
        setText(props.text);
    }

    function handleSave(): void {
        if (!text?.length) {
            return
        }
        props.onTextChange(text);
        setIsEditable(false);
    }

    function handleTextChange(event: FormEvent<HTMLDivElement>): void {
        console.log("handle text change", event);
        const textContent = event.currentTarget.innerText;
        console.log({ textContent })
        setText(textContent ?? "")
    }

    return <div className={"display-wrapper relative " + props.className}>
        <div ref={scrollContainer} className="display" style={{
            height: 'calc(100dvh - 170px)'
        }}>
            <div className="absolute top-4 right-4">
                {!isEditable && <>
                    <IconButton onClick={handleEdit}>
                        <EditIcon />
                    </IconButton>
                </>}
                {isEditable && <>
                    <IconButton onClick={handleSave} disabled={!text.length} className="bg-white">
                        <SaveIcon />
                    </IconButton>
                    <IconButton onClick={handleReset}>
                        <EditOffIcon />
                    </IconButton>
                </>}
            </div>
            {isEditable && <div className="md:text-2xl text-lg -mt-1"  contentEditable={isEditable} onInput={handleTextChange} 
            style={{ whiteSpace: "pre-wrap",lineHeight: '2.8rem', }}>
                {props.text}
            </div>}
            {!isEditable && <p>
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
            }
        </div>
    </div>
}