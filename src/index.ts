export type Logger = (...v: any) => void
export type Stringify = (input: any) => string

export const stringifyObject = (input: any): string => {
  let changed: string
  if (input && typeof input !== 'object') {
    changed = input.toString()
  } else {
    try {
      changed = JSON.stringify(input)
    } catch (err) {
      changed = 'Error while parsing...'
    }
  }
  return changed
}

const composeReportForReturn = (stringify: Stringify) => (promiseOrValue: any) => {
  if (promiseOrValue instanceof Promise) {
    return promiseOrValue
      .then(value => `Promise of ${stringify(value)}`)
  } else {
    return stringify(promiseOrValue)
  }
}

export default function logrange(logger: Logger, argPromise: boolean = false, stringify = stringifyObject) {
  const handlerPromiseArgs = function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    const prefix = `${target.constructor.name}'s method ${propertyKey}`

    descriptor.value = function () {
      const result = method(...arguments)

      if (arguments.length > 0) {
        const args = Array.from(arguments)

        if (args.findIndex(arg => arg instanceof Promise) > -1) {
          return Promise.all(
            args.map(composeReportForReturn(stringify))
          )
            .then(msgs => logger(`${prefix} is called with ${msgs.join(", ")}`))
            .then(_ => {
              const returnPrefix = `${prefix} returns`

              if (result instanceof Promise) {
                return result.then(value => {
                  logger(`${returnPrefix} Promise of ${stringify(value)}`)
                  return value
                })
              } else {
                logger(`${returnPrefix} ${stringify(result)}`)
                return result
              }
            })
        } else {
          const returnPrefix = `${prefix} returns`

          const args = Array.from(arguments).map(stringify)
          logger(`${prefix} is called with ${args.join(", ")}`)

          if (result instanceof Promise) {
            return result.then(value => {
              logger(`${returnPrefix} Promise of ${stringify(value)}`)
              return value
            })
          } else {
            logger(`${returnPrefix} ${stringify(result)}`)
            return result
          }
        }
      } else {
        const returnPrefix = `${prefix} returns`

        if (result instanceof Promise) {
          return result.then(value => {
            logger(`${returnPrefix} Promise of ${stringifyObject(value)}`)
            return value
          })
        } else {
          logger(`${returnPrefix} ${stringifyObject(result)}`)
          return result
        }
      }
    }
  }
  const notHandlerPromiseArgs = function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    const prefix = `${target.constructor.name}'s method ${propertyKey}`

    descriptor.value = function () {
      const result = method(...arguments)
      const returnPrefix = `${prefix} returns`

      if (arguments.length > 0) {
        const args = Array.from(arguments).map(stringify)
        logger(`${prefix} is called with ${args.join(", ")}`)
      }

      if (result instanceof Promise) {
        return result.then(value => {
          logger(`${returnPrefix} Promise of ${stringify(value)}`)
          return value
        })
      } else {
        logger(`${returnPrefix} ${stringify(result)}`)
        return result
      }
    }
  }

  return argPromise ? handlerPromiseArgs : notHandlerPromiseArgs
}