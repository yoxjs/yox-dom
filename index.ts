import * as config from 'yox-config/index'

import isDef from 'yox-common/src/function/isDef'
import execute from 'yox-common/src/function/execute'

import * as env from 'yox-common/src/util/env'
import * as array from 'yox-common/src/util/array'
import * as string from 'yox-common/src/util/string'
import * as object from 'yox-common/src/util/object'
import * as logger from 'yox-common/src/util/logger'

import Emitter from 'yox-common/src/util/Emitter'
import CustomEvent from 'yox-common/src/util/Event'

import API from 'yox-type/src/API'
import SpecialEvent from 'yox-type/src/SpecialEvent'

import * as signature from 'yox-type/index'

let doc = env.doc,

// 这里先写 IE9 支持的接口
innerText = 'textContent',

findElement = function (selector: string): Element | void {
  const node = (doc as Document).querySelector(selector)
  if (node) {
    return node
  }
},

addEventListener = function (node: HTMLElement, type: string, listener: (event: Event) => void) {
  node.addEventListener(type, listener, env.FALSE)
},

removeEventListener = function (node: HTMLElement, type: string, listener: (event: Event) => void) {
  node.removeEventListener(type, listener, env.FALSE)
},

// IE9 不支持 classList
addClass = function (node: HTMLElement, className: string) {
  node.classList.add(className)
},

removeClass = function (node: HTMLElement, className: string) {
  node.classList.remove(className)
},

createEvent = function (event: any, node: HTMLElement): any {
  return event
}

if (doc) {

  if (!doc.body.classList) {
    addClass = function (node: HTMLElement, className: string) {
      const classes = node.className.split(CHAR_WHITESPACE)
      if (!array.has(classes, className)) {
        array.push(classes, className)
        node.className = array.join(classes, CHAR_WHITESPACE)
      }
    }
    removeClass = function (node: HTMLElement, className: string) {
      const classes = node.className.split(CHAR_WHITESPACE)
      if (array.remove(classes, className)) {
        node.className = array.join(classes, CHAR_WHITESPACE)
      }
    }
  }

  // 为 IE9 以下浏览器打补丁
  if (process.env.NODE_LEGACY) {

    if (!doc.addEventListener) {

      const PROPERTY_CHANGE = 'propertychange'

      addEventListener = function (node: any, type: string, listener: (event: Event) => void) {
        if (type === env.EVENT_INPUT) {
          addEventListener(
            node,
            PROPERTY_CHANGE,
            // 借用 EMITTER，反正只是内部临时用一下...
            listener[EMITTER] = function (event: any) {
              if (event.propertyName === env.RAW_VALUE) {
                event = new CustomEvent(event)
                event.type = env.EVENT_INPUT
                execute(listener, this, event)
              }
            }
          )
        }
        else if (type === env.EVENT_CHANGE && isBoxElement(node)) {
          addEventListener(
            node,
            env.EVENT_CLICK,
            listener[EMITTER] = function (event: any) {
              event = new CustomEvent(event)
              event.type = env.EVENT_CHANGE
              execute(listener, this, event)
            }
          )
        }
        else {
          node.attachEvent(`on${type}`, listener)
        }
      }

      removeEventListener = function (node: any, type: string, listener: (event: Event) => void) {
        if (type === env.EVENT_INPUT) {
          removeEventListener(node, PROPERTY_CHANGE, listener[EMITTER])
          delete listener[EMITTER]
        }
        else if (type === env.EVENT_CHANGE && isBoxElement(node)) {
          removeEventListener(node, env.EVENT_CLICK, listener[EMITTER])
          delete listener[EMITTER]
        }
        else {
          node.detachEvent(`on${type}`, listener)
        }
      }

      function isBoxElement(node: HTMLInputElement) {
        return node.tagName === 'INPUT'
          && (node.type === 'radio' || node.type === 'checkbox')
      }

      class IEEvent {

        currentTarget: HTMLElement

        target: HTMLElement | EventTarget

        originalEvent: Event

        constructor(event: Event, element: HTMLElement) {

          object.extend(this, event)

          this.currentTarget = element
          this.target = event.srcElement || element
          this.originalEvent = event

        }

        preventDefault() {
          this.originalEvent.returnValue = env.FALSE
        }

        stopPropagation() {
          this.originalEvent.cancelBubble = env.TRUE
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
        else {
          if (process.env.NODE_ENV === 'dev') {
            logger.fatal(`legacy 版本选择器只支持 #id 格式`)
          }
        }
        const node = (doc as Document).getElementById(selector)
        if (node) {
          return node
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

specialEvents: Record<string, SpecialEvent> = {},

domApi: API = {

  createElement(tag: string, isSvg?: boolean): Element {
    return isSvg
      ? (doc as Document).createElementNS(namespaces.svg, tag)
      : (doc as Document).createElement(tag)
  },

  createText(text: string): Text {
    return (doc as Document).createTextNode(text)
  },

  createComment(text: string): Comment {
    return (doc as Document).createComment(text)
  },

  prop(node: HTMLElement, name: string, value?: string | number | boolean): string | number | boolean | void {
    if (isDef(value)) {
      object.set(node, name, value, env.FALSE)
    }
    else {
      return object.get(node, name)
    }
  },

  removeProp(node: HTMLElement, name: string, hint?: number): void {
    object.set(
      node,
      name,
      hint === config.HINT_BOOLEAN
        ? env.FALSE
        : env.EMPTY_STRING,
      env.FALSE
    )
  },

  attr(node: HTMLElement, name: string, value?: string): string | void {
    if (isDef(value)) {
      node.setAttribute(name, value as string)
    }
    else {
      // value 还可能是 null
      const value = node.getAttribute(name)
      if (value != env.NULL) {
        return value
      }
    }
  },

  removeAttr(node: HTMLElement, name: string): void {
    node.removeAttribute(name)
  },

  before(parentNode: Node, node: Node, referenceNode: Node): void {
    parentNode.insertBefore(node, referenceNode)
  },

  append(parentNode: Node, node: Node): void {
    parentNode.appendChild(node)
  },

  replace(parentNode: Node, node: Node, oldNode: Node): void {
    parentNode.replaceChild(node, oldNode)
  },

  remove(parentNode: Node, node: Node): void {
    parentNode.removeChild(node)
  },

  parent(node: Node): Node | void {
    const { parentNode } = node
    if (parentNode) {
      return parentNode
    }
  },

  next(node: Node): Node | void {
    const { nextSibling } = node
    if (nextSibling) {
      return nextSibling
    }
  },

  find: findElement,

  tag(node: Node): string | void {
    if (node.nodeType === 1) {
      return (node as HTMLElement).tagName.toLowerCase()
    }
  },

  text(node: Node, text?: string, isStyle?: boolean): string | void {
    if (isDef(text)) {
      if (process.env.NODE_LEGACY) {
        if (isStyle && isDef(node[STYLE_SHEET])) {
          node[STYLE_SHEET].cssText = text
        }
        else {
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
  },

  html(node: Element, html?: string, isStyle?: boolean): string | void {
    if (isDef(html)) {
      if (process.env.NODE_LEGACY) {
        if (isStyle && isDef(node[STYLE_SHEET])) {
          node[STYLE_SHEET].cssText = html
        }
        else {
          node.innerHTML = html as string
        }
      }
      else {
        node.innerHTML = html as string
      }
    }
    else {
      return node.innerHTML
    }
  },

  addClass,

  removeClass,

  on(node: HTMLElement, type: string, listener: signature.nativeEventListener, context?: any): void {

    const emitter: Emitter = node[EMITTER] || (node[EMITTER] = new Emitter()),

    nativeListeners = emitter.nativeListeners || (emitter.nativeListeners = {})

    // 一个元素，相同的事件，只注册一个 native listener
    if (!nativeListeners[type]) {

      // 特殊事件
      const special = specialEvents[type],

      // 唯一的原生监听器
      nativeListener = function (event: Event | CustomEvent) {

        emitter.fire(
          event instanceof CustomEvent
            ? event
            : new CustomEvent(event.type, createEvent(event, node))
        )

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
  },

  off(node: HTMLElement, type: string, listener: signature.nativeEventListener): void {

    const emitter: Emitter = node[EMITTER],

    { listeners, nativeListeners } = emitter

    // emitter 会根据 type 和 listener 参数进行适当的删除
    emitter.off(type, listener)

    // 如果注册的 type 事件都解绑了，则去掉原生监听器
    if (nativeListeners && !emitter.has(type)) {

      const special = specialEvents[type],

      nativeListener = nativeListeners[type]

      if (special) {
        special.off(node, nativeListener as signature.specialEventListener)
      }
      else {
        removeEventListener(node, type, nativeListener)
      }

      delete nativeListeners[type]

    }

    if (object.falsy(listeners)) {
      node[EMITTER] = env.UNDEFINED
    }

  },

  specialEvents

}

specialEvents[env.EVENT_INPUT] = {
  on(node: HTMLElement, listener: signature.specialEventListener) {
    let locked = env.FALSE
    domApi.on(node, COMPOSITION_START, listener[COMPOSITION_START] = function () {
      locked = env.TRUE
    })
    domApi.on(node, COMPOSITION_END, listener[COMPOSITION_END] = function (event: CustomEvent) {
      locked = env.FALSE
      event.type = env.EVENT_INPUT
      listener(event)
    })
    addEventListener(node, env.EVENT_INPUT, listener[env.EVENT_INPUT] = function (event: Event) {
      if (!locked) {
        listener(event)
      }
    })
  },
  off(node: HTMLElement, listener: signature.specialEventListener) {
    domApi.off(node, COMPOSITION_START, listener[COMPOSITION_START])
    domApi.off(node, COMPOSITION_END, listener[COMPOSITION_END])
    removeEventListener(node, env.EVENT_INPUT, listener[env.EVENT_INPUT])
    listener[COMPOSITION_START] =
    listener[COMPOSITION_END] =
    listener[env.EVENT_INPUT] = env.UNDEFINED
  }
}

export default domApi