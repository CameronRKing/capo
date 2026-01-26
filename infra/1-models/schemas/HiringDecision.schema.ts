const percent = {
    type: 'integer',
    minimum: 1,
    maximum: 100,
    format: 'percentage'
} as const;


export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'HiringDecision',
  description: 'A company\'s hiring decision for a given quarter',
  type: 'object',
  version: 0,
  primaryKey: 'id',
  required: ['id', 'companyId', 'quarter', 'salary', 'commission', 'benefits'],
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
    salary: {
      type: 'integer',
      description: 'Yearly salary in USD',
      minimum: 0,
      default: 50000,
      format: 'currency'
    },
    commission: {
      type: 'integer',
      description: 'Commission rate as a whole-number percentage',
      minimum: 0,
      maximum: 100,
      default: 5,
      format: 'percentage'
    },
    benefits: {
      type: 'string',
      description: 'Benefits package option',
      enum: ['bronze', 'silver', 'gold'],
      default: 'bronze'
    },
    travel: {
      type: 'string',
      description: 'Expense package option',
      enum: ['reps_pay_own', 'monthly_per_diem', 'unlimited'],
      default: 'reps_pay_own'
    },
    perDiem: {
      type: 'integer',
      description: 'Monthly per diem amount in USD (when travel package is monthly_per_diem)',
      minimum: 0,
      default: 0,
      format: 'currency'
    },
    hasSalesContest: {
      type: 'boolean',
      description: 'Whether to have a sales contest',
      default: false
    },
    salesContestType: {
      type: 'string',
      description: 'Type of sales contest (open or closed)',
      enum: ['open', 'closed'],
      default: 'closed'
    },
    salesContestThreshold: {
      type: 'integer',
      description: 'Winning threshold (number of winners for closed contest, sales quota for open contest)',
      minimum: 0,
      default: 0,
      format: 'currency'
    },
    trainingTime: {
      type: 'object',
      description: 'Training time allocation across different areas',
      mustSumTo: 100,
      default: {
        productKnowledge: 25,
        marketIndustryOrientation: 25,
        companyOrientation: 25,
        sellingTechniques: 25
      },
      properties: {
        productKnowledge: {
          description: 'Product Knowledge training time allocation as percentage',
          ...percent
        },
        marketIndustryOrientation: {
          description: 'Market-Industry Orientation training time allocation as percentage',
          ...percent
        },
        companyOrientation: {
          description: 'Company Orientation training time allocation as percentage',
          ...percent
        },
        sellingTechniques: {
          description: 'Selling Techniques training time allocation as percentage',
          ...percent
        }
      }
    },
    numberToHire: {
      type: 'integer',
      description: 'Number of account managers to hire',
      minimum: 0,
      maximum: 3,
      default: 1
    }
  }
} as const;
