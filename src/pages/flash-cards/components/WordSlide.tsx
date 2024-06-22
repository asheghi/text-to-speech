import { useEffect } from "react";
import { trpc } from "../../../api";

function playAudio(url: string) {
    const audio = new Audio(url);
    audio.play();
}

function getAudioSrc(word: string) {
    const w = word.replaceAll('å', '0345').replaceAll('ö', '0366').replaceAll('ä', '0344')
    const path = "http://lexin.nada.kth.se/sound/" + w + ".mp3"
    return path;
}


export const WordSlide = (props: { word: string, isActiveSlide: boolean }) => {
    const wordQuery = trpc.words.getWord.useQuery({ word: decodeURI(props.word) })
    const w = wordQuery.data;
    useEffect(() => {
        if (props.isActiveSlide && w?.hasAudio) {
            playAudio(getAudioSrc(props.word))
        }
    }, [props.isActiveSlide]);

    if (wordQuery.isLoading) {
        return <div>Loading...</div>
    }

    if (wordQuery.isError) {
        return <div> {wordQuery.error.message}</div>
    }

    if (!w) {
        return <div>not found data</div>
    }



    console.log({ w });

    return <div className="WordSlide flex flex-col text-left items-start gap-4 w-full px-[5%]">
        <h1 className="text-4xl">
            <span className="text-6xl font-bold mr-2">
                {w.word}
            </span>
            ({w.translations.join(", ")})</h1>
        <div className="flex gap-2 flex-col ">
            {w.meanings.map(t => {
                return <div className="text-3xl" key={t}>- {t}</div>
            })}
        </div>
        {
            w.synonyms?.length > 0 &&
            <div className="pt-4">
                <p className="text-3xl opacity-50">Synonyms:</p>
                <div className="flex gap-2">
                    {w.synonyms.map(t => {
                        return <div className="text-3xl" key={t}>{t}</div>
                    })}
                </div>

            </div>
        }
        <p className="text-3xl opacity-50">Examples:</p>
        {
            (w.examples as { example: string; translation: string, partOfSpeech: string, tip: string }[]).map(it => {
                return <div>
                    {it.example + " "} 
                    <span className="italic opacity-50">
                        ({it.translation})
                    </span>
                </div>
            })
        }
        {
            w.related.length > 0 &&
            <div className="pt-4">
                <p className="text-3xl opacity-50">Related:</p>
                <div className="flex gap-2">
                    {(w.related as { tip: string; word: string; translation: string }[]).map((t) => {
                        return <div className="text-3xl" key={t.word}>{w.word}({t.translation})</div>
                    })}
                </div>

            </div>
        }


    </div>
}