import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    const error = new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!');
    error.code = 'LIMIT_FILE_TYPE';
    cb(error);
  }
};

// Configure multer
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Single file upload middleware with error handling
export const uploadSingle = (req, res, next) => {
  upload.single('profilePicture')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          statusCode: 400, 
          message: 'File size too large. Maximum size is 5MB.' 
        });
      }
      if (err.code === 'LIMIT_FILE_TYPE' || err.message.includes('Only image files')) {
        return res.status(400).json({ 
          statusCode: 400, 
          message: 'Only image files (jpeg, jpg, png, gif, webp) are allowed!' 
        });
      }
      return res.status(400).json({ 
        statusCode: 400, 
        message: err.message || 'File upload error' 
      });
    }
    next();
  });
};

