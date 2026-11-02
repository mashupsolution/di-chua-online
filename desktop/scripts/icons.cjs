const fs = require('node:fs');
const path = require('node:path');
const { Resvg } = require('@resvg/resvg-js');

const directory = path.join(__dirname, '../icons');
const source = fs.readFileSync(path.join(directory, 'icon.svg'));
const rasterize = size => Buffer.from(new Resvg(source, { fitTo: { mode: 'width', value: size } }).render().asPng());
fs.writeFileSync(path.join(directory, 'icon.png'), rasterize(1024));

const sizes = [16, 24, 32, 48, 64, 128, 256];
const images = sizes.map(rasterize);
const header = Buffer.alloc(6 + 16 * images.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach((image, index) => {
  const entry = 6 + index * 16;
  header[entry] = header[entry + 1] = sizes[index] === 256 ? 0 : sizes[index];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(image.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += image.length;
});
fs.writeFileSync(path.join(directory, 'icon.ico'), Buffer.concat([header, ...images]));

const chunks = [[16, 'icp4'], [32, 'icp5'], [64, 'icp6'], [128, 'ic07'], [256, 'ic08'], [512, 'ic09'], [1024, 'ic10']]
  .map(([size, type]) => {
    const png = rasterize(size);
    const chunkHeader = Buffer.alloc(8);
    chunkHeader.write(type);
    chunkHeader.writeUInt32BE(png.length + 8, 4);
    return Buffer.concat([chunkHeader, png]);
  });
const icnsHeader = Buffer.alloc(8);
icnsHeader.write('icns');
icnsHeader.writeUInt32BE(8 + chunks.reduce((total, chunk) => total + chunk.length, 0), 4);
fs.writeFileSync(path.join(directory, 'icon.icns'), Buffer.concat([icnsHeader, ...chunks]));
console.log('Generated PNG, Windows ICO, and macOS ICNS from the lotus SVG.');
