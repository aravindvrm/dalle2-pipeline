DALL·E 2 Pipeline

A Node.js pipeline for processing images, generating segmentation masks using DeepLabV3+, and creating AI-powered image edits using OpenAI’s DALL·E API.

Features
	•	Local or URL Input: Accepts images from local storage or remote URLs.
	•	Segmentation Masks: Automatically generates RGBA masks for image editing.
	•	OpenAI Integration: Submits images and masks to the DALL·E API for editing.

Installation
	1.	Clone the Repository:

git clone https://github.com/yourusername/dalle2-pipeline.git
cd dalle2-pipeline


	2.	Install Dependencies:

npm install


	3.	Set Up Environment Variables:
	•	Create a .env file based on .env.example:

cp .env.example .env


	•	Add your OpenAI API key to .env:

OPENAI_API_KEY=your_openai_api_key


	4.	Add the DeepLabV3+ Model:
 
 ## Download the Model
Run the following script to download the DeepLabV3+ model:
```bash
node download-model.js

	•	Download the ADE20K-Quantized DeepLabV3+ model and place it in:

deepLabv3-models/ade20k-quantized/model.json



Usage
	1.	Run Tests:
	•	Place a test image (e.g., test-dog.jpg) in the temp/ folder.
	•	Update dalle-test.js with your desired prompt and run:

node dalle-test.js


	2.	Integrate into Your Project:
	•	Import the processImage function:

const { processImage } = require('./dalleController');

processImage({
  imageUrl: 'https://example.com/image.jpg',
  prompt: 'Replace the background with a sunset',
}).then(console.log).catch(console.error);



Project Structure

dalle2-pipeline/
├── dalleController.js   # Core logic for processing images and generating masks
├── dalle-test.js        # Script to test the pipeline
├── temp/                # Temporary storage for input/output files
├── deepLabv3-models/    # Model files for DeepLabV3+
├── .env.example         # Environment variable template
├── README.md            # Project documentation
└── package.json         # Dependencies and scripts

Dependencies
	•	Image Processing: sharp
	•	TensorFlow.js: @tensorflow/tfjs-node
	•	HTTP Requests: axios
	•	Form Handling: form-data
	•	Environment Variables: dotenv

License

This project is licensed under the MIT License.
