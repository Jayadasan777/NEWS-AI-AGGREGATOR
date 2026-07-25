require('dotenv').config();
const axios = require('axios');

const testGeminiImage = async () => {
    console.log("🔍 Checking API Key format...");
    const key = process.env.GEMINI_API_KEY;
    
    if (!key) {
        console.error("❌ Key is undefined!");
        return;
    }

    console.log(`Key starts with: ${key.substring(0, 5)}...`);
    console.log(`Key length: ${key.length} characters (Standard Gemini keys are usually 39 chars)`);

    try {
        console.log("\n🚀 Calling Gemini Imagen 3 API...");
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${key}`;
        
        const response = await axios.post(geminiUrl, {
            instances: [{ prompt: "A cinematic, neon-lit futuristic city skyline at sunset, highly detailed, 4k" }],
            parameters: { sampleCount: 1, aspectRatio: "16:9" }
        });
        
        console.log("✅ SUCCESS! Gemini authorized the key and generated an image.");
        console.log("Base64 Output Length:", response.data.predictions[0].bytesBase64Encoded.length);
        
    } catch (error) {
        console.error("\n❌ GEMINI ERROR DETAILS:");
        console.error(JSON.stringify(error.response?.data || error.message, null, 2));
    }
};

testGeminiImage();