import mongoose from 'mongoose'

const { Schema, model } = mongoose

const adminActivitySchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    actorName: { type: String, default: '' },
    actorRole: { type: String, default: '' },
    action: { type: String, required: true }, // e.g. 'product.update'
    method: { type: String, default: '' },
    path: { type: String, default: '' },
    entity: { type: String, default: '' },
    entityId: { type: String, default: '' },
    statusCode: { type: Number, default: 0 },
    ip: { type: String, default: '' },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
)

adminActivitySchema.index({ createdAt: -1 })

export const AdminActivity = model('AdminActivity', adminActivitySchema)
export default AdminActivity
