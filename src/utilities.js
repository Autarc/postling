/**
 * # Utilities
 *
 *
 */

/**
 * Simple URL parsing.
 *
 * @param  {string} url - URL to parse
 * @return {Object}     - property map
 */
export function parseUrl (url) {
  var link = document.createElement('a')
  link.setAttribute('href', url)
  return {
    protocol: link.protocol,
    hostname: link.hostname,
    port: link.port,
    pathname: link.pathname,
    search: link.search,
    hash: link.hash,
    host: link.host
  }
}

/**
 * TODO: check if 'https://github.com/broofa/node-uuid' is required
 *
 * @return {[type]} [description]
 */
export function getId () {
  return Math.random().toString(36).substr(2, 10) + Math.random().toString(36).substr(2, 10)
}
