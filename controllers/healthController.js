import HealthLog from '../models/HealthLog.js';
import Pig from '../models/Pig.js';
import Pen from '../models/Pen.js';

// @desc    Log a medical treatment (Individual Pig or Batch/Pen)
// @route   POST /api/health
export const logTreatment = async (req, res, next) => {
  try {
    const { targetType, pigId, penId, logType, treatmentName, dosage, remarks } = req.body;

    if (!targetType || !logType || !treatmentName || !remarks) {
      return res.status(400).json({ message: 'Please provide all required health fields' });
    }

    // Validation checks based on target
    if (targetType === 'Pig' && !pigId) {
      return res.status(400).json({ message: 'Individual pig ID required for this target type' });
    }
    if (targetType === 'Pen' && !penId) {
      return res.status(400).json({ message: 'Physical Pen ID required for batch vaccination logs' });
    }

    const newLog = await HealthLog.create({
      targetType,
      pigId: targetType === 'Pig' ? pigId : null,
      penId: targetType === 'Pen' ? penId : null,
      logType,
      treatmentName,
      dosage,
      remarks,
      administeredBy: req.user._id // Pulled directly from auth middleware protection
    });

    res.status(201).json({ message: 'Medical entry successfully recorded', log: newLog });
  } catch (error) {
    next(error);
  }
};

// @desc    Get medical history filtered by a specific Pig or a specific Pen
// @route   GET /api/health
export const getHealthHistory = async (req, res, next) => {
  try {
    const { pigId, penId } = req.query;
    let filter = {};

    if (pigId) filter.pigId = pigId;
    if (penId) filter.penId = penId;

    const history = await HealthLog.find(filter)
      .populate('administeredBy', 'name')
      .sort({ createdAt: -1 }); // Newest logs first

    res.json(history);
  } catch (error) {
    next(error);
  }
};

