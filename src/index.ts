import { Lua } from './lua';

const lua = new Lua();
lua.eval(`print('Lua is working !')`);
lua.destroy();
