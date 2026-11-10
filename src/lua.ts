import * as os from 'os';

const luaFunctions = [
    'luaL_newstate',
    'luaL_openlibs',
    'luaL_loadstring',
    'lua_pcallk',
    'lua_type',
    'lua_toboolean',
    'lua_tolstring',
    'lua_tointegerx',
    'lua_settop',
    'lua_close'
];

export enum LuaType {
    BOOLEAN = 1,
    NUMBER = 3,
    STRING = 4
};

export class Lua {
    private lib: number;
    private func: { [key: string]: number } = {};
    private state: number | null;

    constructor() {
        const path = os.platform === 'darwin' ? `liblua.5.4.dylib` : `lua54.dll`;
        this.lib = native.dlopen(path) ?? 0;
        if (0 === this.lib) {
            throw new Error(`Could not load library ${path}`);
        }
        luaFunctions.forEach((f) => {
            const h = native.dlsym(this.lib, f);
            if (null === h) {
                throw new Error(`Invalid library (function ${f} not found)`);
            }
            this.func[f] = h;
        });
        this.state = native.invoke(this.func['luaL_newstate'], []);
        if (null === this.state) {
            new Error('Could not created state');
        }
        native.invoke(this.func['luaL_openlibs'], [this.state]);
    }

    eval(code: string): string | number | boolean | null {
        const loadstring = native.invoke(this.func['luaL_loadstring'], [this.state, code]);
        if (0 !== loadstring) {
            throw new Error('Could not load code');
        }
        native.invoke(this.func['lua_pcallk'], [this.state, 0, -1, 0, 0, null]);
        const luaType = native.invoke(this.func['lua_type'], [this.state, -1]);
        let result = null;
        switch (luaType) {
            case LuaType.BOOLEAN:
                result = native.invoke(this.func['lua_toboolean'], [this.state, -1, 0]);
                break;
            case LuaType.NUMBER:
                result = native.invoke(this.func['lua_tointegerx'], [this.state, -1, 0]);
                break;
            case LuaType.STRING:
                result = native.invoke(this.func['lua_tolstring'], [this.state, -1, 0], 'string');
                break;
        }

        native.invoke(this.func['lua_settop'], [this.state, 0]);

        return result;
    }

    destroy(): void {
        native.invoke(this.func['lua_close'], [this.state]);
    }
}