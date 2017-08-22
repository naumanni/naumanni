/* @flow */
import React from 'react'

import {DRAG_SOURCE_COLUMN} from 'src/constants'
import dndMount from './columns/dnd'


type ReactClass = Class<React.Component<*, *, *>>

const COLUMN_CLASS_MAP: {[column_type: string]: ReactClass} = {}
const COLUMN_MAP: {[column_type: string]: ReactClass} = {}

export function registerColumn(type: string, klass: Class<React.Component<*, *, *>>) {
  COLUMN_CLASS_MAP[type] = klass
}

export function getColumnClassForType(type: string): ReactClass {
  if(COLUMN_MAP[type] === undefined) {
    const klass = COLUMN_CLASS_MAP[type]

    if(klass === undefined) {
      console.warn(`Not registered Column:${type} yet...`)
    }

    COLUMN_MAP[type] = dndMount(klass)
  }

  return COLUMN_MAP[type]
}

export function getColumnClasses(): {[string]: ReactClass} {
  return COLUMN_CLASS_MAP
}

// load all columns
require('src/pages/columns/loader')
