// authMiddleware.js
import jwt from 'jsonwebtoken';
import { User } from '../models/user.models.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      next();
    } catch (error) {
  if (error.name === "TokenExpiredError") {
    return res.status(401).json({ 
      success: false, 
      message: "Access token expired" 
    });
  }
  return res.status(401).json({ success: false, message: "Invalid access token" });
}
  }
 else {
    return res.status(401).json({ success: false, message: 'No access token provided, token missing' });
  }
});

export default protect;