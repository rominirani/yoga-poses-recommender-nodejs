import { VertexAI } from "@langchain/google-vertexai";
import fs from 'fs/promises'; // Use fs/promises for async file operations
import dotenv from 'dotenv';
import pRetry from 'p-retry';
import { promisify } from 'util';

const sleep = promisify(setTimeout);

// Load environment variables
dotenv.config();

async function callGemini(poseName, sanskritName, expertiseLevel, poseTypes) {

    const prompt = `
    Generate a concise description (max 50 words) for the yoga pose: ${poseName}
    Also known as: ${sanskritName}
    Expertise Level: ${expertiseLevel}
    Pose Type: ${poseTypes.join(', ')}

    Include key benefits and any important alignment cues.
    `;

    try {
      // Initialize Vertex AI Gemini model
      const model = new VertexAI({
        model: process.env.GEMINI_MODEL_NAME,
        location: process.env.LOCATION,
        project: process.env.PROJECT_ID,
      });
  
      // Invoke the model
      const response = await model.invoke(prompt);
  
      // Return the response
      return response;
    } catch (error) {
      console.error("Error calling Gemini:", error);
      throw error; // Re-throw the error for handling in the calling function
    }
  }

// Configure logging (you can use a library like 'winston' for more advanced logging)
const logger = {
  info: (message) => console.log(`INFO - ${new Date().toISOString()} - ${message}`),
  error: (message) => console.error(`ERROR - ${new Date().toISOString()} - ${message}`),
};

async function generateDescription(poseName, sanskritName, expertiseLevel, poseTypes) {
  const prompt = `
    Generate a concise description (max 50 words) for the yoga pose: ${poseName}
    Also known as: ${sanskritName}
    Expertise Level: ${expertiseLevel}
    Pose Type: ${poseTypes.join(', ')}

    Include key benefits and any important alignment cues.
    `;

  const req = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  };

  const runWithRetry = async () => {
    const resp = await generativeModel.generateContent(req);
    const response = await resp.response;
    const text = response.candidates[0].content.parts[0].text;
    return text;
  };

  try {
    const text = await pRetry(runWithRetry, {
      retries: 5,
      onFailedAttempt: (error) => {
        logger.info(
          `Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left. Waiting ${error.retryDelay}ms...`
        );
      },
      minTimeout: 4000, // 4 seconds (exponential backoff will adjust this)
      factor: 2, // Exponential factor
    });
    return text;
  } catch (error) {
    logger.error(`Error generating description for ${poseName}: ${error}`);
    return '';
  }
}

async function addDescriptionsToJSON(inputFile, outputFile) {
  try {
    const data = await fs.readFile(inputFile, 'utf-8');
    const yogaPoses = JSON.parse(data);

    const totalPoses = yogaPoses.length;
    let processedCount = 0;

    for (const pose of yogaPoses) {
      if (pose.name !== ' Pose') {
        const startTime = Date.now();
        pose.description = await callGemini(
          pose.name,
          pose.sanskrit_name,
          pose.expertise_level,
          pose.pose_type
        );

        const endTime = Date.now();
        const timeTaken = (endTime - startTime) / 1000;
        processedCount++;
        logger.info(`Processed: ${processedCount}/${totalPoses} - ${pose.name} (${timeTaken.toFixed(2)} seconds)`);
      } else {
        pose.description = '';
        processedCount++;
        logger.info(`Processed: ${processedCount}/${totalPoses} - ${pose.name} (${timeTaken.toFixed(2)} seconds)`);
      }

      // Add a delay to avoid rate limit
      await sleep(30000); // 30 seconds
    }

    await fs.writeFile(outputFile, JSON.stringify(yogaPoses, null, 2));
    logger.info(`Descriptions added and saved to ${outputFile}`);
  } catch (error) {
    logger.error(`Error processing JSON file: ${error}`);
  }
}

async function main() {
  const inputFile = './data/yoga_poses.json';
  const outputFile = './data/yoga_poses_with_descriptions.json';

  await addDescriptionsToJSON(inputFile, outputFile);
}

main();
