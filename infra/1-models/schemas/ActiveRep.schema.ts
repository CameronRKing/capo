export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'ActiveRep',
  description: 'The active reps in play and the decisions related to them.',
  type: 'object',
  version: 0,
  primaryKey: {
      key: 'id',
      fields: [
            'companyId', 
            'quarter',
            'repId'
      ],
      separator: '_'
  },
  required: ['companyId', 'quarter', 'repId'],
  properties: {
    id: {
        type: 'string',
        maxLength: 100
    },
    companyId: {
        type: 'string',
        ref: 'companies'
    },
    quarter: {
        type: 'number'
    },
    repId: {
        type: 'string',
        ref: 'rep_resumes'
    },
    willLetGo: {
        type: 'boolean',
        default: false
    },
    individualHours: {
        type: 'number',
        default: 0
    },
    leadershipBehavior: {
        type: 'string',
        enum: [
            'Positive Verbal Feedback (Praise)',
            'Negative Verbal Feedback (Punishment)',
            'Clarifying Rules and Policies',
            'Setting Future Goals',
            'Providing Individualized Support'
        ],
        default: 'Negative Verbal Feedback (Punishment)'
    },
    territories: {
        type: 'array',
        items: {
            type: 'number'
        },
        uniqueItems: true,
        default: []
    }
  }
} as const;