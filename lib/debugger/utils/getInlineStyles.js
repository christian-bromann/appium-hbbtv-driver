/**
 * Helper for CSSStyleDeclarations to easily iterate over their values
 */
window.CSSStyleDeclaration.prototype.toArray = function () {
    const returnValue = []
    for (let i = 0; i < this.length; ++i) {
        const name = this[i]
        returnValue.push({ name, value: this[name] })
    }
    return returnValue
}

/**
 * get inline styles by node
 *
 * @param   {CSSStyleDeclaration} style  style declaration of certain node
 * @return  {CSSStyle[]}                 list of CSS style representations
 */
export default function getInlineStyles (style) {
    return style.toArray().map((style) => {
        const text = `${style.name}: ${style.value}`
        return Object.assign(style, {
            disabled: false,
            implicit: false,
            text,
            range: { startLine: 0, startColumn: 0, endLine: 0, endColumn: text.length }
        })
    })
}
