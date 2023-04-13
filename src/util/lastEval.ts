export class ObsoleteResolve extends Error {
  constructor(msg?: string) {
    super(msg ?? '')

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, ObsoleteResolve.prototype)
  }
}

export function last<ResultType, ArgTypes extends unknown[]>(
  f: (...args: ArgTypes) => Promise<ResultType>
) {
  let lastEvalToken = Symbol('last eval token')
  return async (...args: ArgTypes) => {
    const currentEvalToken = Symbol('last eval token')
    lastEvalToken = currentEvalToken
    const result = await f(...args)
    if (lastEvalToken === currentEvalToken) {
      return result
    } else {
      throw new ObsoleteResolve()
    }
  }
}
