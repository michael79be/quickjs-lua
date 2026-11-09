const luaFunctions = [
    'luaL_newstate',
    'luaL_openlibs',
    'luaL_loadstring',
    'lua_pcallk',
    'lua_close'
];

export class Lua {
    private lib: number;
    private func: { [key: string]: number } = {};
    private state: number | null;

    constructor() {
        this.lib = native.dlopen('lua.dll') ?? 0;
        if (0 === this.lib) {
            throw new Error('Could not load library');
        }
        luaFunctions.forEach((f) => {
            const h = native.dlsym(this.lib, f);
            if (null === h) {
                throw new Error('Invalid library');
            }
            this.func[f] = h;
        });
        this.state = native.invoke(this.func['luaL_newstate'], []);
        if (null === this.state) {
            new Error('Could not created state');
        }
        native.invoke(this.func['luaL_openlibs'], [this.state]);
    }

    eval(code: string): void {
        const loadstring = native.invoke(this.func['luaL_loadstring'], [this.state, code]);
        if (0 !== loadstring) {
            throw new Error('Could not load code');
        }
        native.invoke(this.func['lua_pcallk'], [this.state, 0, -1, 0, 0, null]);
    }

    destroy(): void {
        native.invoke(this.func['lua_close'], [this.state]);
    }
}