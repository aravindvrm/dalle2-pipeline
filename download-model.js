const fs = require('fs');
const https = require('https');
const path = require('path');

const modelUrl = 'https://storage.googleapis.com/.../model.json'; // Replace with the actual URL
const modelDir = path.join(__dirname, 'deepLabv3-models', 'ade20k-quantized');
const modelPath = path.join(modelDir, 'model.json');

if (!fs.existsSync(modelDir)) fs.mkdirSync(modelDir, { recursive: true });

https.get(modelUrl, (res) => {
  if (res.statusCode === 200) {
    const file = fs.createWriteStream(modelPath);
    res.pipe(file);
    file.on('finish', () => {
      console.log('Model downloaded successfully!');
      file.close();
    });
  } else {
    console.error('Failed to download model:', res.statusCode);
  }
});