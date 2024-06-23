import githubAssets from './models.json'
const releaseUrl = `https://api.github.com/repos/k2-fsa/sherpa-onnx/releases/tags/tts-models`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cache: any;

export type ModelType = {
    fileName: string;
    modelName: string;
    content_type: string;
    size: string;
    created_at: string;
    updated_at: string;
    url: string;
}
export async function fetchModelsList(filter?: string): Promise<ModelType[]> {
    try {
        const assets = await getAssetsFromGithub();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return assets.filter((it: any) => it.name.endsWith(".tar.bz2"))
            .filter((it: { name: string | string[]; }) => {
                if (!filter) return true;
                return it.name.indexOf(filter) > -1
            })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((it: any) => {
                const { name, content_type, size, created_at, updated_at, browser_download_url } = it;
                const fileName = name;
                const modelName = name.replace('.tar.bz2', '');
                return {
                    fileName, modelName, content_type, size, created_at, updated_at, url: browser_download_url
                }
            })
    } catch (error) {
        console.error(error);
        return [];
    }
}

async function getAssetsFromGithub() {
    if (cache) return cache;
    try {
        const response = await fetch(releaseUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch release information: ${response.status}`);
        }
        const releaseData = await response.json();
        const assets = releaseData.assets || [];
        cache = assets;
        return assets;
    } catch (error) {
        console.log(error);
        return githubAssets.assets;
    }
}
