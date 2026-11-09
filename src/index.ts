const lua = native.dlopen('lua.dll') ?? 0;
if (0 !== lua) {
    const state = native.dlsym(lua, 'luaL_newstate');
    const openlibs = native.dlsym(lua, 'luaL_openlibs');
    const loadstring = native.dlsym(lua, 'luaL_loadstring');
    const pcallk = native.dlsym(lua, 'lua_pcallk');
    const close = native.dlsym(lua, 'lua_close');
    if (state && openlibs && loadstring && pcallk && close) {
        const luaState = native.invoke(state, []);
        console.log(`lua state: ${luaState}`);
        native.invoke(openlibs, [luaState]);
        const code = `print('Hello from lua')`;
        const load = native.invoke(loadstring, [luaState, code]);
        console.log(`lua load: ${load}`);
        if (0 === load) {
            native.invoke(pcallk, [luaState, 0, -1, 0, 0, null]);
        }
        native.invoke(close, [luaState]);
        native.dlclose(lua);
    }
} else {
    console.log('Could not load lua.dll');
}

console.log('Hello from QuickJS');
