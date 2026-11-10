import * as os from 'os';
import { Lua } from '../lua';

const sp = os.platform === 'darwin' ? '/' : '\\';
const parts = os.realpath(scriptArgs[0])[0].split(sp);
parts.pop();
let cwd = parts.join('/');
if (-1 !== cwd.indexOf('.app')) {
    parts.pop();
    parts.pop();
    parts.pop();
    cwd = parts.join('/');
}

const cpath = 'darwin' === os.platform ? `package.cpath = '${cwd}/?.so'` : '';

const lua = new Lua();
lua.eval(`

${cpath}

local gui = require('yue.gui')

local win = gui.Window.create({})
win:setcontentsize({ width = 800, height = 600 })

win.onclose = function()
    gui.MessageLoop.quit()
end

win:center()
win:activate()

gui.MessageLoop.run()

`);
lua.destroy();
