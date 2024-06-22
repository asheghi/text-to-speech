import { Definition } from '../mongoose'
import { fetchDefinitionFromLexikon } from './utils/lexikon'

const words = await Definition.find();

for await (const w of words) {
    const res = await fetchDefinitionFromLexikon(w.word)
    // w.translations = res?.translations ?? w.translations;
    // w.phonetic = res?.phonetic[0] ?? w.phonetic
    // if (res?.example && res.example.length) {
    //     w.examples = res.example.map(it => {
    //         return { example: it, }
    //     })
    // }
    console.log(w.word)
    console.log(res)
}