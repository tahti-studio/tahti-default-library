const yaml = require('js-yaml');
const fs = require('fs');
const glob = require('glob');

if (fs.existsSync('samples'))
    fs.rmSync('samples', { recursive: true });
    
fs.mkdirSync('samples');

const packs = [];
for (const pack of fs.readdirSync('packs')) {
    const yamlPath = glob('./packs/' + pack + '/*.yaml', { sync: true })[0];
    const meta = yaml.load(fs.readFileSync(yamlPath));
    fs.mkdirSync('./samples/' + pack);
    const imagePath = glob('./packs/' + pack + '/*.jpg', { sync: true })[0];
    if (imagePath) {
        fs.cpSync(imagePath, './samples/' + pack + '/' + 'image.jpg');
        meta.image = pack + '/' + 'image.jpg';
    }

    meta.samples = [];

    const samples = fs.readdirSync('./packs/' + pack + '/samples');
    for (const sample of samples) {
        fs.cpSync('./packs/' + pack + '/samples/' + sample, './samples/' + pack + '/' + sample);
        meta.samples.push(sample);
    }

    packs.push(meta);
}

fs.writeFileSync('./samples/samples.json', JSON.stringify(packs));
