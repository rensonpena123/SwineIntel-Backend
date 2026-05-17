import Pig from '../models/Pig.js';
import Pen from '../models/Pen.js';

// @desc    Get real-time farm overview and monthly metrics grouped by pen type
// @route   GET /api/dashboard
export const getDashboardSummary = async (req, res) => {
  try {
    // 1. LIVESTOCK COUNTS (Active animals only)
    const activeStatuses = ['Healthy', 'Sick'];
    
    const totalActive = await Pig.countDocuments({ status: { $in: activeStatuses } });
    const sows = await Pig.countDocuments({ pigType: 'Sow', status: { $in: activeStatuses } });
    const piglets = await Pig.countDocuments({ pigType: 'Piglet', status: { $in: activeStatuses } });
    const fatteners = await Pig.countDocuments({ pigType: 'Fattener', status: { $in: activeStatuses } });

    // 2. PEN INFRASTRUCTURE UTILIZATION (Grouped by Type & Availability)
    const allPens = await Pen.find({});
    
    let bartolinaTotal = 0, bartolinaAvailable = 0;
    let paanakanTotal = 0, paanakanAvailable = 0;
    let kuralTotal = 0, kuralAvailable = 0;

    allPens.forEach(pen => {
      // A pen is available if it hasn't reached its maximum capacity limit yet
      const hasSpace = pen.currentHeadcount < pen.capacity;

      if (pen.type === 'Bartolina') {
        bartolinaTotal++;
        if (hasSpace) bartolinaAvailable++;
      } else if (pen.type === 'Paanakan') {
        paanakanTotal++;
        if (hasSpace) paanakanAvailable++;
      } else if (pen.type === 'Kural') {
        kuralTotal++;
        if (hasSpace) kuralAvailable++;
      }
    });

    // 3. MONTHLY METRICS CALCULATIONS (Current Calendar Month Boundaries)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const pigsSoldThisMonth = await Pig.countDocuments({
      status: 'Sold',
      updatedAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const mortalitiesThisMonth = await Pig.countDocuments({
      status: 'Deceased',
      updatedAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // 4. RESPOND WITH SPECIFIC NESTED METRICS
    res.json({
      livestock: {
        totalActive,
        sows,
        piglets,
        fatteners
      },
      pens: {
        totalPens: allPens.length,
        bartolina: {
          total: bartolinaTotal,
          available: bartolinaAvailable
        },
        paanakan: {
          total: paanakanTotal,
          available: paanakanAvailable
        },
        kural: {
          total: kuralTotal,
          available: kuralAvailable
        }
      },
      monthlyMetrics: {
        pigsSoldThisMonth,
        mortalitiesThisMonth
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};