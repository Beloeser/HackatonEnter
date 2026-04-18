import mongoose from 'mongoose'

const recommendationSchema = new mongoose.Schema(
  {
    decision: { type: String, trim: true },
    suggestedValue: { type: Number },
    confidence: { type: Number },
    reasoning: { type: String, trim: true },
    status: {
      type: String,
      trim: true,
      default: 'preliminar',
    },
    generatedAt: { type: Date },
    disclaimer: { type: String, trim: true },
  },
  { _id: false }
)

const resultSchema = new mongoose.Schema(
  {
    decisionTaken: { type: String, trim: true },
    status: {
      type: String,
      trim: true,
      default: 'pendente',
    },
    finalValue: { type: Number },
    outcome: { type: String, trim: true },
    effective: { type: Boolean },
    justification: { type: String, trim: true },
    publishedAt: { type: Date },
  },
  { _id: false }
)

const metadataEntrySchema = new mongoose.Schema(
  {
    source: { type: String, trim: true, default: 'nao_informado' },
    updatedAt: { type: Date },
  },
  { _id: false }
)

const confidenceByBlockSchema = new mongoose.Schema(
  {
    subjectClassification: { type: Number, default: 0.5 },
    financialEstimate: { type: Number, default: 0.5 },
    judicialPhase: { type: Number, default: 0.5 },
    suggestedThesis: { type: Number, default: 0.5 },
  },
  { _id: false }
)

const financialEstimateSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true },
    estimatedValue: { type: Number, default: 0 },
    uncertaintyMin: { type: Number, default: 0 },
    uncertaintyMax: { type: Number, default: 0 },
    calculationBase: { type: String, trim: true },
    methodology: { type: String, trim: true },
    documentsUsed: [{ type: String, trim: true }],
  },
  { _id: false }
)

const consistencyIssueSchema = new mongoose.Schema(
  {
    code: { type: String, trim: true },
    severity: { type: String, trim: true, default: 'warning' },
    message: { type: String, trim: true },
  },
  { _id: false }
)

const decisionTrailSchema = new mongoose.Schema(
  {
    type: { type: String, trim: true },
    actor: { type: String, trim: true },
    reason: { type: String, trim: true },
    recommendationDecision: { type: String, trim: true },
    recommendationConfidence: { type: Number },
    lawyerDecision: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
)

const actionContextSchema = new mongoose.Schema(
  {
    contractReference: { type: String, trim: true },
    contractedRate: { type: Number },
    marketRate: { type: Number },
    hasCapitalization: { type: Boolean },
    mainClaim: { type: String, trim: true },
    urgencyReliefRequested: { type: Boolean },
    causeValueCriteria: { type: String, trim: true },
  },
  { _id: false }
)

const caseSchema = new mongoose.Schema(
  {
    processNumber: {
      type: String, 
      required: true,
      unique: true,
      trim: true
    },
    uf: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    subSubject: {
      type: String,
      trim: true
    },
    macroResult: {
      type: String,
      trim: true
    },
    microResult: {
      type: String,
      trim: true
    },
    claimValue: {
      type: Number,
      default: 0
    },
    condemnationValue: {
      type: Number,
      default: 0
    },
    assignedLawyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      default: 'em_analise',
      trim: true
    },
    judicialStatus: {
      type: String,
      default: 'nao_confirmado',
      trim: true,
    },
    judicialPhase: {
      type: String,
      default: 'fase processual nao confirmada',
      trim: true,
    },
    internalStatus: {
      type: String,
      default: 'em_analise',
      trim: true,
    },
    actionClass: {
      type: String,
      trim: true,
      default: 'geral',
    },
    clientRole: {
      type: String,
      trim: true,
      default: 'autor',
    },
    suggestedThesis: {
      type: String,
      trim: true,
      default: '',
    },
    actionContext: {
      type: actionContextSchema,
      default: {},
    },
    recommendation: {
      type: recommendationSchema,
      default: {}
    },
    result: {
      type: resultSchema,
      default: {}
    },
    financialEstimate: {
      type: financialEstimateSchema,
      default: {},
    },
    consistencyIssues: {
      type: [consistencyIssueSchema],
      default: [],
    },
    terminologyAlerts: {
      type: [String],
      default: [],
    },
    decisionTrail: {
      type: [decisionTrailSchema],
      default: [],
    },
    metadata: {
      type: new mongoose.Schema(
        {
          origins: {
            judicialPhase: { type: metadataEntrySchema, default: {} },
            internalStatus: { type: metadataEntrySchema, default: {} },
            recommendation: { type: metadataEntrySchema, default: {} },
            lawyerDecision: { type: metadataEntrySchema, default: {} },
            financialEstimate: { type: metadataEntrySchema, default: {} },
          },
          confidenceByBlock: {
            type: confidenceByBlockSchema,
            default: {},
          },
        },
        { _id: false }
      ),
      default: {},
    },
  },
  {
    timestamps: true
  }
)

const Case = mongoose.model('Case', caseSchema)
export default Case
