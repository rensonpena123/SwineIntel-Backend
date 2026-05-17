import mongoose from 'mongoose';

const healthLogSchema = new mongoose.Schema({
  targetType: {
    type: String,
    required: true,
    enum: ['Pig', 'Pen']
  },
  pigId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pig',
    default: null
  },
  penId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pen',
    default: null
  },
  logType: {
    type: String,
    required: true,
    enum: ['Vaccine', 'Medication', 'Supplement', 'Sickness Incident']
  },
  treatmentName: {
    type: String,
    required: true // e.g., "Iron Shot", "Parvovirus Vaccine", or "Symptom Log"
  },
  dosage: {
    type: String,
    default: 'N/A'
  },
  remarks: {
    type: String,
    required: true // Description of the symptoms or notes for the owner
  },
  administeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

const HealthLog = mongoose.model('HealthLog', healthLogSchema);
export default HealthLog;