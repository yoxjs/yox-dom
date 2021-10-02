import {
  Listener,
  NativeListener,
} from 'yox-type/src/type'

import {
  SpecialEventHooks,
} from 'yox-type/src/hooks'

import * as array from 'yox-common/src/util/array'
import * as string from 'yox-common/src/util/string'
import * as object from 'yox-common/src/util/object'
import * as logger from 'yox-common/src/util/logger'
import * as constant from 'yox-common/src/util/constant'

import CustomEvent from 'yox-common/src/util/CustomEvent'


let guid = 0,

// 这里先写 IE9 支持的接口
textContent = 'textContent',

innerHTML = 'innerHTML',

cssFloat = 'cssFloat',

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
    let testElement: HTMLElement | void = constant.DOCUMENT.documentElement

    if (!(cssFloat in testElement.style)) {
      cssFloat = 'styleFloat'
    }

    if (!testElement.classList) {
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

      if (!testElement.addEventListener) {

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

        // textContent 不兼容 IE678
        // 改用 innerText 属性
        textContent = 'innerText'

        createEvent = function (event, element) {
          return new IEEvent(event, element)
        }

        findElement = function (selector: string): Element | void {
          // 去掉 #
          if (string.codeAt(selector, 0) === 35) {
            selector = string.slice(selector, 1)
          }
          else if (process.env.NODE_ENV === 'development') {
            logger.fatal(`The id selector, such as "#id", is the only supported selector for the legacy version.`)
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
              listener[EVENT] = function (event: any) {
                if (event.propertyName === 'value') {
                  listener(
                    new CustomEvent(constant.EVENT_INPUT, createEvent(event, node)) as any
                  )
                }
              }
            )
          }
          else if (type === constant.EVENT_CHANGE && isBoxElement(node)) {
            addEventListener(
              node,
              constant.EVENT_CLICK,
              listener[EVENT] = function (event: any) {
                listener(
                  new CustomEvent(constant.EVENT_CHANGE, createEvent(event, node)) as any
                )
              }
            )
          }
          else {
            node.attachEvent(`on${type}`, listener)
          }
        }

        removeEventListener = function (node: any, type: string, listener: (event: Event) => void) {
          if (type === constant.EVENT_INPUT) {
            removeEventListener(node, PROPERTY_CHANGE, listener[EVENT])
            delete listener[EVENT]
          }
          else if (type === constant.EVENT_CHANGE && isBoxElement(node)) {
            removeEventListener(node, constant.EVENT_CLICK, listener[EVENT])
            delete listener[EVENT]
          }
          else {
            node.detachEvent(`on${type}`, listener)
          }
        }

      }

    }

    testElement = constant.UNDEFINED

  }
}

const CHAR_WHITESPACE = ' ',

/**
 * 绑定在 HTML 元素上的事件发射器
 */
EVENT = '$event',

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

nativeListenerCount: Record<number, number> = {},

nativeListeners: Record<number, Record<string, NativeListener>> = {},

customListeners: Record<number, Record<string, Listener[]>> = {},

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

export function getBodyElement() {
  return (constant.DOCUMENT as Document).body
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

export function getProp(node: HTMLElement, name: string): string | number | boolean | void {
  return node[name]
}

export function setProp(node: HTMLElement, name: string, value: string | number | boolean): void {
  node[name] = value
}

export function removeProp(node: HTMLElement, name: string): void {
  node[name] = constant.UNDEFINED
}

export function getAttr(node: HTMLElement, name: string): string | void {
  const value = node.getAttribute(name)
  if (value != constant.NULL) {
    return value
  }
}

export function setAttr(node: HTMLElement, name: string, value: string): void {
  node.setAttribute(name, value)
}

export function removeAttr(node: HTMLElement, name: string): void {
  node.removeAttribute(name)
}

// 这里不传 HTMLElement 是因为外面会在循环里调用，频繁读取 node.style 挺浪费性能的
export function setStyle(style: CSSStyleDeclaration, name: string, value: string | number | void) {
  if (value == constant.NULL) {
    style[name] = constant.EMPTY_STRING
    return
  }
  style[name === 'float' ? cssFloat : name] = value
}

// 这里不传 HTMLElement 是因为外面会在循环里调用，频繁读取 node.style 挺浪费性能的
export function removeStyle(style: CSSStyleDeclaration, name: string) {
  style[name] = constant.EMPTY_STRING
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

export function getText(node: Node): string | void {
  return node[textContent]
}

export function setText(node: Node, text: string, isStyle?: boolean, isOption?: boolean): void {
  if (process.env.NODE_LEGACY) {
    if (isStyle && object.has(node, STYLE_SHEET)) {
      node[STYLE_SHEET].cssText = text
    }
    else {
      if (isOption) {
        (node as HTMLOptionElement).value = text as string
      }
      node[textContent] = text as string
    }
  }
  else {
    node[textContent] = text as string
  }
}

export function getHtml(node: Element): string | void {
  return node[innerHTML]
}

export function setHtml(node: Element, html: string, isStyle?: boolean, isOption?: boolean): void {
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

export const addClass = addElementClass

export const removeClass = removeElementClass

export function on(node: HTMLElement | Window | Document, type: string, listener: Listener): void {

  const nativeKey = node[EVENT] || (node[EVENT] = ++guid),

  nativeListenerMap = nativeListeners[nativeKey] || (nativeListeners[nativeKey] = {}),

  customListenerMap = customListeners[nativeKey] || (customListeners[nativeKey] = {}),

  customListenerList = customListenerMap[type] || (customListenerMap[type] = [])

  // 一个元素，相同的事件，只注册一个 native listener
  if (!nativeListenerMap[type]) {

    // 特殊事件
    const special = specialEvents[type],

    // 唯一的原生监听器
    nativeListener = function (event: Event | CustomEvent) {

      let customEvent: CustomEvent

      if (CustomEvent.is(event)) {
        customEvent = event as CustomEvent
        if (customEvent.type !== type) {
          customEvent.type = type
        }
      }
      else {
        customEvent = new CustomEvent(type, createEvent(event, node))
      }

      // 避免遍历过程中，数组发生变化，比如增删了
      const listenerList = customListenerList.slice()

      for (let i = 0, length = listenerList.length; i < length; i++) {
        listenerList[i](customEvent, constant.UNDEFINED, constant.TRUE)
      }

    }

    nativeListenerMap[type] = nativeListener

    if (nativeListenerCount[nativeKey]) {
      nativeListenerCount[nativeKey]++
    }
    else {
      nativeListenerCount[nativeKey] = 1
    }

    if (special) {
      special.on(node, nativeListener)
    }
    else {
      addEventListener(node, type, nativeListener)
    }

  }

  customListenerList.push(listener)

}

export function off(node: HTMLElement | Window | Document, type: string, listener: Function): void {

  let nativeKey = node[EVENT],

  nativeListenerMap = nativeListeners[nativeKey],

  customListenerMap = customListeners[nativeKey],

  customListenerList: Listener[] | void = customListenerMap && customListenerMap[type]

  if (customListenerList) {
    array.remove(
      customListenerList,
      listener
    )
    if (!customListenerList.length) {
      customListenerList = constant.UNDEFINED
      delete customListenerMap[type]
    }
  }

  // 如果注册的 type 事件都解绑了，则去掉原生监听器
  if (nativeListenerMap && nativeListenerMap[type] && !customListenerList) {

    const special = specialEvents[type],

    nativeListener = nativeListenerMap[type]

    if (special) {
      special.off(node, nativeListener)
    }
    else {
      removeEventListener(node, type, nativeListener)
    }

    delete nativeListenerMap[type]

    if (nativeListenerCount[nativeKey]) {
      nativeListenerCount[nativeKey]--
    }

  }

  if (!nativeListenerCount[nativeKey]) {
    node[EVENT] = constant.UNDEFINED
    delete nativeListeners[nativeKey]
    delete customListeners[nativeKey]
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
