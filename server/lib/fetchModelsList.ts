// GitHub API endpoint to get release by tag
const releaseUrl = `https://api.github.com/repos/k2-fsa/sherpa-onnx/releases/tags/tts-models`;

export async function fetchModelsList(filter?: string) {
    try {
        const response = await fetch(releaseUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch release information: ${response.status}`);
        }

        const releaseData = await response.json();
        const assets = releaseData.assets || [];

        return assets.filter(it => it.name.endsWith(".tar.bz2"))
            .filter(it => {
                if (!filter) return true;
                return it.name.indexOf(filter) > -1
            })
            .map(it => {
                const { name, content_type, size, created_at, updated_at, browser_download_url } = it;
                const fileName = name;
                const modelName = name.replace('.tar.bz2', '');
                return {
                    fileName, modelName, content_type, size, created_at, updated_at, url: browser_download_url
                }
            })
    } catch (error) {
        console.error(error);
    }
}