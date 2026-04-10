import { assign, createMachine } from 'xstate'

type ScreenContext<T> = {
  data: T | null
  error: string | null
}

type ScreenEvents<T> =
  | { type: 'START' }
  | { type: 'RESOLVE'; data: T }
  | { type: 'REJECT'; error: string }
  | { type: 'RESET' }

export const createScreenLoadMachine = <T>() =>
  createMachine({
    types: {} as {
      context: ScreenContext<T>
      events: ScreenEvents<T>
    },
    id: 'screenLoad',
    initial: 'idle',
    context: {
      data: null,
      error: null
    },
    states: {
      idle: {
        on: {
          START: {
            target: 'loading',
            actions: assign({
              error: () => null
            })
          }
        }
      },
      loading: {
        on: {
          RESOLVE: {
            target: 'ready',
            actions: assign({
              data: ({ event }) => event.data,
              error: () => null
            })
          },
          REJECT: {
            target: 'failure',
            actions: assign({
              error: ({ event }) => event.error
            })
          }
        }
      },
      ready: {
        on: {
          START: {
            target: 'loading',
            actions: assign({
              error: () => null
            })
          },
          RESET: {
            target: 'idle',
            actions: assign({
              data: () => null,
              error: () => null
            })
          }
        }
      },
      failure: {
        on: {
          START: {
            target: 'loading',
            actions: assign({
              error: () => null
            })
          },
          RESET: {
            target: 'idle',
            actions: assign({
              data: () => null,
              error: () => null
            })
          }
        }
      }
    }
  })

export const modalMachine = createMachine({
  types: {} as {
    events: { type: 'OPEN' } | { type: 'CLOSE' }
  },
  id: 'modal',
  initial: 'closed',
  states: {
    closed: {
      on: {
        OPEN: 'opened'
      }
    },
    opened: {
      on: {
        CLOSE: 'closed'
      }
    }
  }
})

type AsyncActionContext = {
  error: string | null
}

type AsyncActionEvents =
  | { type: 'SUBMIT' }
  | { type: 'RESOLVE' }
  | { type: 'REJECT'; error: string }
  | { type: 'RESET' }

export const asyncActionMachine = createMachine({
  types: {} as {
    context: AsyncActionContext
    events: AsyncActionEvents
  },
  id: 'asyncAction',
  initial: 'idle',
  context: {
    error: null
  },
  states: {
    idle: {
      on: {
        SUBMIT: {
          target: 'submitting',
          actions: assign({
            error: () => null
          })
        }
      }
    },
    submitting: {
      on: {
        RESOLVE: 'success',
        REJECT: {
          target: 'failure',
          actions: assign({
            error: ({ event }) => event.error
          })
        }
      }
    },
    success: {
      on: {
        RESET: {
          target: 'idle',
          actions: assign({
            error: () => null
          })
        }
      }
    },
    failure: {
      on: {
        SUBMIT: {
          target: 'submitting',
          actions: assign({
            error: () => null
          })
        },
        RESET: {
          target: 'idle',
          actions: assign({
            error: () => null
          })
        }
      }
    }
  }
})
