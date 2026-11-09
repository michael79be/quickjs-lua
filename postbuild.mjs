import { copyFileSync, existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { inflate } from 'pako';
import { untar } from '@andrewbranch/untar.js';
import * as unzipper from 'unzipper';
import fetch from 'node-fetch';

execSync('brew install lua@5.4');
if (existsSync('release/liblua.5.4.dylib')) {
    unlinkSync('release/liblua.5.4.dylib');
}
copyFileSync('/opt/homebrew/opt/lua@5.4/lib/liblua.5.4.dylib', 'release/liblua.5.4.dylib');

const libraries = {
    'lua54.dll': 'https://sourceforge.net/projects/luabinaries/files/5.4.8/Windows%20Libraries/Dynamic/lua-5.4.8_Win64_dllw6_lib.zip/download',
    // 'liblua52.dylib': 'https://sourceforge.net/projects/luabinaries/files/5.2.4/Other%20Libraries/lua-5.2.4_MacOS1011_lib.tar.gz/download'
}
Object.keys(libraries).forEach(async (lib) => {
    const url = libraries[lib];
    const parts = url.split('/');
    parts.pop(); // pop /download from URL
    const name = String(parts.pop());
    if (existsSync(`release/${name}`)) {
        return;
    }
    const r = await fetch(url);
    writeFileSync(`release/${name}`, Buffer.from(await r.arrayBuffer()));
    if (name.endsWith('.zip')) {
        const unzip = await unzipper.Open.file(`release/${name}`);
        const dll = unzip.files.find(f => lib === f.path);
        if (dll) {
            const content = await dll.buffer();
            writeFileSync(`release/${lib}`, content);
        }
    }
    if (name.endsWith('.tar.gz')) {
        const gz = inflate(readFileSync(`release/${name}`).buffer);
        const tar = untar(gz.buffer);
        const dll = tar.find(f => lib === f.filename);
        if (dll) {
            writeFileSync(`release/${lib}`, dll.fileData);
        }
    }
    unlinkSync(`release/${name}`);
});

copyFileSync('quickjs-native/start.command', 'start.command');
copyFileSync('quickjs-native/release/index', 'release/lua');
copyFileSync('quickjs-native/release/index.exe', 'release/lua.exe');
