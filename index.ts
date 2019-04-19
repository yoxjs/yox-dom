import * as config from 'yox-config'

import isDef from 'yox-common/function/isDef'

import * as env from 'yox-common/util/env'
import * as array from 'yox-common/util/array'
import * as string from 'yox-common/util/string'
import * as object from 'yox-common/util/object'

import Emitter from 'yox-common/util/Emitter'
import CustomEvent from 'yox-common/util/Event'

import API from 'yox-type/src/API'
import SpecialEvent from 'yox-type/src/SpecialEvent'
import * as signature from 'yox-type/src/type'


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
  if (doc.querySelector) {
    findElement = function (selector: string, context?: HTMLElement) {
      return (doc || context).querySelector(selector)
    }
  }
  else {
    findElement = function (selector: string) {
      // 去掉 #
      return doc.getElementById(string.slice(selector, 1))
    }
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

  createElement(tag: string, isSvg?: boolean): HTMLElement {
    return isSvg
      ? doc.createElementNS(namespaces.svg, tag)
      : doc.createElement(tag)
  },

  createText(text: string): Text {
    return doc.createTextNode(text)
  },

  createComment(text: string): Comment {
    return doc.createComment(text)
  },

  createEvent(event: any, node: HTMLElement): any {
    return event
  },

  isElement(node: Node): boolean {
    return node.nodeType === 1
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
      node.setAttribute(name, value)
    }
    else {
      return node.getAttribute(name)
    }
  },

  removeAttr(node: HTMLElement, name: string): void {
    node.removeAttribute(name)
  },

  data(node: HTMLElement, name: string, value?: string): string | void {
    // 不用 dataset，因为 removeData 时不好处理，这样反而还少了兼容问题
    return domApi.attr(node, `data-${string.hyphenate(name)}`, value)
  },

  removeData(node: HTMLElement, name: string): void {
    domApi.removeAttr(node, `data-${string.hyphenate(name)}`)
  },

  before(parentNode: Node, newNode: Node, referenceNode: Node): void {
    if (referenceNode) {
      parentNode.insertBefore(newNode, referenceNode)
    }
    else {
      domApi.append(parentNode, newNode)
    }
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

  parent(node: Node): Node {
    return node.parentNode
  },

  next(node: Node): Node {
    return node.nextSibling
  },

  find(selector: string, context?: HTMLElement): HTMLElement | void {
    return findElement(selector, context)
  },

  tag(node: HTMLElement): string {
    const { tagName } = node
    return string.falsy(tagName)
      ? env.EMPTY_STRING
      : tagName.toLowerCase()
  },

  children(node: Node): Node[] {
    return array.toArray(node.childNodes)
  },

  text(node: HTMLElement, content?: string): string | void {
    if (isDef(content)) {
      node.textContent = content
    }
    else {
      return node.textContent
    }
  },

  html(node: HTMLElement, content?: string): string | void {
    if (isDef(content)) {
      node.innerHTML = content
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
        func: listener,
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
    if (!emitter.has(type)) {

      const special = specialEvents[type],

      nativeListener = nativeListeners[type]

      if (special) {
        special.off(node, nativeListener as signature.specialEventListener)
      }
      else {
        removeEventListener(node, type, nativeListener)
      }

      nativeListeners[type] = env.UNDEFINED

    }

    if (object.empty(listeners)) {
      node[EMITTER] = env.UNDEFINED
    }

  },

  specialEvents

}

export default domApi