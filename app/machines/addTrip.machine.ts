import { createMachine, assign } from 'xstate';

export interface AddTripContext {
  title: string;
  emoji: string;
  country: string;
  startDate: string;
  endDate: string;
  currencyId: number;
  budget: number;
  description: string;
  participantPhones: string[];
  creatorId: number;
  errors: Record<string, string>;
  isSubmitting: boolean;
}

export type AddTripEvent =
  | { type: 'SET_FIELD'; field: string; value: any }
  | { type: 'ADD_PHONE'; phone: string }
  | { type: 'REMOVE_PHONE'; phone: string }
  | { type: 'SUBMIT' }
  | { type: 'CANCEL' }
  | { type: 'RESET' }
  | { type: 'SET_CREATOR'; creatorId: number };

export const validateForm = (ctx: AddTripContext) => {
  const errors: Record<string, string> = {};
  if (ctx.title?.trim().length < 3) errors.title = 'Минимум 3 символа';
  if (ctx.country?.trim().length < 2) errors.country = 'Укажите место';
  if (!ctx.startDate) errors.startDate = 'Выберите дату';
  if (!ctx.endDate) errors.endDate = 'Выберите дату';
  if (ctx.startDate && ctx.endDate && new Date(ctx.startDate) > new Date(ctx.endDate)) {
    errors.endDate = 'Не может быть раньше заезда';
  }
  if (ctx.budget < 0) errors.budget = 'Не может быть отрицательным';
  return errors;
};

export const addTripMachine = createMachine({
  id: 'addTrip',
  types: {} as { 
    context: AddTripContext; 
    events: AddTripEvent;
  },
  context: {
    title: '',
    emoji: '🌴',
    country: '',
    startDate: '',
    endDate: '',
    currencyId: 1,
    budget: 0,
    description: '',
    participantPhones: [],
    creatorId: 0,
    errors: {},
    isSubmitting: false
  },
  
  initial: 'idle',
  
  states: {
    idle: {
      on: {
        SET_CREATOR: {
          actions: assign({
            creatorId: ({ event }) => event.type === 'SET_CREATOR' ? event.creatorId : 0
          }),
          target: 'editing'
        }
      }
    },
    
    editing: {
      on: {
        SET_FIELD: {
          actions: assign(({ context, event }) => {
            if (event.type === 'SET_FIELD') {
              return {
                [event.field]: event.value,
                errors: { ...context.errors }
              };
            }
            return {};
          })
        },
        
        SUBMIT: {
          guard: ({ context }) => Object.keys(validateForm(context)).length === 0,
          target: 'submitting',
          actions: assign({ errors: () => ({}) })
        },
        
        RESET: {
          actions: assign({
            title: () => '',
            emoji: () => '🌴',
            country: () => '',
            startDate: () => '',
            endDate: () => '',
            budget: () => 0,
            description: () => '',
            participantPhones: () => [],
            errors: () => ({})
          })
        },
        
        CANCEL: 'idle'
      }
    },
    
    submitting: {
      entry: assign({ isSubmitting: () => true }),
      invoke: {
        src: 'saveTrip',
        onDone: {
          target: 'success',
          actions: assign({ isSubmitting: () => false })
        },
        onError: {
          target: 'editing',
          actions: assign({ 
            isSubmitting: () => false,
            errors: () => ({ submit: 'Ошибка при создании поездки' })
          })
        }
      }
    },
    
    success: {
      type: 'final'
    }
  }
});