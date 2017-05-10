const COLUMN_CLASS_MAP = {}

export function registerColumn(type, klass) {
  COLUMN_CLASS_MAP[type] = klass
}

export function getColumnClassForType(type) {
  require('assert')(COLUMN_CLASS_MAP[type])
  return COLUMN_CLASS_MAP[type]
}

// load all columns
const context = require.context('./', false, /.+Column.es6$/)
context.keys().map(context)
