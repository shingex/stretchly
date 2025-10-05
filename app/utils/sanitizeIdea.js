import createDOMPurify from 'dompurify'

const DOMPurify = createDOMPurify(window)
const allowedTags = ['a', 'b', 'i']
const allowedAttributes = ['href']
const allowedUriRegexp = /^(?:(?:https?|mailto):)/i

const sanitizeIdea = (value) => {
  if (typeof value !== 'string' || value.length === 0) {
    return ''
  }
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttributes,
    ALLOWED_URI_REGEXP: allowedUriRegexp,
    RETURN_TRUSTED_TYPE: false
  })
}

export default sanitizeIdea
