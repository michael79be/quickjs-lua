# quickjs-lua

Lua 5.4 bindings for QuickJS Native. The Linux and Windows shared libraries are
downloaded automatically during installation and build. On macOS, Homebrew
provides a library for the current architecture when the bundled one is missing
or incompatible. The libraries are included in the published package, so they
are not required to be installed on the user's system.

## Usage

```ts
import { Lua } from 'quickjs-lua';

const lua = new Lua();
const result = lua.eval('return 2 + 3');
console.log(`2 + 3 = ${result}`);
lua.destroy();
```

The `release/` directory contains the libraries for all supported platforms.
Linux and Windows libraries are downloaded from LuaBinaries during
installation/build. On macOS, Homebrew supplies the dylib when it is missing or
does not match the current architecture.
The runtime selects the matching library and looks beside the executable and
in the installed package's `release/` directory. To override this path, pass
the library path to the constructor:

```ts
const lua = new Lua('/path/to/liblua.5.4.dylib');
```

Multiple paths may be provided as a semicolon-separated string. The bundled
Windows and Linux binaries currently support x64.

## Create an executable

After compiling your application's entry point to JavaScript, bundle it with
QuickJS Native:

```shell
npx quickjs-native bundle dist/index.js
```

Executables for all supported targets are written to `release/` by default.
Run `npx quickjs-native help` to see the available options.
