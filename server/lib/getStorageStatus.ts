import { env } from '../env'
import { readdir, stat } from "node:fs/promises";
import { join,  } from "node:path";
import { $ } from 'bun';

export async function getUsedStorageStats() {
    const [used_audio,used_models, disk_audio,disk_models] = await Promise.all([
        getDirectorySize(env.AUDIO_DIR),
        getDirectorySize(env.MODELS_DIR),
        getDiskSpaceInfo(env.AUDIO_DIR),
        getDiskSpaceInfo(env.MODELS_DIR),
    ]);
    return {
        used_audio,
        used_models,
        disk_audio,
        disk_models
    }
}

async function getDirectorySize(dirPath: string) {
    let totalSize = 0;
    const items = await readdir(dirPath, { withFileTypes: true });

    for (const item of items) {
        const itemPath = join(dirPath, item.name);

        if (item.isFile()) {
            const { size } = await stat(itemPath);
            totalSize += size;
        } else if (item.isDirectory()) {
            totalSize += await getDirectorySize(itemPath);
        }
    }

    return totalSize;
}

async function getDiskSpaceInfo(directoryPath: string) {
    const res =  await $`df -P  ${directoryPath}`
    const text = res.text();
    const [,line] = text.split('\n')
    console.log(text)
    const [,total,used,available,capacity] = line.split(' ').filter(it => it.length).map(it => parseInt(it));
    return {total,used,available,capacity}
  }