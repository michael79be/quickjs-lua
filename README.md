# quickjs-lua

Quick JS native lua bindings

## API

- `new Lua()` : create a new Lua state
- `eval(script)` : run lua script
- `destroy()` : destroy lua state

## Install

```shell
git submodule update --init --force --remote
cd quickjs-native
./make.command
cd ..
```

## Package

```shell
npm run build -- --input src/samples/hello.ts
npm run start -- hello
```
