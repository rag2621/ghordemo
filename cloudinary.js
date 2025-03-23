const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
  cloud_name: 'dys5oojz9',
  api_key: '669743482199317',
  api_secret: 'G4NGSLt8E_RfjBFYHtjA4RZKukg',
});

module.exports = cloudinary;