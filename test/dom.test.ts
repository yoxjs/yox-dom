import * as domApi from 'yox-dom/src/dom'
import * as config from 'yox-config/src/config'
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

  domApi.prop(element, 'type', 'number')

  expect(element.type).toBe('number')
  expect(domApi.prop(element, 'type')).toBe('number')

  domApi.prop(element, 'disabled', true)

  expect(element.disabled).toBe(true)
  expect(domApi.prop(element, 'disabled')).toBe(true)

  domApi.prop(element, 'width', 100)

  expect(element.width).toBe(100)
  expect(domApi.prop(element, 'width')).toBe(100)

  domApi.prop(element, 'xxx', 100)

  expect(element['xxx']).toBe(100)
  expect(domApi.prop(element, 'xxx')).toBe(100)

  domApi.prop(element, 'yyy', true)

  expect(element['yyy']).toBe(true)
  expect(domApi.prop(element, 'yyy')).toBe(true)

})

test("removeProp", () => {

  const element = domApi.createElement('input') as HTMLInputElement

  domApi.prop(element, 'type', 'number')

  expect(element.type).toBe('number')
  expect(domApi.prop(element, 'type')).toBe('number')

  domApi.removeProp(element, 'type', config.HINT_STRING)
  expect(element.type).toBe(domApi.prop(element, 'type'))
  expect(element.type).not.toBe('number')




  domApi.prop(element, 'disabled', true)

  expect(element.disabled).toBe(true)
  expect(domApi.prop(element, 'disabled')).toBe(true)

  domApi.removeProp(element, 'disabled', config.HINT_BOOLEAN)
  expect(element.disabled).toBe(domApi.prop(element, 'disabled'))
  expect(element.disabled).toBe(false)



  domApi.prop(element, 'width', 100)

  expect(element.width).toBe(100)
  expect(domApi.prop(element, 'width')).toBe(100)

  domApi.removeProp(element, 'width', config.HINT_NUMBER)
  expect(element.width).toBe(domApi.prop(element, 'width'))
  expect(element.width).toBe(0)



  domApi.prop(element, 'xxx', 100)

  expect(element['xxx']).toBe(100)
  expect(domApi.prop(element, 'xxx')).toBe(100)

  domApi.removeProp(element, 'xxx', config.HINT_NUMBER)
  expect(element['xxx']).toBe(domApi.prop(element, 'xxx'))
  expect(element['xxx']).toBe(0)


  domApi.prop(element, 'yyy', true)

  expect(element['yyy']).toBe(true)
  expect(domApi.prop(element, 'yyy')).toBe(true)

  domApi.removeProp(element, 'yyy', config.HINT_BOOLEAN)
  expect(element['yyy']).toBe(domApi.prop(element, 'yyy'))
  expect(element['yyy']).toBe(false)




  domApi.prop(element, 'zzz', '123')

  expect(element['zzz']).toBe('123')
  expect(domApi.prop(element, 'zzz')).toBe('123')

  domApi.removeProp(element, 'zzz', config.HINT_STRING)
  expect(element['zzz']).toBe(domApi.prop(element, 'zzz'))
  expect(element['zzz']).toBe('')

})

test("attr", () => {

  const element = domApi.createElement('input') as HTMLInputElement

  domApi.attr(element, 'type', 'number')

  expect(element.getAttribute('type')).toBe('number')
  expect(domApi.attr(element, 'type')).toBe('number')

  domApi.attr(element, 'data-type', 'xxx')

  expect(element.getAttribute('data-type')).toBe('xxx')
  expect(domApi.attr(element, 'data-type')).toBe('xxx')

})

test("removeAttr", () => {

  const element = domApi.createElement('input') as HTMLInputElement

  domApi.attr(element, 'type', 'number')

  expect(element.getAttribute('type')).toBe('number')
  expect(domApi.attr(element, 'type')).toBe('number')

  domApi.removeAttr(element, 'type')
  expect(domApi.attr(element, 'type')).toBe(undefined)

  domApi.attr(element, 'data-type', 'xxx')

  expect(element.getAttribute('data-type')).toBe('xxx')
  expect(domApi.attr(element, 'data-type')).toBe('xxx')

  domApi.removeAttr(element, 'x-type')
  expect(domApi.attr(element, 'x-type')).toBe(undefined)
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

  let fired = 0, isCustomEvent = false, isClick = false, context: any

  const listener = function (e: any) {
    fired++
    isCustomEvent = e instanceof CustomEvent
    isClick = e.type === 'click' && e.originalEvent.type === 'click'
    context = this
  }

  domApi.on(element, 'click', listener, listener)
  element.click()

  expect(fired).toBe(1)
  expect(isCustomEvent).toBe(true)
  expect(isClick).toBe(true)
  expect(context).toBe(listener)

  domApi.off(element, 'click', listener)
  element.click()
  expect(fired).toBe(1)

})