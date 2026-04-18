import mongoose from 'mongoose'

const recommendationSchema = new mongoose.Schema(
  {
    decision: { type: String, trim: true },
    suggestedValue: { type: Number },
    confidence: { type: Number },
    reasoning: { type: String, trim: true }
  },
  { _id: false }
)

const resultSchema = new mongoose.Schema(
  {
    decisionTaken: { type: String, trim: true },
    finalValue: { type: Number },
    outcome: { type: String, trim: true },
    effective: { type: Boolean }
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
    recommendation: {
      type: recommendationSchema,
      default: {}
    },
    result: {
      type: resultSchema,
      default: {}
    }
  },
  {
    timestamps: true
  }
)

const Case = mongoose.model('Case', caseSchema)
export default Case
