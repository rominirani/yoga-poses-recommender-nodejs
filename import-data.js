import { Firestore,
         FieldValue,
} from '@google-cloud/firestore';
import { VertexAIEmbeddings } from "@langchain/google-vertexai";
import * as dotenv from 'dotenv';
import fs from 'fs/promises';

// Load environment variables
dotenv.config();

// Configure logging
const logger = {
  info: (message) => console.log(`INFO - ${new Date().toISOString()} - ${message}`),
  error: (message) => console.error(`ERROR - ${new Date().toISOString()} - ${message}`),
};

async function loadYogaPosesDataFromLocalFile(filename) {
  try {
    const data = await fs.readFile(filename, 'utf-8');
    const poses = JSON.parse(data);
    logger.info(`Loaded ${poses.length} poses.`);
    return poses;
  } catch (error) {
    logger.error(`Error loading dataset: ${error}`);
    return null;
  }
}

function createFirestoreDocuments(poses) {
  const documents = [];
  for (const pose of poses) {
    // Convert the pose to a string representation for pageContent
    const pageContent = `
name: ${pose.name || ''}
description: ${pose.description || ''}
sanskrit_name: ${pose.sanskrit_name || ''}
expertise_level: ${pose.expertise_level || 'N/A'}
pose_type: ${pose.pose_type || 'N/A'}
    `.trim();

    // The metadata will be the whole pose
    const metadata = pose;
    documents.push({ pageContent, metadata });
  }
  logger.info(`Created ${documents.length} Langchain documents.`);
  return documents;
}

async function main() {
  const allPoses = await loadYogaPosesDataFromLocalFile('./data/yoga_poses_with_descriptions.json');
  const documents = createFirestoreDocuments(allPoses);
  logger.info(`Successfully created Firestore documents. Total documents: ${documents.length}`);

  const embeddings = new VertexAIEmbeddings({
    model: process.env.EMBEDDING_MODEL_NAME,
  });
  
  // Initialize Firestore
  const firestore = new Firestore({
    projectId: process.env.PROJECT_ID,
    databaseId: process.env.DATABASE,
  });

  const collectionName = process.env.TEST_COLLECTION;

  for (const doc of documents) {
    try {
      // 1. Generate Embeddings
      const singleVector = await embeddings.embedQuery(doc.pageContent);

      // 2. Store in Firestore with Embeddings
      const firestoreDoc = {
        content: doc.pageContent,
        metadata: doc.metadata, // Store the original data as metadata
        embedding: FieldValue.vector(singleVector), // Add the embedding vector
      };

      const docRef = firestore.collection(collectionName).doc();
      await docRef.set(firestoreDoc);
      logger.info(`Document ${docRef.id} added to Firestore with embedding.`);
    } catch (error) {
      logger.error(`Error processing document: ${error}`);
    }
  }

  logger.info('Finished adding documents to Firestore.');
}

main();
