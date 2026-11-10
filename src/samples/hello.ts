import { Lua } from '../lua';

const lua = new Lua();
lua.eval(`print('Hello from Lua')`);
lua.destroy();
