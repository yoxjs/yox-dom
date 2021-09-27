import * as domApi from 'yox-dom/src/dom'
import CustomEvent from 'yox-common/src/util/CustomEvent'

test("createElement/tag", () => {

  const div = domApi.createElement('div')
  expect(div != null).toBe(true)
  expect(div.tagName.toUpperCase()).toBe('DIV')
  expect(div.nodeType).toBe(document.createElement('div').nodeType)
  expect(domApi.tag(div)).toBe('div')

  const svg = domApi.createElement('svg', true)
  expect(svg != null).toBe(true)
  expect(svg.tagName.toUpperCase()).toBe('SVG')
  expect(domApi.tag(svg)).toBe('svg')

})

test("createText", () => {

  const text = '哈哈'

  const result = domApi.createText(text)
  const native = document.createTextNode(text)

  expect(result != null).toBe(true)
  expect(result.textContent).toBe(text)
  expect(result.nodeName).toBe(native.nodeName)
  expect(result.nodeType).toBe(native.nodeType)

})

test("createComment", () => {

  const text = '哈哈'

  const result = domApi.createComment(text)
  const native = document.createComment(text)

  expect(result != null).toBe(true)
  expect(result.textContent).toBe(text)
  expect(result.nodeName).toBe(native.nodeName)
  expect(result.nodeType).toBe(native.nodeType)

})

test("prop", () => {

  const element = domApi.createElement('input') as HTMLInputElement

  domApi.setProp(element, 'type', 'number')

  expect(element.type).toBe('number')
  expect(domApi.getProp(element, 'type')).toBe('number')

  domApi.setProp(element, 'disabled', true)

  expect(element.disabled).toBe(true)
  expect(domApi.getProp(element, 'disabled')).toBe(true)

  domApi.setProp(element, 'width', 100)

  expect(element.width).toBe(100)
  expect(domApi.getProp(element, 'width')).toBe(100)

  domApi.setProp(element, 'xxx', 100)

  expect(element['xxx']).toBe(100)
  expect(domApi.getProp(element, 'xxx')).toBe(100)

  domApi.setProp(element, 'yyy', true)

  expect(element['yyy']).toBe(true)
  expect(domApi.getProp(element, 'yyy')).toBe(true)

})

test("removeProp", () => {

  const element = domApi.createElement('input') as HTMLInputElement

  domApi.setProp(element, 'type', 'number')

  expect(element.type).toBe('number')
  expect(domApi.getProp(element, 'type')).toBe('number')

  domApi.removeProp(element, 'type')
  expect(element.type).toBe(domApi.getProp(element, 'type'))
  expect(element.type).not.toBe('number')




  domApi.setProp(element, 'disabled', true)

  expect(element.disabled).toBe(true)
  expect(domApi.getProp(element, 'disabled')).toBe(true)

  domApi.removeProp(element, 'disabled')
  expect(element.disabled).toBe(domApi.getProp(element, 'disabled'))
  expect(element.disabled).toBe(false)



  domApi.setProp(element, 'width', 100)

  expect(element.width).toBe(100)
  expect(domApi.getProp(element, 'width')).toBe(100)

  domApi.removeProp(element, 'width')
  expect(element.width).toBe(domApi.getProp(element, 'width'))
  expect(element.width).toBe(undefined)



  domApi.setProp(element, 'xxx', 100)

  expect(element['xxx']).toBe(100)
  expect(domApi.getProp(element, 'xxx')).toBe(100)

  domApi.removeProp(element, 'xxx')
  expect(element['xxx']).toBe(domApi.getProp(element, 'xxx'))
  expect(element['xxx']).toBe(undefined)


  domApi.setProp(element, 'yyy', true)

  expect(element['yyy']).toBe(true)
  expect(domApi.getProp(element, 'yyy')).toBe(true)

  domApi.removeProp(element, 'yyy')
  expect(element['yyy']).toBe(domApi.getProp(element, 'yyy'))
  expect(element['yyy']).toBe(undefined)




  domApi.setProp(element, 'zzz', '123')

  expect(element['zzz']).toBe('123')
  expect(domApi.getProp(element, 'zzz')).toBe('123')

  domApi.removeProp(element, 'zzz')
  expect(element['zzz']).toBe(domApi.getProp(element, 'zzz'))
  expect(element['zzz']).toBe(undefined)

})

test("attr", () => {

  const element = domApi.createElement('input') as HTMLInputElement

  domApi.setAttr(element, 'type', 'number')

  expect(element.getAttribute('type')).toBe('number')
  expect(domApi.getAttr(element, 'type')).toBe('number')

  domApi.setAttr(element, 'data-type', 'xxx')

  expect(element.getAttribute('data-type')).toBe('xxx')
  expect(domApi.getAttr(element, 'data-type')).toBe('xxx')

})

test("removeAttr", () => {

  const element = domApi.createElement('input') as HTMLInputElement

  domApi.setAttr(element, 'type', 'number')

  expect(element.getAttribute('type')).toBe('number')
  expect(domApi.getAttr(element, 'type')).toBe('number')

  domApi.removeAttr(element, 'type')
  expect(domApi.getAttr(element, 'type')).toBe(undefined)

  domApi.setAttr(element, 'data-type', 'xxx')

  expect(element.getAttribute('data-type')).toBe('xxx')
  expect(domApi.getAttr(element, 'data-type')).toBe('xxx')

  domApi.removeAttr(element, 'x-type')
  expect(domApi.getAttr(element, 'x-type')).toBe(undefined)
})

test("before/append/replace/remove", () => {

  const element = domApi.createElement('div') as HTMLElement

  element.innerHTML = `
    <div>11</div>
  `

  expect(element.children.length).toBe(1)

  const div = element.children[0]

  const beforeElement = domApi.createElement('span') as HTMLElement
  domApi.before(element, beforeElement, div)
  expect(element.children.length).toBe(2)
  expect(element.children[0].tagName).toBe('SPAN')
  expect(element.children[1].tagName).toBe('DIV')

  const appendElement = domApi.createElement('b') as HTMLElement
  domApi.append(element, appendElement)
  expect(element.children.length).toBe(3)
  expect(element.children[0].tagName).toBe('SPAN')
  expect(element.children[1].tagName).toBe('DIV')
  expect(element.children[2].tagName).toBe('B')

  const newElement = domApi.createElement('input') as HTMLElement
  domApi.replace(element, newElement, div)
  expect(element.children.length).toBe(3)
  expect(element.children[0].tagName).toBe('SPAN')
  expect(element.children[1].tagName).toBe('INPUT')
  expect(element.children[2].tagName).toBe('B')

  domApi.remove(element, newElement)
  expect(element.children.length).toBe(2)
  expect(element.children[0].tagName).toBe('SPAN')
  expect(element.children[1].tagName).toBe('B')

})

test("parent/next", () => {

  const element = domApi.createElement('div') as HTMLElement

  element.innerHTML = '<a></a><b></b><i></i>'

  expect(element.children.length).toBe(3)
  expect(domApi.parent(element)).toBe(undefined)

  const a = element.children[0]

  const parentElement = domApi.parent(a) as HTMLElement
  expect(parentElement != null).toBe(true)
  if (parentElement) {
    expect(parentElement.tagName).toBe('DIV')
  }

  let nextElement = domApi.next(a) as HTMLElement
  expect(nextElement != null).toBe(true)
  if (nextElement) {
    expect(nextElement.tagName).toBe('B')
  }

  nextElement = domApi.next(nextElement) as HTMLElement
  expect(nextElement != null).toBe(true)
  if (nextElement) {
    expect(nextElement.tagName).toBe('I')
  }

  expect(domApi.next(nextElement)).toBe(undefined)

})

test("find", () => {

  document.body.innerHTML = `
    <div id="app">123</div>
  `
  const element = domApi.find('#app') as HTMLElement

  expect(element != null).toBe(true)
  expect(element.id).toBe('app')
  expect(element.tagName).toBe('DIV')

  expect(domApi.find('#app1')).toBe(undefined)

})

test("text/html", () => {

  document.body.innerHTML = `
    <div id="app">123</div>
  `
  const element = domApi.find('#app') as HTMLElement

  domApi.text(element, '<i>123</i>')
  expect(element.innerHTML).toBe('&lt;i&gt;123&lt;/i&gt;')
  expect(domApi.text(element)).toBe('<i>123</i>')
  expect(domApi.text(element)).not.toBe(domApi.html(element))

  domApi.html(element, '<i>123</i>')
  expect(element.innerHTML).toBe('<i>123</i>')
  expect(domApi.html(element)).toBe('<i>123</i>')

})

test("addClass/removeClass", () => {

  const element = domApi.createElement('div') as HTMLElement

  domApi.addClass(element, 'a')
  expect(element.className).toBe('a')

  domApi.addClass(element, 'b')
  expect(element.className).toBe('a b')

  domApi.addClass(element, 'c')
  expect(element.className).toBe('a b c')

  domApi.removeClass(element, 'b')
  expect(element.className).toBe('a c')

  domApi.removeClass(element, 'a')
  expect(element.className).toBe('c')

  domApi.removeClass(element, 'b')
  expect(element.className).toBe('c')

  domApi.removeClass(element, 'c')
  expect(element.className).toBe('')

})

test("on/off", () => {

  const element = domApi.createElement('div') as HTMLElement

  let fired = 0, isCustomEvent = false, isClick = false

  const listener = function (e: any) {
    fired++
    isCustomEvent = e instanceof CustomEvent
    isClick = e.type === 'click' && e.originalEvent.type === 'click'
  }

  domApi.on(element, 'click', listener)
  element.click()

  expect(fired).toBe(1)
  expect(isCustomEvent).toBe(true)
  expect(isClick).toBe(true)

  domApi.off(element, 'click', listener)
  element.click()
  expect(fired).toBe(1)

})

test("addSpecialEvent", () => {

  const element = domApi.createElement('div') as HTMLElement

  domApi.addSpecialEvent('tap', {
    on: function (element, listener) {
      domApi.on(element, 'click', listener)
    },
    off: function (element, listener) {
      domApi.off(element, 'click', listener)
    }
  })

  let fired = 0, isCustomEvent = false, isTap = false

  const listener = function (e: any) {
    fired++
    isCustomEvent = e instanceof CustomEvent
    // 保留原始事件的名称
    isTap = e.type === 'tap' && e.originalEvent.type === 'click'
  }

  domApi.on(element, 'tap', listener)
  element.click()

  expect(fired).toBe(1)
  expect(isCustomEvent).toBe(true)
  expect(isTap).toBe(true)

  domApi.off(element, 'tap', listener)
  element.click()
  expect(fired).toBe(1)

})