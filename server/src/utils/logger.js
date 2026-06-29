/* Tiny dependency-free logger with levels + timestamps. */
const COLORS = {
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  debug: '\x1b[90m',
  reset: '\x1b[0m',
}

const ts = () => new Date().toISOString()

function log(level, ...args) {
  const color = COLORS[level] || ''
  // eslint-disable-next-line no-console
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
  fn(`${color}[${ts()}] ${level.toUpperCase()}${COLORS.reset}`, ...args)
}

export const logger = {
  info: (...a) => log('info', ...a),
  warn: (...a) => log('warn', ...a),
  error: (...a) => log('error', ...a),
  debug: (...a) => (process.env.NODE_ENV !== 'production' ? log('debug', ...a) : undefined),
  // Morgan stream adapter
  stream: {
    write: (msg) => log('info', msg.trim()),
  },
}

export default logger
