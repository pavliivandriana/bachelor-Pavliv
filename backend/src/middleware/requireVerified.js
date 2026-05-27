const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('emailVerified');
    if (!user || !user.emailVerified) {
      return res.status(403).json({ error: 'Email not verified', needsVerification: true });
    }
    next();
  } catch (err) {
    next(err);
  }
};
