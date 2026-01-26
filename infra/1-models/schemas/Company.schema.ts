export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Company',
  description: 'Identifying information for a given company',
  type: 'object',
  version: 0,
  primaryKey: {
      key: 'id',
      fields: [
            'gameId', 
            'industry',
            'name'
      ],
      separator: '_'
  },
  required: ['gameId', 'industry', 'name'],
  properties: {
    id: {
        type: 'string',
        maxLength: 100
    },
    gameId: {
        type: 'string',
        ref: 'games'
    },
    industry: {
        type: 'string'
    },
    name: {
        type: 'string'
    }
  }
} as const;