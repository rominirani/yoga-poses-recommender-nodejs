// main.js (or index.js - choose one, but use .js extension)
import { VertexAI } from "@langchain/google-vertexai";
import { config } from "dotenv";
config();

async function callGemini(text) {
  try {
    // Initialize Vertex AI Gemini model
    const model = new VertexAI({
      model: process.env.VERTEX_AI_MODEL,
      location: process.env.GOOGLE_CLOUD_LOCATION,
      project: process.env.GOOGLE_CLOUD_PROJECT,
    });

    // Invoke the model
    const response = await model.invoke(text);

    // Return the response
    return response;
  } catch (error) {
    console.error("Error calling Gemini:", error);
    throw error; // Re-throw the error for handling in the calling function
  }
}

// Example usage
async function main() {
  const inputText = "What's the weather like in London?";
  const geminiResponse = await callGemini(inputText);
  console.log("Gemini Response:", geminiResponse);
}

main();

export { callGemini };