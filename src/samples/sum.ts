import { Lua } from '../index';

const lua = new Lua();
const sum = lua.eval(`return 2 + 3`);
console.log(`Lua says 2 + 3 = ${sum}`);
lua.destroy();
