const yaml = require('js-yaml');
const fs = require('fs');
const glob = require('glob');

const { execSync } = require('child_process');
  
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

    if (fs.existsSync(`./packs/${pack}/samples`)) {
        const samples = fs.readdirSync(`./packs/${pack}/samples`);
        for (const sample of samples) {
            const destinationPath = `./samples/${pack}/${sample}`;
            if (sample === '.DS_Store')
              continue;
            convertToFlac(`./packs/${pack}/samples/${sample}`, destinationPath.replace('.wav', '.flac'));
            meta.samples.push({ name: sample, path: `${pack}/${sample.replace('.wav', '.flac')}` });
        }
    }

    packs.push(meta);
}

fs.writeFileSync('./samples/samples.json', JSON.stringify(packs));
