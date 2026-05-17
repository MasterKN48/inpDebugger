/**
 * ⚡ INP Debugger Custom Pino Logger
 * High-performance, zero-dependency, Pino-compatible logger
 * Supports production JSON formatting, terminal color-coded pretty printing, and dynamic log levels.
 */

const LEVELS = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60
};

const LEVEL_COLORS = {
  trace: '\x1b[90m', // Gray
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
  fatal: '\x1b[35m'  // Magenta
};

const RESET_COLOR = '\x1b[0m';
const BOLD = '\x1b[1m';

class PinoLogger {
  constructor(options = {}) {
    const defaultLevel = process.env.LOG_LEVEL || 'info';
    this.level = options.level || defaultLevel;
    
    // Automatically enable pretty printing unless in production or explicitly disabled
    this.pretty = options.pretty !== false && process.env.NODE_ENV !== 'production';
    
    this.levelValue = LEVELS[this.level] || 30;
  }

  _log(levelName, obj, msg, ...args) {
    const targetLevelValue = LEVELS[levelName];
    if (targetLevelValue < this.levelValue) return;

    let meta = null;
    let message = msg;

    if (typeof obj === 'object' && obj !== null) {
      meta = obj;
    } else {
      message = obj;
      if (typeof msg === 'string') {
        message = [msg, ...args].join(' ');
      }
    }

    const timestamp = Date.now();
    const isoTime = new Date(timestamp).toISOString();

    if (this.pretty) {
      // 🎨 Pretty terminal print (matches pino-pretty color codes)
      const color = LEVEL_COLORS[levelName] || RESET_COLOR;
      const levelLabel = `${BOLD}${color}${levelName.toUpperCase().padEnd(5)}${RESET_COLOR}`;
      const timeLabel = `\x1b[90m[${isoTime}]\x1b[0m`;
      
      let out = `${timeLabel} ${levelLabel}: ${message || ''}`;
      
      if (meta) {
        if (meta.err || meta.error) {
          const errorObj = meta.err || meta.error;
          out += `\n${RESET_COLOR}${color}${errorObj.stack || errorObj.message || errorObj}${RESET_COLOR}`;
        } else {
          out += ` \x1b[37m${JSON.stringify(meta)}\x1b[0m`;
        }
      }
      console.log(out);
    } else {
      // 🔒 Standard production JSON logging (compatible with elastic/pino aggregators)
      const jsonLog = {
        level: targetLevelValue,
        time: timestamp,
        msg: message,
        pid: process.pid,
        hostname: 'localhost'
      };
      
      if (meta) {
        if (meta.err || meta.error) {
          const errorObj = meta.err || meta.error;
          jsonLog.err = {
            type: errorObj.name || 'Error',
            message: errorObj.message || String(errorObj),
            stack: errorObj.stack
          };
        } else {
          // Flatten standard metadata keys
          Object.assign(jsonLog, meta);
        }
      }
      console.log(JSON.stringify(jsonLog));
    }
  }

  trace(obj, msg, ...args) { this._log('trace', obj, msg, ...args); }
  debug(obj, msg, ...args) { this._log('debug', obj, msg, ...args); }
  info(obj, msg, ...args) { this._log('info', obj, msg, ...args); }
  warn(obj, msg, ...args) { this._log('warn', obj, msg, ...args); }
  error(obj, msg, ...args) { this._log('error', obj, msg, ...args); }
  fatal(obj, msg, ...args) { this._log('fatal', obj, msg, ...args); }
}

// Factory function mimicking Pino
export function pino(options = {}) {
  return new PinoLogger(options);
}

// Export a pre-instantiated default logger
export const logger = new PinoLogger({
  level: process.env.LOG_LEVEL || 'info'
});
