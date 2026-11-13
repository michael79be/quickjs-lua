import { loadLibrary, type LoadedNativeLibrary } from 'quickjs-native';
import * as os from 'os';

const luaFunctionDefinitions = {
    luaL_newstate: 'number',
    luaL_openlibs: 'number',
    luaL_loadstring: 'number',
    lua_pcallk: 'number',
    lua_type: 'number',
    lua_toboolean: 'number',
    lua_tolstring: 'string',
    lua_tointegerx: 'number',
    lua_settop: 'number',
    lua_close: 'number'
} as const;

type LuaFunctionDefinitions = typeof luaFunctionDefinitions;
type LuaFunctions = LoadedNativeLibrary<LuaFunctionDefinitions>;

function getLibraryName(platform: string): string {
    switch (platform) {
        case 'darwin':
            return 'liblua.5.4.dylib';
        case 'linux':
            return 'liblua5.4.so';
        case 'win32':
            return 'lua54.dll';
        default:
            throw new Error(`Lua is not supported on ${platform}.`);
    }
}

/** Finds the bundled Lua library beside the executable or in its dependencies. */
export function findLuaLibraries(): string {
    const libraryName = getLibraryName(os.platform);
    const [workingDirectory, cwdError] = os.getcwd();
    if (cwdError !== 0) {
        throw new Error(`Unable to get the current directory (error ${cwdError}).`);
    }

    const separator = os.platform === 'win32' ? '\\' : '/';
    const directories: string[] = [];
    const addAncestors = (directory: string, isFile: boolean): void => {
        const parts = directory.split(/[\\/]/);
        if (isFile) {
            parts.pop();
        }
        while (parts.length > 0) {
            directories.push(parts.join(separator) || separator);
            parts.pop();
        }
    };

    addAncestors(workingDirectory, false);
    if (typeof scriptArgs[0] === 'string' && scriptArgs[0] !== '') {
        const [executablePath, pathError] = os.realpath(scriptArgs[0]);
        if (pathError === 0) {
            addAncestors(executablePath, true);
        }
    }

    const paths = new Set<string>();
    for (const directory of directories) {
        const basePath = directory.endsWith(separator) ? directory : `${directory}${separator}`;
        paths.add(`${basePath}${libraryName}`);
        paths.add(`${basePath}release${separator}${libraryName}`);
        paths.add(`${basePath}node_modules${separator}quickjs-lua${separator}release${separator}${libraryName}`);
    }
    return [...paths].join(';');
}

export enum LuaType {
    BOOLEAN = 1,
    NUMBER = 3,
    STRING = 4
}

/** A Lua 5.4 state backed by a dynamically loaded native library. */
export class Lua {
    private readonly library: LuaFunctions;
    private state: number | null;
    private destroyed = false;

    constructor(paths?: string) {
        this.library = loadLibrary(paths ?? findLuaLibraries(), luaFunctionDefinitions);
        this.state = this.library.luaL_newstate([]);
        if (this.state === null || this.state === 0) {
            this.library.destroy();
            this.state = null;
            this.destroyed = true;
            throw new Error('[Lua] Could not create state.');
        }
        try {
            this.library.luaL_openlibs([this.state]);
        } catch (error) {
            this.library.lua_close([this.state]);
            this.library.destroy();
            this.state = null;
            this.destroyed = true;
            throw error;
        }
    }

    eval(code: string): string | number | boolean | null {
        const state = this.getState();
        const loadResult = this.library.luaL_loadstring([state, code]);
        if (loadResult !== 0) {
            const errorMessage = this.library.lua_tolstring([state, -1, 0]);
            this.library.lua_settop([state, 0]);
            throw new Error(`[Lua] Compilation error: ${errorMessage}`);
        }

        try {
            const callResult = this.library.lua_pcallk([state, 0, -1, 0, 0, null]);
            if (callResult !== 0) {
                const errorMessage = this.library.lua_tolstring([state, -1, 0]);
                throw new Error(`[Lua] Runtime error: ${errorMessage}`);
            }

            switch (this.library.lua_type([state, -1])) {
                case LuaType.BOOLEAN:
                    return this.library.lua_toboolean([state, -1, 0]) !== 0;
                case LuaType.NUMBER:
                    return this.library.lua_tointegerx([state, -1, 0]);
                case LuaType.STRING:
                    return this.library.lua_tolstring([state, -1, 0]);
                default:
                    return null;
            }
        } finally {
            this.library.lua_settop([state, 0]);
        }
    }

    destroy(): void {
        if (this.destroyed) {
            return;
        }

        try {
            if (this.state !== null) {
                this.library.lua_close([this.state]);
            }
        } finally {
            this.state = null;
            this.destroyed = true;
            this.library.destroy();
        }
    }

    private getState(): number {
        if (this.destroyed || this.state === null) {
            throw new Error('[Lua] Lua state has been destroyed.');
        }
        return this.state;
    }
}
