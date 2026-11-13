# quickjs-lua

Lua 5.4 bindings for QuickJS Native. The Lua shared library is downloaded
automatically during installation and build; it is not required to be installed
on the user's system.

## Usage

```ts
import { Lua } from 'quickjs-lua';

const lua = new Lua();
const result = lua.eval('return 2 + 3');
console.log(`2 + 3 = ${result}`);
lua.destroy();
```

On macOS, the installer uses Homebrew to install Lua 5.4 and copies its dylib
into `release/`. On Windows and Linux, it downloads the matching DLL or SO from
LuaBinaries. The runtime looks beside the executable and in the installed
package's `release/` directory. To override this path, pass the library path to
the constructor:

```ts
const lua = new Lua('/path/to/liblua.5.4.dylib');
```

Multiple paths may be provided as a semicolon-separated string. Windows and
Linux downloads currently support x64.

## Create an executable

After compiling your application's entry point to JavaScript, bundle it with
QuickJS Native:

```shell
npx quickjs-native bundle dist/index.js
```

Executables for all supported targets are written to `release/` by default.
Run `npx quickjs-native help` to see the available options.
