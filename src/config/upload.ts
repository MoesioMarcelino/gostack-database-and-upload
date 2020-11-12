import crypto from 'crypto';
import multer from 'multer';
import path from 'path';

const filesPath = path.resolve(__dirname, '..', '..', 'tmp');

export default {
  directory: filesPath,
  storage: multer.diskStorage({
    destination: filesPath,
    filename(req, file, callback) {
      const fileHash = crypto.randomBytes(10).toString('HEX');
      const fileName = `${fileHash}-${file.originalname}`;

      return callback(null, fileName);
    },
  }),
};
