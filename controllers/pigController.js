import Pig from '../models/Pig.js';
import Pen from '../models/Pen.js';

// @desc    Add a new pig (Sow, Piglet, or Fattener)
// @route   POST /api/pigs
export const addPig = async (req, res) => {
  try {
    const { pigType, tagId, motherId, penId, breed, gender, weight, assignedCaretaker } = req.body;

    // 1. Verify the Pen exists
    const pen = await Pen.findById(penId);
    if (!pen) {
      return res.status(404).json({ message: 'Pen not found' });
    }

    // 2. Check if Pen is at max capacity
    if (pen.currentHeadcount >= pen.capacity) {
      return res.status(400).json({ message: 'This Pen is already full!' });
    }

    // 3. The "Inheritance" Logic:
    // If you didn't provide a caretaker in the request, use the one assigned to the Pen.
    const finalCaretaker = assignedCaretaker || pen.assignedCaretaker;

    // 4. Create the Pig in the database
    const pig = await Pig.create({
      pigType,
      tagId,
      motherId,
      penId,
      breed,
      gender,
      weight,
      assignedCaretaker: finalCaretaker, 
    });

    // 5. Update the Pen's headcount so you know how many pigs are inside
    pen.currentHeadcount += 1;
    await pen.save();

    res.status(201).json(pig);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all pigs (with optional filters for type or pen)
// @route   GET /api/pigs
export const getPigs = async (req, res) => {
  try {
    const { type, penId } = req.query;
    let query = {};

    // Filter by type (Sow, Piglet, Fattener) if provided
    if (type) {
      query.pigType = type;
    }

    // Filter by specific Pen if provided
    if (penId) {
      query.penId = penId;
    }

    const pigs = await Pig.find(query).populate('penId', 'name type');
    res.json(pigs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Record a birth (Farrowing event) and move Mother to Paanakan
// @route   POST /api/pigs/farrow
export const farrowEvent = async (req, res) => {
  try {
    const { motherId, penId, pigletCount, breed, assignedCaretaker } = req.body;

    // 1. Verify the Mother (Inahin) exists
    const mother = await Pig.findById(motherId);
    if (!mother || mother.pigType !== 'Sow') {
      return res.status(404).json({ message: 'Valid Mother Sow not found' });
    }

    // 2. Verify the Paanakan pen exists and is the right type
    const pen = await Pen.findById(penId);
    if (!pen || pen.type !== 'Paanakan') {
      return res.status(400).json({ message: 'Piglets must be placed in a Paanakan pen' });
    }

    // Keep track of the Sow's old location (usually a Bartolina)
    const oldSowPenId = mother.penId;

    // 3. Create the piglets in a loop
    const piglets = [];
    for (let i = 0; i < pigletCount; i++) {
      piglets.push({
        pigType: 'Piglet',
        motherId: mother._id,
        penId: pen._id,
        breed: breed || mother.breed,
        assignedCaretaker: assignedCaretaker || pen.assignedCaretaker,
        status: 'Healthy',
      });
    }

    const createdPiglets = await Pig.insertMany(piglets);

    // 4. Update the Mother's location to the Paanakan
    mother.penId = penId;
    await mother.save();

    // 5. Update Headcounts for both pens
    // Subtract 1 (the Sow) from her old Bartolina
    if (oldSowPenId) {
      await Pen.findByIdAndUpdate(oldSowPenId, { $inc: { currentHeadcount: -1 } });
    }

    // Add the Piglets + 1 (the Sow) to the Paanakan
    await Pen.findByIdAndUpdate(penId, { $inc: { currentHeadcount: (Number(pigletCount) + 1) } });

    res.status(201).json({
      message: `${pigletCount} piglets recorded successfully and Mother moved to ${pen.name}`,
      piglets: createdPiglets
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Promote a specific litter to Fatteners and move the Mother back to Bartolina
// @route   PUT /api/pigs/promote
export const promotePiglets = async (req, res) => {
  try {
    const { motherId, toKuralId, targetBartolinaId } = req.body;

    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    const piglets = await Pig.find({
      motherId,
      pigType: 'Piglet',
      createdAt: { $lte: oneMonthAgo } 
    });

    if (piglets.length === 0) {
      return res.status(400).json({ message: 'No piglets found for this mother that are at least 1 month old.' });
    }

    const mother = await Pig.findById(motherId);
    const kural = await Pen.findById(toKuralId);
    const bartolina = await Pen.findById(targetBartolinaId);
    
    // CAPTURE LOCATIONS: Get exact current locations from the database
    const paanakanId = piglets[0].penId; 
    const sowOldPenId = mother.penId;

    if (!mother || !kural || !bartolina) {
      return res.status(404).json({ message: 'Missing record: Mother, Kural, or Bartolina not found' });
    }

    // UPDATE PIGS
    await Pig.updateMany(
      { _id: { $in: piglets.map(p => p._id) } },
      { $set: { pigType: 'Fattener', penId: toKuralId } }
    );
    mother.penId = targetBartolinaId;
    await mother.save();

    // UPDATE HEADCOUNTS INDEPENDENTLY
    // 1. Clear piglets from Paanakan
    await Pen.findByIdAndUpdate(paanakanId, { $inc: { currentHeadcount: -piglets.length } });
    // 2. Clear Sow from her OLD location
    await Pen.findByIdAndUpdate(sowOldPenId, { $inc: { currentHeadcount: -1 } });
    // 3. Add piglets to Kural
    await Pen.findByIdAndUpdate(toKuralId, { $inc: { currentHeadcount: piglets.length } });
    // 4. Add Sow to Bartolina
    await Pen.findByIdAndUpdate(targetBartolinaId, { $inc: { currentHeadcount: 1 } });

    res.json({ 
      message: `Successfully promoted ${piglets.length} piglets to ${kural.name} and moved Sow back to ${bartolina.name}` 
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};