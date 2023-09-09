const sharp = require("sharp");

module.exports = async (buffer) => {

    const ref = Date.now() + '.' + 'webp';

    await sharp(buffer)
      .webp({ quality: 20 })
      .toFile("./images/" + ref);
    return ref

}