const marketReport = {
    type: 'boolean',
    default: false
} as const;

const percent = {
    type: 'integer',
    minimum: 1,
    maximum: 100,
    format: 'percentage'
} as const;

export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'LeadershipDecision',
  description: 'A company\'s leadership decisions for a given quarter',
  type: 'object',
  version: 0,
  primaryKey: 'id',
  required: ['id', 'companyId', 'quarter'],
  properties: {
    id: {
      type: 'string',
      description: 'Unique identifier for this decision (format: companyId_quarter)',
      pattern: '^[a-zA-Z0-9_-]+$',
      maxLength: 50
    },
    companyId: {
      type: 'string',
      description: 'ID of the company making this decision'
    },
    quarter: {
      type: 'integer',
      description: 'Quarter number for this decision',
      minimum: 1
    },
    //
    managerTime: {
      type: 'object',
      description: 'Manager time allocation across different areas',
      mustSumTo: 100,
      // doesn't actually do anything; RxDB won't initialize object properties
      // but it is nice for documentation, I suppose
      default: {
        recruiting: 25,
        meetingWithCustomers: 25,
        salesPlanning: 25,
        individualSessions: 25
      },
      properties: {
        recruiting: {
          description: 'Attracting new sales reps',
          ...percent
        },
        meetingWithCustomers: {
          description: 'Direct conversations with customers',
          ...percent
        },
        salesPlanning: {
          description: 'Planning the work ahead',
          ...percent
        },
        individualSessions: {
          description: 'One-on-one time with your current sales team',
          ...percent
        }
      }
    },
    //
    buyTerritoryReport: marketReport,
    buyCompensationReport: marketReport,
    buyPerformanceReport: marketReport,
  }
} as const;
