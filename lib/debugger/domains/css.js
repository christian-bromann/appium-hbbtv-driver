import Node from '../models/Node'
import getInlineStyles from '../utils/getInlineStyles'

let enabled = false
const name = 'CSS'

window.CSSRuleList.prototype.toArray = function (iterator) {
    const returnValue = []
    for (let i = 0; i < this.length; ++i) {
        returnValue.push(this[i])
    }
    return returnValue
}

/**
 * Returns the computed style for a DOM node identified by nodeId.
 *
 * @param {NodeId} nodeId                   Id of the element to get computed styles from
 * @return {[CSSComputedStyleProperty]}     Computed style for the specified DOM node.
 */
export function getComputedStyleForNode ({ nodeId }) {
    const root = Node.getNode(nodeId)

    if (!root) {
        throw new Error(`Couldn't find node with nodeId ${nodeId}`)
    }

    const computedStyle = []
    const computedStyleOrig = window.getComputedStyle(root.node)
    for (let i = 0; i < computedStyleOrig.length; ++i) {
        computedStyle.push({
            name: computedStyleOrig[i],
            value: computedStyleOrig[computedStyleOrig[i]]
        })
    }

    return { computedStyle }
}

/**
 * Requests information about platform fonts which we used to render child TextNodes in the given node.
 */
export function getPlatformFontsForNode ({ nodeId }) {
    /**
     * this is not traceable therefor return always a standard font
     */
    return {
        familyName: 'Arial',
        isCustomFont: false,
        glyphCount: 0
    }
}

/**
 * Returns requested styles for a DOM node identified by nodeId.
 *
 * @param  {nodeId} nodeId  desired node id
 */
export function getMatchedStylesForNode ({ nodeId }) {
    const { node } = Node.getNode(nodeId)
    const ruleList = window.getMatchedCSSRules(node)

    const matchedCSSRules = ruleList.toArray().map((rule) => ({
        matchingSelectors: [0],
        rule: {
            media: [],
            origin: 'user-agent',
            selectorList: {
                selectors: [{ text: 'script' }],
                text: 'script'
            },
            style: {
                cssProperties: getInlineStyles(rule.style)
            }
        }
    }))

    return {
        matchedCSSRules,
        cssKeyframesRules: [],
        pseudoElements: [],
        inherited: [],
        inlineStyle: getInlineStylesForNode({ nodeId }).inlineStyle
    }
}

/**
 * Returns the styles defined inline (explicitly in the "style" attribute and implicitly, using
 * DOM attributes) for a DOM node identified by nodeId.
 *
 * @param  {nodeId} nodeId  desired node id
 */
export function getInlineStylesForNode ({ nodeId }) {
    const { node } = Node.getNode(nodeId)
    const cssText = node.getAttribute('style')

    return {
        inlineStyle: {
            cssProperties: getInlineStyles(node.style),
            cssText,
            range: { startLine: 0, startColumn: 0, endLine: 0, endColumn: cssText.length },
            shorthandEntries: [],
            styleSheetId: '1' // ToDo: connect to stylesheet file
        }
    }
}

export { name, enabled }
