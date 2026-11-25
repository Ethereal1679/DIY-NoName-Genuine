import ContentCompilerBase from "./ContentCompilerBase.js";
class ArrayCompiler extends ContentCompilerBase {
  type = "array";
  filter(content) {
    return Array.isArray(content) && content.every((item) => typeof item === "function");
  }
  compile(content) {
    if (!Array.isArray(content)) {
      throw new ReferenceError("content必须是一个数组");
    }
    const compiler = this;
    return async function(event) {
      if (!Number.isInteger(event.step)) {
        event.step = 0;
      }
      while (!event.finished) {
        if (event.step >= content.length) {
          event.finish();
          break;
        }
        compiler.beforeExecute(event);
        const step = event.step;
        event.step++;
        let result;
        if (!compiler.isPrevented(event)) {
          const original = content[step];
          result = await original.call(this, event, event._trigger, event.player, event._result);
        }
        const nextResult = await event.waitNext();
        event._result = result ?? nextResult ?? event._result;
        compiler.afterExecute(event);
      }
    };
  }
}
export {
  ArrayCompiler as default
};
