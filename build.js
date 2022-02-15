const yaml = require('js-yaml');
const fs = require('fs');
const glob = require('glob');

const WaveFile = require('wavefile').WaveFile;
const Flac = require('libflacjs/dist/libflac.wasm.js');

function mergeBuffers(buffers) {
    const totalLength = buffers.reduce((sum, buffer) => sum += buffer.length, 0);
    const output = new Uint8Array(totalLength);
    let offset = 0;
    for (const buffer of buffers) {
      output.set(buffer, offset);
      offset += buffer.length;
    }
    return output;
  }
  
function convertToFlac(source, destination) {
    const wav = new WaveFile(fs.readFileSync(source));
    if (wav.fmt.bitsPerSample === 16)
      wav.toBitDepth(32);

    let samples = wav.getSamples(false, Float32Array);

    if (wav.fmt.numChannels === 1)
      samples = [samples];

    const numSamples = samples[0].length;
    const encoder = Flac.create_libflac_encoder(wav.fmt.sampleRate, wav.fmt.numChannels, 16, 8, numSamples, false);

    const sampleBuffers = [];
    for (let ch = 0; ch < wav.fmt.numChannels; ch++) {
      const channelData = samples[ch];
      const intBuffer = new Int32Array(numSamples);
      const view = new DataView(intBuffer.buffer);
      let index = 0;
      for (let i = 0; i < numSamples; i++){
        view.setInt32(index, (channelData[i] * 0x7FFF), true);
        index += 4;
      }
      sampleBuffers.push(intBuffer);
    }
  
    const data = [];
    Flac.init_encoder_stream(encoder, (chunk) => {
      data.push(chunk);
    });
  
    Flac.FLAC__stream_encoder_process(encoder, sampleBuffers, numSamples);
    Flac.FLAC__stream_encoder_finish(encoder);
    Flac.FLAC__stream_encoder_delete(encoder);
    const flacData = mergeBuffers(data);
    fs.writeFileSync(destination, Buffer.from(flacData));
  }

Flac.onready = e => {
    if (fs.existsSync('samples'))
    fs.rmSync('samples', { recursive: true });
    
    fs.mkdirSync('samples');

    const packs = [];
    for (const pack of fs.readdirSync('packs')) {
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
                convertToFlac(`./packs/${pack}/samples/${sample}`, destinationPath.replace('.wav', '.flac'));
                meta.samples.push({ name: sample, path: `${pack}/${sample.replace('.wav', '.flac')}` });
            }
        }

        packs.push(meta);
    }

    fs.writeFileSync('./samples/samples.json', JSON.stringify(packs));
}
