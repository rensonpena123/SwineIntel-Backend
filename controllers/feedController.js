import FeedInventory from '../models/FeedInventory.js';

// @desc    Get complete bodega feed inventory status
// @route   GET /api/feed
export const getFeedInventory = async (req, res) => {
  try {
    const inventory = await FeedInventory.find({});
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Restock feed inventory (Delivery arrivals)
// @route   POST /api/feed/restock
export const restockFeed = async (req, res) => {
  try {
    const { feedType, sacksAdded, customThreshold } = req.body;

    if (!feedType || sacksAdded === undefined) {
      return res.status(400).json({ message: 'Please provide feed type and number of sacks' });
    }

    // Find existing feed record or initialize a new one dynamically if it doesn't exist yet
    let feed = await FeedInventory.findOne({ feedType });

    if (!feed) {
      feed = new FeedInventory({
        feedType,
        currentSacks: sacksAdded,
        lowStockThreshold: customThreshold || 5
      });
    } else {
      feed.currentSacks += Number(sacksAdded);
      if (customThreshold !== undefined) feed.lowStockThreshold = customThreshold;
    }

    // Recalculate reorder flag status
    feed.needsReorder = feed.currentSacks <= feed.lowStockThreshold;
    await feed.save();

    res.status(200).json({ message: `Successfully added ${sacksAdded} sacks of ${feedType} feed.`, feed });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Withdraw sacks from bodega for active pen use
// @route   PUT /api/feed/withdraw
export const withdrawFeed = async (req, res) => {
  try {
    const { feedType, sacksWithdrawn } = req.body;

    if (!feedType || !sacksWithdrawn) {
      return res.status(400).json({ message: 'Please specify feed type and quantity to withdraw' });
    }

    const feed = await FeedInventory.findOne({ feedType });

    if (!feed) {
      return res.status(404).json({ message: `No inventory record found for ${feedType} feed` });
    }

    // Guardrail Check: Ensure bodega has enough physical sacks
    if (feed.currentSacks < Number(sacksWithdrawn)) {
      return res.status(400).json({ 
        message: `Insufficient stock! Only ${feed.currentSacks} sacks of ${feedType} left in the bodega.` 
      });
    }

    // Deduct stock levels
    feed.currentSacks -= Number(sacksWithdrawn);

    // Auto-Alert Engine logic trigger point
    if (feed.currentSacks <= feed.lowStockThreshold) {
      feed.needsReorder = true;
    }

    await feed.save();

    res.json({
      message: `Withdrew ${sacksWithdrawn} sack(s) of ${feedType}. Remaining: ${feed.currentSacks}`,
      lowStockWarning: feed.needsReorder,
      feed
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};