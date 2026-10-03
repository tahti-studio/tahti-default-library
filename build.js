import yaml from 'js-yaml';
import fs from 'node:fs';
import glob from 'glob';
import AdmZip from 'adm-zip';

import { execSync } from 'node:child_process';
  
function convertToFlac(source, destination) {
  execSync(`ffmpeg -i "${source}" -c:a flac "${destination}"`);
}

if (fs.existsSync('samples'))
fs.rmSync('samples', { recursive: true });

fs.mkdirSync('samples');

const packs = [];
for (const pack of fs.readdirSync('packs')) {
    if (pack === '.DS_Store')
      continue;

    const yamlPath = glob(`./packs/${pack}/*.yaml`, { sync: true })[0];
    const meta = yaml.load(fs.readFileSync(yamlPath));

    if (meta.draft)
      continue;

    fs.mkdirSync(`./samples/${pack}`);
    const imagePath = glob(`./packs/${pack}/*.jpg`, { sync: true })[0];
    if (imagePath) {
        fs.cpSync(imagePath, `./samples/${pack}/image.jpg`);
        meta.image = `${pack}/image.jpg`;
    }

    meta.samples = [];

    const zip = new AdmZip();
    if (fs.existsSync(`./packs/${pack}/samples`)) {
        const samples = fs.readdirSync(`./packs/${pack}/samples`);
        for (const sample of samples) {
            const destinationPath = `./samples/${pack}/${sample.replace('.wav', '.flac')}`;
            if (sample === '.DS_Store')
              continue;
            convertToFlac(`./packs/${pack}/samples/${sample}`, destinationPath);
            meta.samples.push({ name: sample, path: `${pack}/${sample.replace('.wav', '.flac')}` });
            zip.addLocalFile(destinationPath);
        }
    }
    zip.writeZip(`./samples/${pack}/samples.zip`);
    meta.zip_path = `${pack}/samples.zip`;
    packs.push(meta);
}

fs.writeFileSync('./samples/samples.json', JSON.stringify(packs));
