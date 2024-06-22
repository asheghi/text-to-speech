/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { xml2js } from 'xml-js'

export async function fetchDefinitionFromLexikon(word: string): Promise<{ translations: string[]; phonetic: string[]; synonym: string[]; example: string[]; definition: string[]; see: string[]; idiom: string[]; } | undefined> {
    const res = await fetch("https://folkets-lexikon.csc.kth.se/folkets/folkets/lookupword", {
        "headers": {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9,fa;q=0.8,sv;q=0.7",
            "content-type": "text/x-gwt-rpc; charset=UTF-8",
            "sec-ch-ua": "\"Chromium\";v=\"124\", \"Google Chrome\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-gwt-module-base": "https://folkets-lexikon.csc.kth.se/folkets/folkets/",
            "x-gwt-permutation": "11943DE7034965843328B82D69D502CD"
        },
        "referrer": "https://folkets-lexikon.csc.kth.se/folkets/folkets.html",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": "7|0|6|https://folkets-lexikon.csc.kth.se/folkets/folkets/|50E34F32D04CE9D0C22E1F6F4A0F86B0|se.algoritmica.folkets.client.LookUpService|lookUpWord|se.algoritmica.folkets.client.LookUpRequest/1089007912|" + word + "|1|2|3|4|1|5|5|1|0|0|6|",
        "method": "POST",
        "mode": "cors",
        "credentials": "omit"
    });

    const textRes = await res.text();

    try {
        const parsed = JSON.parse(textRes.replace('//OK', ''))
        const arr = parsed.find((it: any) => typeof it === 'object' && Array.isArray(it))
        const xmlparts = arr.slice(3, arr.length - 1)
        const parsedItem = xmlparts.map((it: string) => xml2js(it))
        const fbo = parsedItem[0].elements[0].elements;
        const translations = fbo.filter((it: { name: string; }) => it.name === 'translation').map((it: any) => getElValue(it))
        const phonetic = fbo.filter((it: { name: string; }) => it.name === 'phonetic').map((it: any) => getElValue(it))
        const synonym = fbo.filter((it: { name: string; }) => it.name === 'synonym').map((it: any) => getElValue(it))
        const see = fbo.filter((it: { name: string; }) => it.name === 'see').map((it: any) => getElValue(it))
        .map((it: string) => {
            if(it.includes("||")) return it.split("||")[0]
            return it;
        })
        const example = fbo.filter((it: { name: string; }) => it.name === 'example').map((it: any) => getElValue(it))
        const definition = fbo.filter((it: { name: string; }) => it.name === 'definition').map((it: any) => getElValue(it))
        const idiom = fbo.filter((it: { name: string; }) => it.name === 'idiom').map((it: any) => getElValue(it))


        return {
            translations,
            phonetic,
            synonym,
            example,
            definition,
            see,
            idiom
        }
    } catch (error) {
        console.error(error)
    }

}

function getElValue(el: any): string {
    return el.attributes.value;
}