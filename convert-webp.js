import sharp from 'sharp';
import { readdirSync } from 'fs';
import { join, extname, basename } from 'path';

// launch Script using:  node convert-webp.js

const dir = './public/visa';

const files = readdirSync(dir).filter((f) => extname(f).toLowerCase() === '.png');

for (const file of files) {
    const inputPath = join(dir, file);
    const outputPath = join(dir, `${basename(file, extname(file))}.webp`);

    await sharp(inputPath)
        .webp({ quality: 80 })
        .toFile(outputPath);

    console.log(`Converted: ${file} → ${basename(outputPath)}`);
}

console.log('Done.');