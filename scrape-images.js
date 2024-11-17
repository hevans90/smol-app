import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import { URL } from 'url';

// Path to your CSS file
const cssFilePath = 'nice.css';
// Folder to save the images
const imagesFolder = 'downloaded_images';

// Function to extract image URLs from the CSS content
const extractImageUrls = (cssContent) => {
  const regex =
    /(?:url\(['"]?)([^'")]+(?:\.png|\.jpg|\.jpeg|\.gif|\.svg|\.webp|\.bmp|\.tiff|\.ico))(['"]?\))/g;
  let match;
  const imageUrls = [];

  while ((match = regex.exec(cssContent)) !== null) {
    imageUrls.push(match[1]);
  }

  return imageUrls;
};

// Function to download an image using fetch
const downloadImage = async (url, filename) => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download image: ${url}`);
    }

    const buffer = await response.buffer();
    fs.writeFileSync(filename, buffer);
    console.log(`Downloaded: ${filename}`);
  } catch (error) {
    console.error(`Failed to download ${url}:`, error.message);
  }
};

// Main function to handle the process
const downloadImages = async () => {
  try {
    // Read the CSS file
    const cssContent = fs.readFileSync(cssFilePath, 'utf8');

    // Create the folder if it doesn't exist
    if (!fs.existsSync(imagesFolder)) {
      fs.mkdirSync(imagesFolder);
    }

    // Extract image URLs from CSS
    const imageUrls = extractImageUrls(cssContent);

    // If there are no image URLs, log and exit
    if (imageUrls.length === 0) {
      console.log('No image URLs found in the CSS file.');
      return;
    }

    // Loop through each URL and download the image
    for (const imageUrl of imageUrls) {
      const absoluteUrl = new URL(imageUrl, 'https://poe-racing.com'); // Convert relative URL to absolute if needed
      const filename = path.join(
        imagesFolder,
        path.basename(absoluteUrl.pathname),
      );
      console.log(`Downloading: ${absoluteUrl.href}`);

      // Download and save the image
      await downloadImage(absoluteUrl.href, filename);
    }

    console.log('All images have been downloaded!');
  } catch (error) {
    console.error('Error:', error.message);
  }
};

// Run the download function
downloadImages();
