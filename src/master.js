import { masochism } from './slave'
import { EVENT } from './dom'
import { handlerMap, TEXT } from './h'
const MAIN = typeof window !== 'undefined'
const activeEffectStack = []
const commitQueue = {}
export const targetMap = new WeakMap()
export function render (instance) {
  MAIN ? masochism() : sadism(instance)
}

function sadism (instance) {
  instance.update = effect(() => {
    const oldVnode = instance.subTree || null
    const newVnode = (instance.subTree = instance.tag(instance.props))
    let index = 0
    let commit = diff(0, index, oldVnode, newVnode)
    self.postMessage(commit)
  })
  instance.update()
  self.addEventListener('message', e => {
    const { type, id, event } = e.data
    if (type === EVENT) {
      const fn = handlerMap[id - 1]
      fn && fn(event)
    }
  })
}

function diff (parent, index, oldVnode, newVnode) {
  if (oldVnode === newVnode) {
  } else if (
    oldVnode != null &&
    oldVnode.type === TEXT &&
    newVnode.type === TEXT
  ) {
    if (oldVnode.tag !== newVnode.tag) {
      commitQueue[index] = [index + 1, newVnode.tag]
    }
  } else if (oldVnode == null || oldVnode.tag !== newVnode.tag) {
    commitQueue[index] = [parent, index - 1, newVnode]
    if (oldVnode != null) {
      commitQueue[index] = [parent, index - 1]
    }
  } else {
    let oldChildren = oldVnode.children
    let children = newVnode.children
    commitQueue[index] = [index, oldVnode.props, newVnode.props]
    if (children) {
      for (let i = 0; i < children.length; i++) {
        diff(parent, ++index + i, oldChildren[i], children[i])
      }
    }
  }
  return commitQueue
}

function effect (fn) {
  const effect = function effect (...args) {
    return run(effect, fn, args)
  }
  return effect
}

function run (effect, fn, args) {
  if (activeEffectStack.indexOf(effect) === -1) {
    try {
      activeEffectStack.push(effect)
      return fn(...args)
    } finally {
      activeEffectStack.pop()
    }
  }
}

export function trigger (target, key) {
  let deps = targetMap.get(target)
  const effects = new Set()

  deps.get(key).forEach(e => effects.add(e))
  effects.forEach(e => e())
}

export function track (target, key) {
  const effect = activeEffectStack[activeEffectStack.length - 1]
  if (effect) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }
    let dep = depsMap.get(key)
    if (!dep) {
      depsMap.set(key, (dep = new Set()))
    }
    if (!dep.has(effect)) {
      dep.add(effect)
    }
  }
}
