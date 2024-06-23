import axios from 'axios'
import { fetchModelsList } from './fetchModelsList'
import { env } from '../env';
import fs from 'fs'
import path from 'path';
import { $ } from 'bun'


async function fetchAndExtractModel(url, outputDir, override = false) {
    const filePath = await downloadFile(outputDir, url, override);
    await extractFile(filePath, outputDir);
}

async function downloadFile(outputDir: string, url: string, override = false) {
    const fileName = url.split('/').pop() ?? "";
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`Created directory ${outputDir}`);
    }

    const filePath = path.join(outputDir, fileName);
    if (fs.existsSync(filePath)) {
        if (!override) {
            console.log(`File ${fileName} already exists, skipping download.`);
            return filePath;
        }
        else {
            fs.unlinkSync(filePath);
            console.log(`Overriding existing file ${fileName}.`);
        }
    }

    console.log(`Downloading ${url} to ${filePath}`);

    const writer = fs.createWriteStream(filePath);
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    response.data.on('progress', (progress) => {
        console.log(`Download progress: ${Math.round(progress.percent * 100)}%`);
    });

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });


    return filePath;
}

export async function downloadModel(name) {
    const models = await fetchModelsList();
    const m = models.find((m) => m.modelName === name);
    if (!m) {
        throw new Error(`Model ${name} not found`);
    }
    console.log("Downloading " + m.modelName);
    await fetchAndExtractModel(m.url, env.MODELS_DIR);
    console.log(`Model ${m.modelName} downloaded and extracted to ${env.MODELS_DIR}`);
}
async function extractFile(filePath: string, outputPath: string) {
    console.log(`Extracting ${filePath} to ${outputPath} `);
    // skip if folder already exists!
    const folderName = path.basename(filePath, '.tar.bz2');
    const folderPath = path.resolve(path.join(outputPath, folderName));
    // log
    console.log("foler path:", folderPath, {folderName,folderPath});

    if (fs.existsSync(folderPath)) {
        console.log(`Folder ${folderName} already exists, skipping extraction`);
        return;
    }

    try {
        await $`tar -xvf ${filePath} -C ${outputPath}`
    } catch (error) {
        console.error('Error extracting file:', error)
    }
}