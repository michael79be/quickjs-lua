import { Lua } from '../index';

const lua = new Lua();
lua.eval(`print('Hello from Lua')`);
lua.destroy();
