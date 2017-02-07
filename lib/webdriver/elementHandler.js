import uuid from 'uuid'

export default class ElementHandler {
    constructor () {
        this.elements = []
    }

    find ({ using, debug, value }, fromElement) {
        const root = fromElement instanceof HTMLElement ? fromElement : document
        var elements

        switch (using) {
        case 'css selector':
            elements = this.findByCssSelector(value, root)
            break
        case 'link text':
            elements = this.findByXPath(`//a[text()[normalize-space()]="${value}"]`, root)
            break
        case 'partial link text':
            elements = this.findByXPath(`//a[contains(text()[normalize-space()],"${value}")]`, root)
            break
        case 'xpath':
            elements = this.findByXPath(value, root)
        }

        /**
         * format
         */
        const result = [].slice.call(elements).map((element) => {
            /**
             * check if element is already in cache
             */
            const cachedElement = this.elements.filter((e) => e.element === element)[0]
            if (cachedElement) {
                return cachedElement
            }

            return {
                uuid: `element-${uuid.v4({ rng: uuid.mathRNG }).slice(9)}`,
                using,
                value,
                element
            }
        })
        /**
         * don't append empty (filtered) entries
         */
        .filter((e) => Boolean(e))

        /**
         * cache element
         */
        this.elements = this.elements.concat(result)
        return result.map((result) => ({
            ELEMENT: result.uuid
        }))
    }

    /**
     * find elements by css selector
     * @param  {String} selector   css selector
     * @param  {HTMLElement} root  context node
     * @return {HTMLElement[]}     list if elements matching xpath
     */
    findByCssSelector (selector, root) {
        return root.querySelectorAll(selector)
    }

    /**
     * find element by xpath
     * @param  {String} selector   xpath selector
     * @param  {HTMLElement} root  context node
     * @return {HTMLElement[]}     list of elements matching xpath
     */
    findByXPath (selector, root) {
        const result = document.evaluate(selector, root, null, 0, null)
        const elements = []

        let value = result.iterateNext()
        while (value) {
            elements.push(value)
            value = result.iterateNext()
        }

        return elements
    }

    /**
     * returns cached HTMLElement
     * @param  {String} uuid  id of cached element
     * @return {HTMLElement}  cached element
     */
    get (uuid) {
        const element = this.elements.filter((e) => e.uuid === uuid)[0]
        return element ? element.element : undefined
    }
}
