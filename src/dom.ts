import {
  Listener,
  NativeListener,
} from 'yox-type/src/type'

import {
  SpecialEventHooks,
} from 'yox-type/src/hooks'

import {
  HINT_NUMBER,
  HINT_BOOLEAN,
} from 'yox-config/src/config'

import * as constant from 'yox-type/src/constant'

import isDef from 'yox-common/src/function/isDef'
import execute from 'yox-common/src/function/execute'

import * as array from 'yox-common/src/util/array'
import * as string from 'yox-common/src/util/string'
import * as object from 'yox-common/src/util/object'
import * as logger from 'yox-common/src/util/logger'

import Emitter from 'yox-common/src/util/Emitter'
import CustomEvent from 'yox-common/src/util/CustomEvent'


// 这里先写 IE9 支持的接口
let innerText = 'textContent',

innerHTML = 'innerHTML',

createEvent = function (event: any, node: HTMLElement | Window | Document): any {
  return event
},

findElement = function (selector: string): Element | void {
  const node = (constant.DOCUMENT as Document).querySelector(selector)
  if (node) {
    return node
  }
},

addEventListener = function (node: HTMLElement | Window | Document, type: string, listener: (event: Event) => void) {
  node.addEventListener(type, listener, constant.FALSE)
},

removeEventListener = function (node: HTMLElement | Window | Document, type: string, listener: (event: Event) => void) {
  node.removeEventListener(type, listener, constant.FALSE)
},

// IE9 不支持 classList
addElementClass = function (node: HTMLElement, className: string) {
  node.classList.add(className)
},

removeElementClass = function (node: HTMLElement, className: string) {
  node.classList.remove(className)
}

if (process.env.NODE_ENV !== 'pure') {
  if (constant.DOCUMENT) {

    // 此时 document.body 不一定有值，比如 script 放在 head 里
    if (!constant.DOCUMENT.documentElement.classList) {
      addElementClass = function (node: HTMLElement, className: string) {
        const classes = node.className.split(CHAR_WHITESPACE)
        if (!array.has(classes, className)) {
          array.push(classes, className)
          node.className = array.join(classes, CHAR_WHITESPACE)
        }
      }
      removeElementClass = function (node: HTMLElement, className: string) {
        const classes = node.className.split(CHAR_WHITESPACE)
        if (array.remove(classes, className)) {
          node.className = array.join(classes, CHAR_WHITESPACE)
        }
      }
    }

    // 为 IE9 以下浏览器打补丁
    if (process.env.NODE_LEGACY) {

      if (!constant.DOCUMENT.addEventListener) {

        const PROPERTY_CHANGE = 'propertychange',

        isBoxElement = function (node: HTMLInputElement) {
          return node.tagName === 'INPUT'
            && (node.type === 'radio' || node.type === 'checkbox')
        }

        class IEEvent {

          currentTarget: HTMLElement | Window | Document

          target: HTMLElement | EventTarget

          originalEvent: Event

          constructor(event: Event, element: HTMLElement | Window | Document) {

            object.extend(this, event)

            this.currentTarget = element
            this.target = event.srcElement || element
            this.originalEvent = event

          }

          preventDefault() {
            this.originalEvent.returnValue = constant.FALSE
          }

          stopPropagation() {
            this.originalEvent.cancelBubble = constant.TRUE
          }

        }

        // textContent 不兼容 IE 678
        innerText = 'innerText'

        createEvent = function (event, element) {
          return new IEEvent(event, element)
        }

        findElement = function (selector: string): Element | void {
          // 去掉 #
          if (string.codeAt(selector, 0) === 35) {
            selector = string.slice(selector, 1)
          }
          else if (process.env.NODE_ENV === 'development') {
            logger.fatal(`The id selector, such as "#id", is the only supported selector for legacy version.`)
          }
          const node = (constant.DOCUMENT as Document).getElementById(selector)
          if (node) {
            return node
          }
        }

        addEventListener = function (node: any, type: string, listener: (event: Event) => void) {
          if (type === constant.EVENT_INPUT) {
            addEventListener(
              node,
              PROPERTY_CHANGE,
              // 借用 EMITTER，反正只是内部临时用一下...
              listener[EMITTER] = function (event: any) {
                if (event.propertyName === constant.RAW_VALUE) {
                  event = new CustomEvent(event)
                  event.type = constant.EVENT_INPUT
                  execute(listener, this, event)
                }
              }
            )
          }
          else if (type === constant.EVENT_CHANGE && isBoxElement(node)) {
            addEventListener(
              node,
              constant.EVENT_CLICK,
              listener[EMITTER] = function (event: any) {
                event = new CustomEvent(event)
                event.type = constant.EVENT_CHANGE
                execute(listener, this, event)
              }
            )
          }
          else {
            node.attachEvent(`on${type}`, listener)
          }
        }

        removeEventListener = function (node: any, type: string, listener: (event: Event) => void) {
          if (type === constant.EVENT_INPUT) {
            removeEventListener(node, PROPERTY_CHANGE, listener[EMITTER])
            delete listener[EMITTER]
          }
          else if (type === constant.EVENT_CHANGE && isBoxElement(node)) {
            removeEventListener(node, constant.EVENT_CLICK, listener[EMITTER])
            delete listener[EMITTER]
          }
          else {
            node.detachEvent(`on${type}`, listener)
          }
        }

      }

    }

  }
}

const CHAR_WHITESPACE = ' ',

/**
 * 绑定在 HTML 元素上的事件发射器
 */
EMITTER = '$emitter',

/**
 * 低版本 IE 上 style 标签的专有属性
 */
STYLE_SHEET = 'styleSheet',

/**
 * 跟输入事件配套使用的事件
 */
COMPOSITION_START = 'compositionstart',

/**
 * 跟输入事件配套使用的事件
 */
COMPOSITION_END = 'compositionend',

domain = 'http://www.w3.org/',

namespaces = {
  svg: domain + '2000/svg',
  // xml: domain + 'XML/1998/namespace',
  // xlink: domain + '1999/xlink',
},

specialEvents: Record<string, SpecialEventHooks> = {}

specialEvents[constant.EVENT_MODEL] = {
  on(node: HTMLElement | Window | Document, listener: NativeListener) {
    let locked = constant.FALSE
    on(node, COMPOSITION_START, listener[COMPOSITION_START] = function () {
      locked = constant.TRUE
    })
    on(node, COMPOSITION_END, listener[COMPOSITION_END] = function (event: Event | CustomEvent) {
      locked = constant.FALSE
      listener(event)
    })
    addEventListener(node, constant.EVENT_INPUT, listener[constant.EVENT_INPUT] = function (event: Event | CustomEvent) {
      if (!locked) {
        listener(event)
      }
    })
  },
  off(node: HTMLElement | Window | Document, listener: NativeListener) {
    off(node, COMPOSITION_START, listener[COMPOSITION_START])
    off(node, COMPOSITION_END, listener[COMPOSITION_END])
    removeEventListener(node, constant.EVENT_INPUT, listener[constant.EVENT_INPUT])
    listener[COMPOSITION_START] =
    listener[COMPOSITION_END] =
    listener[constant.EVENT_INPUT] = constant.UNDEFINED
  }
}

export function createElement(tag: string, isSvg?: boolean): Element {
  return isSvg
    ? (constant.DOCUMENT as Document).createElementNS(namespaces.svg, tag)
    : (constant.DOCUMENT as Document).createElement(tag)
}

export function createText(text: string): Text {
  return (constant.DOCUMENT as Document).createTextNode(text)
}

export function createComment(text: string): Comment {
  return (constant.DOCUMENT as Document).createComment(text)
}

export function prop(node: HTMLElement, name: string, value?: string | number | boolean): string | number | boolean | void {
  if (isDef(value)) {
    object.set(node, name, value, constant.FALSE)
  }
  else {
    const holder = object.get(node, name)
    if (holder) {
      return holder.value
    }
  }
}

export function removeProp(node: HTMLElement, name: string, hint?: number): void {
  object.set(
    node,
    name,
    hint === HINT_BOOLEAN
      ? constant.FALSE
      : hint === HINT_NUMBER
        ? 0
        : constant.EMPTY_STRING,
    constant.FALSE
  )
}

export function attr(node: HTMLElement, name: string, value?: string): string | void {
  if (isDef(value)) {
    node.setAttribute(name, value as string)
  }
  else {
    // value 还可能是 null
    const value = node.getAttribute(name)
    if (value != constant.NULL) {
      return value
    }
  }
}

export function removeAttr(node: HTMLElement, name: string): void {
  node.removeAttribute(name)
}

export function before(parentNode: Node, node: Node, beforeNode: Node): void {
  parentNode.insertBefore(node, beforeNode)
}

export function append(parentNode: Node, node: Node): void {
  parentNode.appendChild(node)
}

export function replace(parentNode: Node, node: Node, oldNode: Node): void {
  parentNode.replaceChild(node, oldNode)
}

export function remove(parentNode: Node, node: Node): void {
  parentNode.removeChild(node)
}

export function parent(node: Node): Node | void {
  const { parentNode } = node
  if (parentNode) {
    return parentNode
  }
}

export function next(node: Node): Node | void {
  const { nextSibling } = node
  if (nextSibling) {
    return nextSibling
  }
}

export const find = findElement

export function tag(node: Node): string | void {
  if (node.nodeType === 1) {
    return string.lower((node as HTMLElement).tagName)
  }
}

export function text(node: Node, text?: string, isStyle?: boolean, isOption?: boolean): string | void {
  if (isDef(text)) {
    if (process.env.NODE_LEGACY) {
      if (isStyle && object.has(node, STYLE_SHEET)) {
        node[STYLE_SHEET].cssText = text
      }
      else {
        if (isOption) {
          (node as HTMLOptionElement).value = text as string
        }
        node[innerText] = text as string
      }
    }
    else {
      node[innerText] = text as string
    }
  }
  else {
    return node[innerText]
  }
}

export function html(node: Element, html?: string, isStyle?: boolean, isOption?: boolean): string | void {
  if (isDef(html)) {
    if (process.env.NODE_LEGACY) {
      if (isStyle && object.has(node, STYLE_SHEET)) {
        node[STYLE_SHEET].cssText = html
      }
      else {
        if (isOption) {
          (node as HTMLOptionElement).value = html as string
        }
        node[innerHTML] = html as string
      }
    }
    else {
      node[innerHTML] = html as string
    }
  }
  else {
    return node[innerHTML]
  }
}

export const addClass = addElementClass

export const removeClass = removeElementClass

export function on(node: HTMLElement | Window | Document, type: string, listener: Listener, context?: any): void {

  const emitter: Emitter = node[EMITTER] || (node[EMITTER] = new Emitter()),

  nativeListeners = emitter.nativeListeners || (emitter.nativeListeners = {})

  // 一个元素，相同的事件，只注册一个 native listener
  if (!nativeListeners[type]) {

    // 特殊事件
    const special = specialEvents[type],

    // 唯一的原生监听器
    nativeListener = function (event: Event | CustomEvent) {

      const customEvent = event instanceof CustomEvent
        ? event
        : new CustomEvent(event.type, createEvent(event, node))

      if (customEvent.type !== type) {
        customEvent.type = type
      }

      emitter.fire(type, [customEvent])

    }

    nativeListeners[type] = nativeListener

    if (special) {
      special.on(node, nativeListener)
    }
    else {
      addEventListener(node, type, nativeListener)
    }

  }

  emitter.on(
    type,
    {
      fn: listener,
      ctx: context,
    }
  )

}

export function off(node: HTMLElement | Window | Document, type: string, listener: Function): void {

  const emitter: Emitter = node[EMITTER],

  { listeners, nativeListeners } = emitter

  // emitter 会根据 type 和 listener 参数进行适当的删除
  emitter.off(type, listener)

  // 如果注册的 type 事件都解绑了，则去掉原生监听器
  if (nativeListeners && !emitter.has(type)) {

    const special = specialEvents[type],

    nativeListener = nativeListeners[type]

    if (special) {
      special.off(node, nativeListener)
    }
    else {
      removeEventListener(node, type, nativeListener)
    }

    delete nativeListeners[type]

  }

  if (object.falsy(listeners)) {
    node[EMITTER] = constant.UNDEFINED
  }

}

export function addSpecialEvent(type: string, hooks: SpecialEventHooks): void {
  if (process.env.NODE_ENV === 'development') {
    if (specialEvents[type]) {
      logger.fatal(`The special event "${type}" already exists.`)
    }
    logger.info(`The special event "${type}" is added successfully.`)
  }
  specialEvents[type] = hooks
}
