export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Game',
  description: 'A simulation game instance',
  type: 'object',
  version: 0,
  primaryKey: 'id',
  required: ['id', 'name', 'currentQuarter', 'length'],
  properties: {
    id: {
        type: 'string',
        maxLength: 100
    },
    name: {
        type: 'string',
        maxLength: 100,
        description: 'A display name for your game (this is seen by students)',
    },
    currentQuarter: {
        type: 'integer'
    },
    currentRound: {
        type: 'string',
        enum: ['Hiring', 'Leadership'],
        description: 'The current set of decisions that students are making'
    },
    length: {
      type: 'integer',
      description: 'The number of quarters to play'
    }
  }
} as const;