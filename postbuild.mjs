import { copyFileSync, unlinkSync, writeFileSync } from 'fs';
import fetch from 'node-fetch';
import * as unzipper from 'unzipper';

const r = await fetch('https://sourceforge.net/projects/luabinaries/files/5.2.4/Windows%20Libraries/Dynamic/lua-5.2.4_Win64_dllw6_lib.zip/download');
writeFileSync('release/lua.zip', Buffer.from(await r.arrayBuffer()));
const unzip = await unzipper.Open.file('release/lua.zip');
const dll = unzip.files.find(f => 'lua52.dll' === f.path);
if (dll) {
    const content = await dll.buffer();
    writeFileSync('release/lua.dll', content);
}
unlinkSync('release/lua.zip');

copyFileSync('quickjs-native/start.command', 'start.command');
copyFileSync('quickjs-native/release/index.exe', 'release/lua.exe');
