const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'public', 'images', 'uploads');

module.exports = {
  deleteImage(imageUrl) {
    if (!imageUrl) return;
    const filename = path.basename(imageUrl);
    const filePath = path.join(UPLOADS_DIR, filename);
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error('Failed to delete image:', filePath, err.message);
      }
    });
  },

  deleteImages(urls) {
    if (!urls || !Array.isArray(urls)) return;
    urls.forEach((url) => this.deleteImage(url));
  },
};
