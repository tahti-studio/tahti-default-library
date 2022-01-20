const yaml = require('js-yaml');
const fs = require('fs');
const glob = require('glob');
const zlib = require('zlib');

if (fs.existsSync('samples'))
    fs.rmSync('samples', { recursive: true });
    
fs.mkdirSync('samples');

const packs = [];
for (const pack of fs.readdirSync('packs')) {
    const yamlPath = glob(`./packs/${pack}/*.yaml`, { sync: true })[0];
    const meta = yaml.load(fs.readFileSync(yamlPath));
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
            fs.cpSync(`./packs/${pack}/samples/${sample}`, destinationPath);
            //const sampleData = fs.readFileSync(destinationPath);
            //const compressed = zlib.gzipSync(sampleData, { level: 9 });
            //fs.writeFileSync(destinationPath, compressed);
            meta.samples.push({ name: sample, path: `/${pack}/${sample}` });
        }
    }

    packs.push(meta);
}

fs.writeFileSync('./samples/samples.json', JSON.stringify(packs));
