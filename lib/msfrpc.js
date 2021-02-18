/**
 * Allow self-signed ssl sertificates.
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

/**
 * Load dependencies.
 */
const URL = require('url');
const decamelize = require('decamelize');
const fetch = require('node-fetch');
const MsgPack5 = require('msgpack5');

/**
 * Instance MsgPack5.
 */
const msgpack = MsgPack5();

/**
 * MsfRpc Class.
 * @constructor constructor(uri, options)
 * @constructor constructor(options)
 */
module.exports = class MsfRpc {

  /**
   * MsfRpc constructor.
   * @param {string|object} uri - Url string with auth credentials, hostname and port.
   * @example 'https://msfUser:myPassword@msfrpchost:55553'
   * @param {object} options - MsfRpc options.
   * @property {string} options.user - MsfRpc username.
   * @property {string} options.pass - MsfRpc password.
   * @property {string} options.host - MsfRpc hostname.
   * @property {number} options.port - MsfRpc port.
   * @property {boolean} options.ssl - MsfRpc ssl - true: use https protocol.
   * @property {string} options.token - MsfRpc token.
   * @return {MsfRpc}
   */
  constructor(uri, options) {
    options = options || {};

    // If uri is an object, it must be options.
    if(typeof uri === 'object') {
      options = uri;
    } else {
      // Parse uri.
      const url = URL.parse(uri);
      const { hostname, port, protocol } = url;
      const [ user, pass ] = (url.auth || '').split(':');

      // Put uri parameters in options.
      options.user = user;
      options.pass = pass;
      options.host = hostname;
      options.port = port;
      options.ssl = protocol === 'https:';
    }

    // Save options to this.
    this.user = options.user;
    this.pass = options.pass;
    this.host = options.host;
    this.port = options.port;
    this.ssl = options.ssl;
    this.token = options.token;

    // Load api methodGroups proxys.
    const methodGroups = [ "auth", "base", "console", "core", "db", "job", "module", "plugin", "session" ];
    methodGroups.forEach((methodGroup) => {
      this[methodGroup] = new Proxy({}, {
        get: (target, methodName) => {
          methodName = decamelize(methodName, '_');
          return (...args) => {
            return this._exec(methodGroup + '.' + methodName, ...args);
          }
        }
      });
    });
  }

  /**
   * Connects to the remote MsfRpc server.
   * This is not required if a token was specified in the constructor options.
   * @return {Promise}
   */
  connect() {
    return this._call("auth.login", this.user, this.pass).then((res) => {
      // Save token to this. 
      this.token = res.token;
    });
  }

  /**
   * Call an MsfRpc method.
   * Take a look at the following links for more information about available methods:
   *   http://www.nothink.org/metasploit/documentation/RemoteAPI_4.1.pdf
   *   https://help.rapid7.com/metasploit/Content/api/rpc/overview.html
   *   https://help.rapid7.com/metasploit/Content/api/rpc/standard-reference.html
   *   https://rapid7.github.io/metasploit-framework/api/Msf/RPC.html
   * @param {string} method - MsfRpc method.
   * @param {...[any]} args - MsfRpc method's arguments.
   * @return {Promise<object>} - MsfRpc call response.
   */
  _call(method, ...args) {
    // Encode method and arguments as msgpack buffer.
    const buffer = msgpack.encode([method, ...args]);

    // Send post request to the MsfRpc server.
    return fetch(`${this.ssl ? 'https' : 'http'}://${this.host}:${this.port}/api/1.0`, {
      method: 'POST',
      body: buffer,
      headers: {
        'content-type': 'binary/message-pack'
      }
    }).then(result => result.buffer()).then(body => {
        // Parse body.
        body = this._parseBody(body)

        // If server responded with an exception, build and throw error.
        if(body.error) {
          const errorLines = [];
          errorLines.push(`${body.error_message}`);
          errorLines.push(`    Backtrace:`);
          body.error_backtrace.forEach((trace) => {
            errorLines.push(`        ${trace}`);
          });
          errorLines.push('');
          throw new Error(errorLines.join('\n'));
        }
        return body
      })
  }

  /**
   * Call a MsfRpc method and include the access token.
   * @param {string} method - MsfRpc method.
   * @param {...[any]} args - MsfRpc method's arguments.
   * @return {Promise<object>} - MsfRpc call response.
   */
  _exec(method, ...args) {
    return this._call(method, this.token, ...args);
  }

  /**
   * Decodes and debufferizes response body.
   * @param {object} body - Response body.
   * @return {object}
   */
  _parseBody(body) {
    const decoded = msgpack.decode(body);
    const debufferized = this._debufferize(decoded);
    return debufferized;
  }

  /**
   * Debufferizes an object.
   * @description
   *   When msgpack5 decodes a buffer, it returns an object.
   *   All object values are buffers.
   *   So this method recursively converts all buffes to strings.
   * @param {any} value - Value to debufferize.
   * @return {any}
   */
  _debufferize(value) {
    if(value instanceof Buffer) {
      return value.toString();
    } else if(value instanceof Array) {
      const arr = [];
      value.forEach((val) => {
        arr.push(this._debufferize(val));
      });
      return arr;
    } else if(value instanceof Array) {
      const arr = [];
      value.forEach((val) => {
        arr.push(this._debufferize(val));
      });
      return arr;
    } else if(value instanceof Object) {
      const obj = {};
      Object.keys(value).forEach((key) => {
        if(value.hasOwnProperty(key)) {
          obj[key] = this._debufferize(value[key]);
        }
      });
      return obj;
    } else {
      return value;
    }
  }
}
