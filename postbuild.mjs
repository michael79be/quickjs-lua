import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'fs';
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
    'yue.so': 'https://github.com/yue/yue/releases/download/v0.15.6/lua_yue_lua_5.4_v0.15.6_mac_arm64.zip',
    'yue.dll': 'https://github.com/yue/yue/releases/download/v0.15.6/lua_yue_lua_5.4_v0.15.6_win_x64.zip',
    'WebView2Loader.dll': 'https://github.com/yue/yue/releases/download/v0.15.6/lua_yue_lua_5.4_v0.15.6_win_x64.zip'
}
Object.keys(libraries).forEach(async (lib) => {
    const url = libraries[lib];
    const parts = url.split('/');
    if (url.endsWith('/download')) {
        parts.pop(); // pop /download from URL
    }
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
if (!existsSync('release/lib/yue/')) {
    mkdirSync('release/lib/yue/', { recursive: true });
}
copyFileSync('release/yue.dll', 'release/lib/yue/gui.dll');
copyFileSync('release/yue.so', 'release/lib/yue/gui.so');
