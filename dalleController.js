require('dotenv').config();
const sharp = require('sharp');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const tf = require('@tensorflow/tfjs-node');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
let deeplabModel = null;

// Load DeepLabV3+ model
async function loadModel() {
  if (!deeplabModel) {
    console.log('Loading DeepLabV3+ model...');
    deeplabModel = await tf.loadGraphModel('file://deepLabv3-models/ade20k-quantized/model.json');
    console.log('Model loaded successfully!');
  }
  return deeplabModel;
}

// Helper to resize an image
async function resizeImage(imageBuffer, size) {
  return sharp(imageBuffer)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toFormat('png')
    .ensureAlpha()
    .toBuffer();
}

// Generate segmentation mask
async function generateSegmentationMask(imagePath, maskPath) {
  try {
    console.log('Generating segmentation mask...');
    const resizedBuffer = await resizeImage(fs.readFileSync(imagePath), 513);

    const imageTensor = tf.node.decodeImage(resizedBuffer, 3).expandDims(0).cast('int32');
    const model = await loadModel();
    const segmentation = model.predict(imageTensor).squeeze();
    const segmentationData = segmentation.arraySync();

    const uniqueValues = [...new Set(segmentationData.flat())];
    console.log('Unique segmentation values:', uniqueValues);

    const maskWidth = segmentationData[0].length;
    const maskHeight = segmentationData.length;

    // Create an RGBA mask buffer
    const maskBuffer = Buffer.alloc(maskWidth * maskHeight * 4); // RGBA
    segmentationData.flat().forEach((value, index) => {
      const baseIndex = index * 4;
      const isBackground = value === 0;
      const grayscaleValue = isBackground ? 255 : Math.floor((value / Math.max(...uniqueValues)) * 255);

      maskBuffer[baseIndex] = grayscaleValue; // Red
      maskBuffer[baseIndex + 1] = grayscaleValue; // Green
      maskBuffer[baseIndex + 2] = grayscaleValue; // Blue
      maskBuffer[baseIndex + 3] = isBackground ? 0 : 255; // Alpha
    });

    await sharp({
      create: {
        width: maskWidth,
        height: maskHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        {
          input: maskBuffer,
          raw: { width: maskWidth, height: maskHeight, channels: 4 },
        },
      ])
      .resize(1024, 1024, { fit: 'fill' })
      .png()
      .toFile(maskPath);

    console.log('Segmentation mask saved to:', maskPath);
  } catch (error) {
    console.error('Error generating segmentation mask:', error.message);
    throw error;
  }
}

// Main function to process an image
async function processImage({ imageUrl, prompt, file }) {
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  const timestamp = Date.now();
  const imagePath = path.join(tempDir, `${timestamp}_image.png`);
  const maskPath = path.join(tempDir, `${timestamp}_mask.png`);

  try {
    let tempImageBuffer;

    if (imageUrl) {
      console.log('Downloading image from URL...');
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      tempImageBuffer = response.data;
    } else if (file && file.buffer) {
      console.log('Processing local image buffer...');
      tempImageBuffer = file.buffer;
    } else if (file && file.path) {
      console.log('Reading image from file path...');
      tempImageBuffer = fs.readFileSync(file.path);
    } else {
      throw new Error('No valid image input provided.');
    }

    const resizedImage = await resizeImage(tempImageBuffer, 1024);
    fs.writeFileSync(imagePath, resizedImage);

    console.log('Generating segmentation mask...');
    await generateSegmentationMask(imagePath, maskPath);

    console.log('Sending data to OpenAI API...');
    const form = new FormData();
    form.append('image', fs.createReadStream(imagePath));
    form.append('mask', fs.createReadStream(maskPath));
    form.append('prompt', prompt);
    form.append('n', 1);
    form.append('size', '1024x1024');

    const apiResponse = await axios.post('https://api.openai.com/v1/images/edits', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    const generatedImageUrl = apiResponse.data.data[0].url;
    console.log('Image generated successfully:', generatedImageUrl);
    return generatedImageUrl;
  } catch (error) {
    console.error('Error in processImage:', error.message);
    throw error;
  }
}

module.exports = { processImage };