import "../../../../../noname.js";
import { game } from "../../../../game/index.js";
import { _status } from "../../../../status/index.js";
class ContentCompilerBase {
  /**
   * ```plain
   * 对于事件执行前的一些准备工作
   * ```
   *
   * @param event 事件
   */
  beforeExecute(event) {
    const handlerType = this.getHandlerType(event);
    const option = { state: "begin" };
    this.callHandler(event, handlerType, option);
    event.updateStep?.();
  }
  /**
   * ```plain
   * 判断事件能否继续执行
   * ```
   *
   * @param event 事件
   * @returns 当返回true时，代表event.finish()已经被调用
   */
  isPrevented(event) {
    const { player } = event;
    if (event.name === "phaseLoop") {
      return false;
    }
    if (!player) {
      return false;
    }
    const isDead = typeof player.isDead === "function" && player.isDead();
    const isOut = typeof player.isOut === "function" && player.isOut();
    if (isDead && !event.forceDie) {
      game.broadcastAll(function() {
        while (_status.dieClose.length) {
          _status.dieClose.shift().close();
        }
      });
      event._oncancel?.();
    } else if (isOut && !event.includeOut) {
      if (event.name == "phase" && player == _status.roundStart && !event.skill) {
        _status.roundSkipped = true;
      }
    } else if (player.removed) {
    } else {
      return false;
    }
    event.finish();
    return true;
  }
  /**
   * ```plain
   * 对于事件执行后的一些收尾工作
   * ```
   *
   * @param event 事件
   */
  afterExecute(event) {
    event.clearStepCache?.(null);
    const handlerType = this.getHandlerType(event);
    const option = { state: "end" };
    this.callHandler(event, handlerType, option);
    event.updateStep?.();
  }
  /**
   * Extensions and reconnect payloads can still provide legacy event-shaped
   * objects. Keep the compiler lifecycle compatible with those objects while
   * native GameEvent instances continue to use their own methods.
   */
  getHandlerType(event) {
    if (typeof event.getDefaultHandlerType === "function") {
      return event.getDefaultHandlerType();
    }
    const name = typeof event.name === "string" ? event.name : "";
    return name ? `on${name[0].toUpperCase()}${name.slice(1)}` : "";
  }
  callHandler(event, type, option) {
    if (typeof event.callHandler === "function") {
      event.callHandler(type, event, option);
      return;
    }
    if (!type) {
      return;
    }
    const handlers = event[type];
    for (const handler of Array.isArray(handlers) ? handlers : [handlers]) {
      if (typeof handler === "function") {
        handler(event, option);
      }
    }
  }
}
export {
  ContentCompilerBase as default
};
