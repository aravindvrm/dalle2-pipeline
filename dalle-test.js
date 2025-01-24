require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { processImage } = require('./dalleController');

(async () => {
  const tempDir = path.join(__dirname, 'temp');
  const localImagePath = path.join(tempDir, 'test-dog.jpg');
  const prompt = 'Add a pair of sunglasses to the dog\'s face';

  try {
    console.log('Starting test for processImage...');
    
    // Check if the local file exists
    if (!fs.existsSync(localImagePath)) {
      console.error(`❌ File not found: ${localImagePath}`);
      return;
    }

    const fileBuffer = fs.readFileSync(localImagePath);
    const generatedImageUrl = await processImage({
      imageUrl: null, // URL is not used in this test
      prompt,
      file: { buffer: fileBuffer },
    });

    // console.log('Generated Image URL:', generatedImageUrl);
  } catch (error) {
    console.error('Test failed:', error.message);
  }
})();