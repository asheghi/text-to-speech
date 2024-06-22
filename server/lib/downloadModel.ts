import axios from 'axios';
import  tar from 'tar';
import bz2 from 'bzip2-maybe';
import fs from 'fs';
import { pipeline as pipelineCallback } from 'stream';
import { promisify } from 'util';
import { fetchModelsList } from './fetchModelsList'
import { modelsDir } from './modelsDir';

// Promisify the pipeline function
const pipeline = promisify(pipelineCallback);

async function fetchAndExtractModel(url, outputDir) {
    try {
        // Create a readable stream from the URL
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        // Ensure the output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Pipe the response through bzip2 decompression and tar extraction
        await pipeline(
            response.data,
            bz2(),
            tar.extract({ cwd: outputDir })
        );

        console.log('Download and extraction complete.');
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

export async function downloadModel(name) {
    const models = await fetchModelsList();
    const m = models.find((m) => m.modelName === name);
    if (!m) {
        throw new Error(`Model ${name} not found`);
    }
    console.log("Downloading " + m.modelName);
    await fetchAndExtractModel(m.url, modelsDir);
    console.log(`Model ${m.modelName} downloaded and extracted to ${modelsDir}`);
}

const models = await fetchModelsList();

for await (const m of models) {
    const url = m.url;
    const outputDir = './models/';

    console.log("Downloading " + m.modelName);

    await fetchAndExtractModel(url, outputDir);
}