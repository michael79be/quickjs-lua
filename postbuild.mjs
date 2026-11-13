import { execFileSync } from 'node:child_process';
import {
    copyFileSync,
    existsSync,
    mkdtempSync,
    readdirSync,
    rmSync,
    statSync,
    writeFileSync,
    mkdirSync
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as unzipper from 'unzipper';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const releaseDirectory = path.join(projectRoot, 'release');
const luaVersion = '5.4.8';

async function download(url, destination) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Unable to download ${url}: HTTP ${response.status}.`);
    }
    writeFileSync(destination, Buffer.from(await response.arrayBuffer()));
}

function findLinuxLibrary(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            const nested = findLinuxLibrary(entryPath);
            if (nested) {
                return nested;
            }
        } else if (/^liblua.*\.so(?:\.\d+)*$/i.test(entry.name) && statSync(entryPath).isFile()) {
            return entryPath;
        }
    }
    return null;
}

async function installMacOSLibrary() {
    execFileSync('brew', ['install', 'lua@5.4'], { stdio: 'inherit' });
    const prefix = execFileSync('brew', ['--prefix', 'lua@5.4'], { encoding: 'utf8' }).trim();
    const source = path.join(prefix, 'lib', 'liblua.5.4.dylib');
    if (!existsSync(source)) {
        throw new Error(`Homebrew Lua library was not found: ${source}`);
    }
    const destination = path.join(releaseDirectory, 'liblua.5.4.dylib');
    rmSync(destination, { force: true });
    copyFileSync(source, destination);
}

async function installWindowsLibrary() {
    if (process.arch !== 'x64') {
        throw new Error(`Lua binary downloads are not available for Windows ${process.arch}.`);
    }

    const archivePath = path.join(releaseDirectory, `lua-${luaVersion}-windows.zip`);
    const url = `https://sourceforge.net/projects/luabinaries/files/${luaVersion}/Windows%20Libraries/Dynamic/lua-${luaVersion}_Win64_dllw6_lib.zip/download`;
    try {
        await download(url, archivePath);
        const archive = await unzipper.Open.file(archivePath);
        const dll = archive.files.find((file) => file.path === 'lua54.dll');
        if (!dll) {
            throw new Error('The Lua Windows archive does not contain lua54.dll.');
        }
        writeFileSync(path.join(releaseDirectory, 'lua54.dll'), await dll.buffer());
    } finally {
        rmSync(archivePath, { force: true });
    }
}

async function installLinuxLibrary() {
    if (process.arch !== 'x64') {
        throw new Error(`Lua binary downloads are not available for Linux ${process.arch}.`);
    }

    const archivePath = path.join(releaseDirectory, `lua-${luaVersion}-linux.tar.gz`);
    const extractionDirectory = mkdtempSync(path.join(os.tmpdir(), 'quickjs-lua-'));
    const url = `https://sourceforge.net/projects/luabinaries/files/${luaVersion}/Linux%20Libraries/lua-${luaVersion}_Linux44_64_lib.tar.gz/download`;
    try {
        await download(url, archivePath);
        execFileSync('tar', ['-xzf', archivePath, '-C', extractionDirectory], { stdio: 'inherit' });
        const library = findLinuxLibrary(extractionDirectory);
        if (!library) {
            throw new Error('The Lua Linux archive does not contain a shared library.');
        }
        copyFileSync(library, path.join(releaseDirectory, 'liblua5.4.so'));
    } finally {
        rmSync(archivePath, { force: true });
        rmSync(extractionDirectory, { recursive: true, force: true });
    }
}

async function installLuaLibrary() {
    mkdirSync(releaseDirectory, { recursive: true });
    if (process.platform === 'darwin') {
        await installMacOSLibrary();
    } else if (process.platform === 'win32') {
        await installWindowsLibrary();
    } else if (process.platform === 'linux') {
        await installLinuxLibrary();
    } else {
        throw new Error(`Lua binary downloads are not supported on ${process.platform}.`);
    }
}

await installLuaLibrary();
