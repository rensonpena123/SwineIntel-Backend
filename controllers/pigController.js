import Pig from '../models/Pig.js';
import Pen from '../models/Pen.js';
import HealthLog from '../models/HealthLog.js'; 

// @desc    Add a new pig (Sow, Piglet, or Fattener)
// @route   POST /api/pigs
export const addPig = async (req, res, next) => {
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
    next(error);
  }
};

// @desc    Get all pigs (with optional filters for type or pen)
// @route   GET /api/pigs
export const getPigs = async (req, res, next) => {
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
    next(error);
  }
};

// @desc    Record a birth (Farrowing event) and move Mother to Paanakan
// @route   POST /api/pigs/farrow
export const farrowEvent = async (req, res, next) => {
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
    next(error)
  }
};

// @desc    Promote a specific litter to Fatteners and move the Mother back to Bartolina
// @route   PUT /api/pigs/promote
export const promotePiglets = async (req, res, next) => {
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
    next(error);
  }
};

// @desc    Sell a batch of fatteners (Bulk Sale)
// @route   PUT /api/pigs/sell
export const sellPigs = async (req, res, next) => {
  try {
    const { pigIds } = req.body; // Expects an array of Pig IDs: ["id1", "id2"]

    if (!pigIds || !Array.isArray(pigIds) || pigIds.length === 0) {
      return res.status(400).json({ message: 'No pig IDs provided for sale' });
    }

    // 1. Find all valid pigs from the list that aren't already sold
    const pigs = await Pig.find({ _id: { $in: pigIds }, status: { $ne: 'Sold' } });

    if (pigs.length === 0) {
      return res.status(404).json({ message: 'No valid active pigs found to sell' });
    }

    // 2. Map out how many pigs are leaving each specific pen
    const penDeductions = {};
    pigs.forEach(pig => {
      if (pig.penId) {
        penDeductions[pig.penId] = (penDeductions[pig.penId] || 0) + 1;
      }
    });

    // 3. Update all selected pigs to Sold status and remove them from active pens
    await Pig.updateMany(
      { _id: { $in: pigs.map(p => p._id) } },
      { 
        $set: { 
          status: 'Sold', 
          isMarketed: true, 
          penId: null // No longer occupying physical space on the farm
        } 
      }
    );

    // 4. Dynamically subtract the correct headcount from each affected pen
    for (const penId of Object.keys(penDeductions)) {
      await Pen.findByIdAndUpdate(penId, { 
        $inc: { currentHeadcount: -penDeductions[penId] } 
      });
    }

    res.json({
      message: `Successfully processed sale for ${pigs.length} pigs. Pen headcounts updated.`,
      soldPigIds: pigs.map(p => p._id)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record a pig mortality event
// @route   PUT /api/pigs/mortality
export const recordMortality = async (req, res, next) => {
  try {
    const { pigId } = req.body;

    const pig = await Pig.findById(pigId);
    if (!pig) {
      return res.status(404).json({ message: 'Pig not found' });
    }

    if (pig.status === 'Deceased') {
      return res.status(400).json({ message: 'This pig is already recorded as deceased' });
    }
    if (pig.status === 'Sold') {
      return res.status(400).json({ message: 'Cannot record mortality for a sold pig' });
    }

    const oldPenId = pig.penId;

    // 1. Mark pig as Deceased and remove from its pen layout
    pig.status = 'Deceased';
    pig.penId = null; 
    await pig.save();

    // 2. Drop the headcount of the pen it was in by 1
    if (oldPenId) {
      await Pen.findByIdAndUpdate(oldPenId, { $inc: { currentHeadcount: -1 } });
    }

    res.json({ 
      message: `Mortality event logged. Pig status updated to Deceased and removed from pen.` 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a single pig's health status (Healthy/Sick) and auto-log incidents
// @route   PUT /api/pigs/:id/status
export const updatePigStatus = async (req, res, next) => {
  try {
    const { status, description } = req.body; // description contains symptoms or status details
    const pigId = req.params.id;

    if (!['Healthy', 'Sick'].includes(status)) {
      return res.status(400).json({ message: 'Invalid health status value' });
    }

    const pig = await Pig.findById(pigId);
    if (!pig) {
      return res.status(404).json({ message: 'Pig record not found' });
    }

    // If marked sick, require a description of what is wrong
    if (status === 'Sick' && !description) {
      return res.status(400).json({ message: 'Please provide a description of the symptoms for the farm owner' });
    }

    pig.status = status;
    await pig.save();

    // Automatically generate an explicit incident entry if the animal is sick
    if (status === 'Sick') {
      await HealthLog.create({
        targetType: 'Pig',
        pigId: pig._id,
        logType: 'Sickness Incident',
        treatmentName: 'Sickness Reported',
        remarks: description,
        administeredBy: req.user._id
      });
    }

    res.json({ message: `Pig ${pig.tagId} is now marked as ${status}`, pig });
  } catch (error) {
    next(error);
  }
};