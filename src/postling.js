/**
 * # Postling
 *
 * RPC interface to invoke messages inside an iframe.
 */

import { parseUrl, getId } from './utilities'

const REQUEST = 'REQUEST'
const RESPONSE = 'RESPONSE'

const defaultConfig = {
  // connect
  source: window,
  target: window.parent,
  origin: document.referrer.length ? document.referrer : '*'
}

const internals = {
  /**
   * Creates proxy functions which call the original in the iframe.
   *
   * @param {Array.<string>} names - list of available method names
   */
  __setMethods__ (names) {
    const methods = names.reduce((methods, name) => {
      methods[name] = (...args) => this.sendMessage(REQUEST, getId(), { name, args })
      return methods
    }, Object.create(null))
    this.methods = methods
  },
  /**
   * Invoke an update to retrieve available method names.
   *
   * @return {Promise} - list of method names
   */
  __getMethods__ () {
    return this.setMethods(this.methods).then(() => Object.keys(this.methods))
  }
}

export default class Postling {
  /**
   * Define options of the instance
   *
   * @param  {HTMLElement|Object} customConfig - options of the instance
   */
  constructor (customConfig) {

    if (customConfig && customConfig.tagName === 'IFRAME') {
      const { protocol, host } = parseUrl(customConfig.getAttribute('src'))
      customConfig = {
        target: customConfig.contentWindow,
        origin: `${protocol}//${host}`
      }
    }

    const config = {...defaultConfig}

    if (customConfig) {
      Object.assign(config, customConfig)
    }

    this.config = config

    this.pending = Object.create(null)
    this.methods = Object.create(null)

    config.source.addEventListener('message', this.onMessage)
    // use global handler module is imported --> no racing condidation problme
  }

  /**
   * Remove the event handler of the instance.
   */
  close () {
    const { source } = this.config
    source.removeEventListener('message', this.onMessage)
  }

  /**
   * Invoke handler to set and remove methods.
   */
  setMethods (methods) {
    this.methods = {...this.methods,...methods}
    Object.keys(this.methods).forEach((name) => {
      if (!this.methods[name]) {
        delete this.methods.name
      }
    })
    return this.sendMessage(REQUEST, getId(), {
      name: '__setMethods__',
      args: [Object.keys(this.methods)]
    })
  }

  /**
   * Invoke remote handler to retrieve the available methods.
   */
  getMethods () {
    return this.sendMessage(REQUEST, getId(), {
      name: '__getMethods__'
    })
  }

  /**
   * Create an action which will be send over the connection.
   *
   * @param  {string}  type    - marker to specify outgoing and incoming message
   * @param  {string}  id      - id to match the response
   * @param  {*}       payload - data to send
   * @return {Promise}         - response of the call
   */
  sendMessage (type, id, payload) {
    return new Promise((resolve, reject) => {
      const { target, origin } = this.config
      if (type === REQUEST) {
        this.pending[id] = (error, response) => {
          delete this.pending[id]
          if (error) {
            return reject(error)
          }
          resolve(response)
        }
      }
      target.postMessage('postling:' + JSON.stringify({ type, id, payload }), origin)
    })
  }

  /**
   * Event handler for postmessages.
   *
   * @param {Object} message - contains the payload data of the postmessage
   */
  onMessage = ({ data }) => {
    if (typeof data === 'string' && data.indexOf('postling:') === 0) {

      const { type, id, payload } = JSON.parse(data.replace('postling:', ''))

      if (type === RESPONSE) {
        return this.pending[id](payload.error, payload.result)
      }

      const { name, args } = payload

      if (!name) {
        return console.error(`Invalid call - method name required!`)
      }

      const method = (/^__.*__$/.test(name)) ? internals[name].bind(this) : this.methods[name]

      if (!method) {
        return console.error(`Invalid method call: "${name}" !`)
      }

      Promise.resolve(method.apply(null, args))
      .then((result) => this.sendMessage(RESPONSE, id, { result }))
      .catch((error) => this.sendMessage(RESPONSE, id, { error: {...error} }))
    }
  }
}
