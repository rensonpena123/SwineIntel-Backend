import Pen from '../models/Pen.js';

// @desc    Create a new pen (Kural, Paanakan, or Bartolina)
// @route   POST /api/pens
export const createPen = async (req, res, next) => {
  try {
    const { name, type, capacity } = req.body;

    const penExists = await Pen.findOne({ name });
    if (penExists) {
      return res.status(400).json({ message: 'Pen name already exists' });
    }

    const pen = await Pen.create({
      name,
      type,
      capacity, // The model hook handles this if left blank!
    });

    res.status(201).json(pen);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all pens
// @route   GET /api/pens
export const getPens = async (req, res, next) => {
  try {
    const pens = await Pen.find({});
    res.json(pens);
  } catch (error) {
    next(error);
  }
};