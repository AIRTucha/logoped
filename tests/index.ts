import { expect } from 'chai'
import log, { Logger, stringifyObject } from "../src/index"
import { stub, SinonStub, assert } from "sinon"


const testLib = (name: string, argPromise: boolean) => {
  describe(name, () => {
    let logger!: Logger & SinonStub

    beforeEach(() => {
      logger = stub()
    })

    it("zero arguments, void", () => {
      class Test {
        @log(logger, argPromise, stringifyObject)
        test() {
        }
      }

      const test = new Test()

      test.test()

      expect(logger.calledOnce).to.be.true
      assert.calledWithExactly(logger, `Test's method test returns undefined`)
    })

    it("single argument, void", () => {
      class Test {
        @log(logger, argPromise, stringifyObject)
        test(a: number) {
        }
      }

      const test = new Test()
      const a = 1

      test.test(a)

      expect(logger.calledTwice).to.be.true
      assert.calledWith(logger, `Test's method test is called with ${a}`)
      assert.calledWith(logger, `Test's method test returns undefined`)
    })

    it("single argument, obj return", () => {
      class Test {
        @log(logger, argPromise, stringifyObject)
        test(a: any) {
          return a
        }
      }

      const test = new Test()
      const a = { "ok": 1 }

      test.test(a)

      expect(logger.calledTwice).to.be.true
      assert.calledWith(logger, `Test's method test is called with ${stringifyObject(a)}`)
      assert.calledWith(logger, `Test's method test returns ${stringifyObject(a)}`)
    })

    it("two argument, number return", () => {
      class Test {
        @log(logger, argPromise, stringifyObject)
        sum(a: number, b: number) {
          return a + b
        }
      }

      const test = new Test()
      const a = 1
      const b = 2
      const result = test.sum(a, b)

      expect(logger.calledTwice).to.be.true
      assert.calledWith(logger, `Test's method sum is called with ${a}, ${b}`)
      assert.calledWith(logger, `Test's method sum returns ${result}`)
    })

    it("two argument, Promise of number return", async () => {
      class Test {
        @log(logger, argPromise, stringifyObject)
        sum(a: number, b: number) {
          return Promise.resolve(a + b)
        }
      }

      const test = new Test()
      const a = 1
      const b = 2
      const result = await test.sum(a, b)

      expect(logger.calledTwice).to.be.true
      assert.calledWith(logger, `Test's method sum is called with ${a}, ${b}`)
      assert.calledWith(logger, `Test's method sum returns Promise of ${result}`)
    })


    it("two argument, one of args is Promise number and Promise of number return", async () => {
      class Test {
        @log(logger, argPromise, stringifyObject)
        async sum(a: number, b: Promise<number>) {
          return Promise.resolve(a + await b)
        }
      }

      const test = new Test()
      const a = 1
      const b = Promise.resolve(2)
      const result = await test.sum(a, b)

      expect(logger.calledTwice).to.be.true
      assert.calledWith(logger,
        `Test's method sum is called with ${a}, ${argPromise ? `Promise of ${await b}` : stringifyObject(b)}`
      )
      assert.calledWith(logger, `Test's method sum returns Promise of ${result}`)
    })
  })
}

describe("Logrange", () => {
  testLib("Promise arguments handling on", true)
  testLib("Promise arguments handling off", false)
})

