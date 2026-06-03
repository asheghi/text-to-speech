import axios from 'axios'
import { fetchModelsList } from './fetchModelsList'
import { env } from '../env';
import fs from 'fs'
import path from 'path';
import { $ } from 'bun'
import { findCustomModel, type CustomModel } from './customModels';
import { convertPiperRawToSherpa } from './convertPiperModel';


async function downloadFile(outputDir: string, url: string, override = false) {
    const fileName = url.split('/').pop() ?? "";
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`Created directory ${outputDir}`);
    }

    const filePath = path.join(outputDir, fileName);
    if (fs.existsSync(filePath)) {
        // A 0-byte file is the fingerprint of an interrupted/failed prior
        // download (e.g. a DNS/connection error after the write stream was
        // created). Treat it as absent so we re-download instead of skipping
        // forever and then failing to extract a corrupt archive.
        if (!override && fs.statSync(filePath).size > 0) {
            console.log(`File ${fileName} already exists, skipping download.`);
            return filePath;
        }
        fs.unlinkSync(filePath);
        console.log(`Removing existing ${override ? '' : 'empty/partial '}file ${fileName} before download.`);
    }

    console.log(`Downloading ${url} to ${filePath}`);

    const writer = fs.createWriteStream(filePath);
    try {
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
            response.data.on('error', reject);
        });
    } catch (error) {
        // Don't leave a partial/empty file behind — it would be skipped on the
        // next attempt and poison every subsequent extraction.
        writer.destroy();
        if (fs.existsSync(filePath)) {
            fs.rmSync(filePath, { force: true });
        }
        throw error;
    }

    return filePath;
}

export async function downloadModel(name) {
    // Custom (third-party) models go through a different pipeline because
    // their archive layout doesn't match the k2-fsa convention.
    const custom = findCustomModel(name);
    if (custom) {
        // Alias entries (e.g. Supertonic voice variants v1-v9) share their
        // source model's files — recurse on the source and we're done.
        if (custom.aliasOf) {
            console.log(`[customModel] ${name} is alias of ${custom.aliasOf}, delegating`);
            return downloadModel(custom.aliasOf);
        }
        await downloadCustomModel(custom);
        return;
    }

    const models = await fetchModelsList();
    const m = models.find((m) => m.modelName === name);
    if (!m) {
        throw new Error(`Model ${name} not found`);
    }
    console.log("Downloading " + m.modelName);
    const filePath = await downloadFile(env.MODELS_DIR, m.url);
    await extractFile(filePath, env.MODELS_DIR);
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

async function downloadCustomModel(model: CustomModel): Promise<void> {
    if (model.license) {
        console.log(`[customModel] ${model.modelName} license: ${model.license}`);
    }
    if (model.notes) {
        console.log(`[customModel] ${model.modelName} notes: ${model.notes}`);
    }

    const targetDir = path.join(env.MODELS_DIR, model.modelName);
    if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
        console.log(`Custom model ${model.modelName} already present, running post-process if needed`);
        if (model.postProcess === 'piper-raw') {
            await convertPiperRawToSherpa(targetDir, model.piperFallback);
        }
        // Still check for any missing extraFiles even when the dir already exists
        // (handles the case where the model was downloaded before extraFiles were added).
        await downloadExtraFiles(model, targetDir);
        return;
    }

    // Raw-files path: download a list of files directly into the target dir,
    // skip the archive extraction dance entirely.
    if (model.rawFiles && model.rawFiles.length > 0) {
        console.log(`Downloading custom model ${model.modelName} (${model.rawFiles.length} raw files)`);
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
        for (const f of model.rawFiles) {
            const dest = path.join(targetDir, f.destName);
            if (fs.existsSync(dest)) {
                console.log(`  ${f.destName} already exists, skipping`);
                continue;
            }
            console.log(`  downloading ${f.url} -> ${dest}`);
            const res = await fetch(f.url);
            if (!res.ok) {
                throw new Error(`Failed to download ${f.url}: ${res.status}`);
            }
            fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
        }
        if (model.postProcess === 'piper-raw') {
            await convertPiperRawToSherpa(targetDir, model.piperFallback);
        }
        console.log(`Custom model ${model.modelName} ready at ${targetDir}`);
        return;
    }

    console.log(`Downloading custom model ${model.modelName}`);
    const archivePath = await downloadFile(env.MODELS_DIR, model.url);

    // Extract into a scratch dir, then move the inner directory (or the
    // entire scratch contents, if the archive is flat) to the canonical
    // `<MODELS_DIR>/<modelName>/` location.
    const scratch = path.join(env.MODELS_DIR, `_extract-${model.modelName}`);
    if (fs.existsSync(scratch)) {
        fs.rmSync(scratch, { recursive: true, force: true });
    }
    fs.mkdirSync(scratch, { recursive: true });
    try {
        await $`tar -xvf ${archivePath} -C ${scratch}`;
    } catch (error) {
        console.error('Error extracting custom model archive:', error);
        // The archive is corrupt/truncated. Remove it (and the scratch dir) so
        // the next request re-downloads a fresh copy instead of repeatedly
        // failing to extract the same bad file.
        fs.rmSync(archivePath, { force: true });
        fs.rmSync(scratch, { recursive: true, force: true });
        throw error;
    }

    const inner = model.innerPath
        ? path.join(scratch, model.innerPath)
        : scratch;
    if (!fs.existsSync(inner)) {
        throw new Error(`Custom model ${model.modelName}: innerPath '${model.innerPath}' not found in archive`);
    }

    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    for (const entry of fs.readdirSync(inner)) {
        fs.renameSync(path.join(inner, entry), path.join(targetDir, entry));
    }
    fs.rmSync(scratch, { recursive: true, force: true });

    if (model.postProcess === 'piper-raw') {
        await convertPiperRawToSherpa(targetDir, model.piperFallback);
    }

    await downloadExtraFiles(model, targetDir);

    console.log(`Custom model ${model.modelName} ready at ${targetDir}`);
}

/**
 * Download any supplementary files listed in `model.extraFiles` that are not
 * yet present in the target directory. Safe to call multiple times — already-
 * present files are skipped.
 */
async function downloadExtraFiles(model: CustomModel, targetDir: string): Promise<void> {
    if (!model.extraFiles || model.extraFiles.length === 0) return;

    const missing = model.extraFiles.filter(f => !fs.existsSync(path.join(targetDir, f.destName)));
    if (missing.length === 0) return;

    console.log(`[customModel] ${model.modelName}: downloading ${missing.length} supplementary file(s)`);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    for (const f of missing) {
        const dest = path.join(targetDir, f.destName);
        console.log(`  downloading ${f.url} -> ${dest}`);
        const res = await fetch(f.url);
        if (!res.ok) {
            throw new Error(`Failed to download supplementary file ${f.url}: ${res.status}`);
        }
        fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    }
}
