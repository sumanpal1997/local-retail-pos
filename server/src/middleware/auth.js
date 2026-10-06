const jwt = require('jsonwebtoken');
const { getOrCreateDefaultStore } = require('../seed');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'local_retail_pos_dev_secret_key_2026_change_in_production');
      req.store = decoded;
      req.storeId = decoded.storeId;
      return next();
    }

    // Default standalone / dev store fallback mode
    const defaultStore = await getOrCreateDefaultStore();
    req.store = { storeId: defaultStore._id, role: defaultStore.role || 'owner' };
    req.storeId = defaultStore._id;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired authentication token', error: error.message });
  }
};

module.exports = authMiddleware;
