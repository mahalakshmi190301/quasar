import matter from 'gray-matter'
import toml from 'toml'

const extEndRE = /\.(js|vue)$/

function getComponentsImport (componentsList) {
  return componentsList.map(c => {
    const parts = c.split('/')
    const file = extEndRE.test(c) === false
      ? `${ c }.vue`
      : c

    return `import ${ parts[ parts.length - 1 ].replace(extEndRE, '') } from '${ file }'\n`
  }).join('')
}

function parseToc (toc) {
  let wasHeader = true // Introduction is auto prepended
  let headerIndex = 1 // Introduction is auto prepended
  let subheaderIndex

  const list = toc.map(entry => {
    if (entry.sub === true) {
      if (wasHeader === true) { subheaderIndex = 1 }
      else { subheaderIndex++ }

      wasHeader = false
    }
    else {
      wasHeader = true
      headerIndex++
    }

    return {
      ...entry,
      title: entry.sub === true
        ? `${ headerIndex }.${ subheaderIndex }. ${ entry.title }`
        : `${ headerIndex }. ${ entry.title }`
    }
  })

  return JSON.stringify(list)
}

export function getVueComponent (data, mdPageContent) {
  return `<template>
  <doc-page
    title="${ data.title }"
    ${ data.desc !== void 0 ? `desc="${ data.desc }"` : '' }
    ${ data.overline !== void 0 ? `overline="${ data.overline }"` : '' }
    ${ data.badge !== void 0 ? `badge="${ data.badge }"` : '' }
    ${ data.heading !== false ? 'heading' : '' }
    ${ data.editLink !== false ? `edit-link="${ data.editLink }"` : '' }
    ${ data.toc.length !== 0 ? ':toc="toc"' : '' }
    ${ data.related !== void 0 ? ':related="related"' : '' }
    ${ data.nav !== void 0 ? ':nav="nav"' : '' }
    ${ data.scope !== void 0 ? ':scope="scope"' : '' }>${ mdPageContent }</doc-page>
</template>
<script setup>
import { copyHeading } from 'assets/page-utils'
${ data.examples !== void 0 ? `
import { provide } from 'vue'
provide('_q_ex', process.env.CLIENT
  ? { name: '${ data.examples }', list: import('examples:${ data.examples }') }
  : { name: '${ data.examples }' })
` : '' }
${ data.components.size !== 0 ? getComponentsImport(Array.from(data.components)) : '' }
${ data.related !== void 0 ? `const related = ${ JSON.stringify(data.related) }` : '' }
${ data.nav !== void 0 ? `const nav = ${ JSON.stringify(data.nav) }` : '' }
${ data.toc.length !== 0 ? `const toc = ${ parseToc(data.toc) }` : '' }
${ data.scope !== void 0 ? `const scope = ${ JSON.stringify(data.scope) }` : '' }
</script>`
}

export function parseFrontMatter (content) {
  return matter(content, {
    excerpt_separator: '<!-- more -->',
    engines: {
      toml: toml.parse.bind(toml),
      excerpt: false
    }
  })
}
