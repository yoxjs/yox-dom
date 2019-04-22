import * as config from 'yox-config/index'

import isDef from 'yox-common/src/function/isDef'

import * as is from 'yox-common/src/util/is'
import * as env from 'yox-common/src/util/env'
import * as array from 'yox-common/src/util/array'
import * as string from 'yox-common/src/util/string'
import * as object from 'yox-common/src/util/object'

import Emitter from 'yox-common/src/util/Emitter'
import CustomEvent from 'yox-common/src/util/Event'

import API from 'yox-type/src/API'
import SpecialEvent from 'yox-type/src/SpecialEvent'

import * as signature from 'yox-type/index'


let doc = env.doc,

addEventListener: Function = env.EMPTY_FUNCTION,

removeEventListener: Function = env.EMPTY_FUNCTION,

findElement: Function = env.EMPTY_FUNCTION

if (doc) {
  if (doc.addEventListener) {
    addEventListener = function (node: HTMLElement, type: string, listener: (event: Event) => void) {
      node.addEventListener(type, listener, env.FALSE)
    }
    removeEventListener = function (node: HTMLElement, type: string, listener: (event: Event) => void) {
      node.removeEventListener(type, listener, env.FALSE)
    }
  }
  else {
    addEventListener = function (node: any, type: string, listener: (event: Event) => void) {
      node.attachEvent(`on${type}`, listener)
    }
    removeEventListener = function (node: any, type: string, listener: (event: Event) => void) {
      node.detachEvent(`on${type}`, listener)
    }
  }
  findElement = doc.querySelector
    ? function (selector: string) {
        return (doc as Document).querySelector(selector)
      }
    : function (selector: string) {
        // 去掉 #
        return (doc as Document).getElementById(string.slice(selector, 1))
      }
}

const CHAR_WHITESPACE = ' ',

EMITTER = '$emitter',

/**
 * 输入事件
 */
INPUT = 'input',

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
  xml: domain + 'XML/1998/namespace',
  xlink: domain + '1999/xlink',
},

specialEvents: Record<string, SpecialEvent> = {
  input: {
    on(node: HTMLElement, listener: signature.specialEventListener) {
      let locked = env.FALSE
      domApi.on(node, COMPOSITION_START, listener[COMPOSITION_START] = function () {
        locked = env.TRUE
      })
      domApi.on(node, COMPOSITION_END, listener[COMPOSITION_END] = function (event: CustomEvent) {
        locked = env.FALSE
        event.type = INPUT
        listener(event)
      })
      addEventListener(node, INPUT, listener[INPUT] = function (event: Event) {
        if (!locked) {
          listener(event)
        }
      })
    },
    off(node: HTMLElement, listener: signature.specialEventListener) {
      domApi.off(node, COMPOSITION_START, listener[COMPOSITION_START])
      domApi.off(node, COMPOSITION_END, listener[COMPOSITION_END])
      removeEventListener(node, INPUT, listener[INPUT])
      listener[COMPOSITION_START] =
      listener[COMPOSITION_END] =
      listener[INPUT] = env.UNDEFINED
    }
  }
},

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

  createEvent(event: any, node: HTMLElement): any {
    return event
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

  before(parentNode: Node, newNode: Node, referenceNode: Node): void {
    parentNode.insertBefore(newNode, referenceNode)
  },

  append(parentNode: Node, node: Node): void {
    parentNode.appendChild(node)
  },

  replace(parentNode: Node, newNode: Node, oldNode: Node): void {
    parentNode.replaceChild(newNode, oldNode)
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

  find(selector: string): HTMLElement | void {
    return findElement(selector)
  },

  tag(node: Node): string | void {
    if (node.nodeType === 1) {
      return (node as HTMLElement).tagName.toLowerCase()
    }
  },

  text(node: Node, content?: string): string | void {
    if (isDef(content)) {
      node.textContent = content as string
    }
    else {
      const { textContent } = node
      if (is.string(textContent)) {
        return textContent as string
      }
    }
  },

  html(node: HTMLElement, content?: string): string | void {
    if (isDef(content)) {
      node.innerHTML = content as string
    }
    else {
      return node.innerHTML
    }
  },

  addClass(node: HTMLElement, className: string): void {
    const { classList } = node
    if (classList && classList.add) {
      classList.add(className)
    }
    else {
      const classes = node.className.split(CHAR_WHITESPACE)
      if (!array.has(classes, className)) {
        array.push(classes, className)
        node.className = array.join(classes, CHAR_WHITESPACE)
      }
    }
  },

  removeClass(node: HTMLElement, className: string): void {
    const { classList } = node
    if (classList && classList.remove) {
      classList.remove(className)
    }
    else {
      const classes = node.className.split(CHAR_WHITESPACE)
      if (array.remove(classes, className)) {
        node.className = array.join(classes, CHAR_WHITESPACE)
      }
    }
  },

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
            : new CustomEvent(event.type, domApi.createEvent(event, node))
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

    if (object.empty(listeners)) {
      node[EMITTER] = env.UNDEFINED
    }

  },

  specialEvents

}

export default domApi