import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({ html: false, linkify: true, typographer: true })

// Absolute URLs only with http(s) or mailto; relative links stay allowed.
md.validateLink = (url) => {
  const value = url.trim().toLowerCase()
  return !/^[a-z][a-z0-9+.-]*:/.test(value) || /^(https?|mailto):/.test(value)
}

md.renderer.rules.link_open = (tokens, index, options, _env, self) => {
  const token = tokens[index]!
  if (/^https?:/i.test(String(token.attrGet('href') ?? ''))) {
    token.attrSet('target', '_blank')
    token.attrSet('rel', 'noopener noreferrer')
  }
  return self.renderToken(tokens, index, options)
}

/** Renders entry markdown; raw HTML in the source is escaped, unsafe link schemes are dropped. */
export const renderMarkdown = (source: string): string => md.render(source)
