/**
 * Is Element Selected
 * determines if the referenced element is selected or not. This operation only makes sense on
 * input elements of the Checkbox- and Radio Button states, or option elements.
 *
 * @param  {String} sessionId sessionId
 * @param  {String} elementId web element id
 * @see https://www.w3.org/TR/webdriver/#is-element-selected
 */
export function isElementSelected ({ sessionId, elementId }) {
    const elem = this.elementHandler.get(elementId)

    /**
     * element is an input element with a type attribute in the Checkbox- or Radio Button state
     *  -> The result of element’s checkedness.
     */
    if (elem.tagName === 'input' && elem.type.match(/(checkbox|radio)/i)) {
        return this.respond('isElementSelected', elem.checked)
    }

    /**
     * element is an option element
     *  -> The result of element’s selectedness.
     */
    if (elem.tagName.toLowerCase === 'option') {
        return this.respond('isElementSelected', elem.selected)
    }

    /**
     * Otherwise
     *  -> False.
     */
    return this.respond('isElementSelected', false)
}

/**
 * Get Element Attribute
 * The Get Element Attribute command will return the attribute of a web element.
 *
 * @param  {String} sessionId sessionId
 * @param  {String} elementId web element id
 * @param  {String} attributeName name of element attribute
 * @see https://www.w3.org/TR/webdriver/#get-element-attribute
 */
export function getElementAttribute ({ sessionId, elementId, attributeName }) {
    const elem = this.elementHandler.get(elementId)
    const attribute = elem.getAttribute(attributeName)

    /**
     * If name is a boolean attribute (if the attribute is present, its value must
     * either be the empty string or a value that is an ASCII case-insensitive match
     * for the attribute's canonical name, with no leading or trailing whitespace.)
     *  -> "true" (string) if the element has the attribute, otherwise null.
     */
    if (attribute === '' || attribute === attributeName) {
        return this.respond('getElementAttribute', true)
    }

    /**
     * Otherwise
     *  -> The result of getting an attribute by name name.
     */
    return this.respond('getElementAttribute', attribute)
}

/**
 * Get Element Property
 * The Get Element Property command will return the result of getting a property of an element.
 *
 * @param  {String} sessionId sessionId
 * @param  {String} elementId web element id
 * @param  {String} propertyName name of element property
 * @see https://www.w3.org/TR/webdriver/#get-element-property
 */
export function getElementProperty ({ sessionId, elementId, propertyName }) {
    const elem = this.elementHandler.get(elementId)

    /**
     * Let result be the value of property if not undefined, or null.
     */
    return this.respond('getElementProperty', elem[propertyName] || null)
}

/**
 * Get Element CSS Value
 * The Get Element CSS Value command retrieves the computed value of the given CSS property
 * of the given web element.
 *
 * @param  {String} sessionId sessionId
 * @param  {String} elementId web element id
 * @param  {String} propertyName name of element property
 * @see https://www.w3.org/TR/webdriver/#get-element-css-value
 */
export function getElementCSSValue ({ sessionId, elementId, propertyName }) {
    const elem = this.elementHandler.get(elementId)

    /**
     * Let computed value be the computed value of parameter property name from element’s
     * style declarations if the current browsing context’s document type is not "xml",
     * else let it be "".
     */
    return this.respond('getElementCSSValue', window.getComputedStyle(elem)[propertyName])
}

/**
 * Get Element Text
 * The Get Element Text command intends to return an element’s text “as rendered”.
 * This is equivalent to calling element.innerText. An element’s rendered text is
 * also used for locating a elements by their link text and partial link text.
 *
 * @param  {String} sessionId sessionId
 * @param  {String} elementId web element id
 * @see https://www.w3.org/TR/webdriver/#get-element-text
 */
export function getElementText ({ sessionId, elementId }) {
    const elem = this.elementHandler.get(elementId)

    /**
     * Let rendered text be the result of getting innerText of element.
     */
    return this.respond('getElementText', elem.innerText)
}

/**
 * Get Element Tag Name
 * The Get Element Tag Name command returns the qualified element name of the given
 * web element.
 *
 * @param  {String} sessionId sessionId
 * @param  {String} elementId web element id
 * @see https://www.w3.org/TR/webdriver/#get-element-tag-name
 */
export function getElementTagName ({ elementId }) {
    const elem = this.elementHandler.get(elementId)

    /**
     * Let qualified name be the result of getting element’s tagName content attribute.
     */
    return this.respond('getElementTagName', elem.tagName)
}

/**
 * Get Element Rect
 * The Get Element Rect command returns the dimensions and coordinates of the given
 * web element.
 *
 * @param  {String} sessionId sessionId
 * @param  {String} elementId web element id
 * @see https://www.w3.org/TR/webdriver/#get-element-rect
 */
export function getElementRect ({ sessionId, elementId }) {
    const elem = this.elementHandler.get(elementId)

    /**
     * Let rect be element’s bounding rectangle.
     */
    const rect = elem.getBoundingClientRect()

    /**
     * The returned value is a dictionary with the following members:
     */
    this.respond('getElementRect', {
        /**
         * X axis position of the top-left corner of the web element relative to
         * the current browsing context’s document element in CSS reference pixels.
         * @type {Number}
         */
        x: rect.left,
        /**
         * Y axis position of the top-left corner of the web element relative to
         * the current browsing context’s document element in CSS reference pixels.
         * @type {Number}
         */
        y: rect.top,
        /**
         * Height of the web element’s bounding rectangle in CSS reference pixels.
         * @type {Number}
         */
        width: rect.width,
        /**
         * Width of the web element’s bounding rectangle in CSS reference pixels.
         * @type {Number}
         */
        height: rect.height
    })
}

/**
 * Is Element Enabled
 * Is Element Enabled determines if the referenced element is enabled or not. This
 * operation only makes sense on form controls.
 *
 * @see https://www.w3.org/TR/webdriver/#is-element-enabled
 */
export function isElementEnabled () {
    // ToDo figure out what form controls are
    this.respond('isElementEnabled', true)
}
