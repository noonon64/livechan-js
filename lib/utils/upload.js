const config = require('../../config');
const multer = require('multer');
const path = require('path');
const uuid = require('uuid');
const get_extension = require('./get-extension');

const upload_path = path.join(config.root, config.upload_dir);
const storage = multer.diskStorage({
	destination: (req, file, callback) => callback(null, upload_path),
	filename: (req, file, callback) => {
		const id = uuid.v4();
		return callback(null, `${id}.${get_extension(file.originalname)}`);
	}
});

module.exports = multer({ storage });
