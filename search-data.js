import { 
    Firestore,
    FieldValue,
} from '@google-cloud/firestore';
import { VertexAIEmbeddings } from "@langchain/google-vertexai";
import { config } from "dotenv";

config();

// Configure logging (you might want a more advanced logging setup)
const log = {
  info: (message) => console.log(`${new Date().toISOString()} - INFO - ${message}`),
  error: (message) => console.error(`${new Date().toISOString()} - ERROR - ${message}`),
};

async function search(query) {
  try {

    const embeddings = new VertexAIEmbeddings({
        model: process.env.EMBEDDING_MODEL_NAME,
      });
    
    // Initialize Firestore
    const firestore = new Firestore({
        projectId: process.env.PROJECT_ID,
        databaseId: process.env.DATABASE,
    });

    log.info(`Now executing query: ${query}`);
    const singleVector = await embeddings.embedQuery(query);

    const collectionRef = firestore.collection(process.env.COLLECTION);
    let vectorQuery = collectionRef.findNearest(
    "embedding",
    FieldValue.vector(singleVector), // a vector with 768 dimensions
    {
        limit: process.env.TOP_K,
        distanceMeasure: "COSINE",
    }
    );
    const vectorQuerySnapshot = await vectorQuery.get();

    for (const result of vectorQuerySnapshot.docs) {
      console.log(result.data().content);
    }
  } catch (error) {
    log.error(`Error during search: ${error.message}`);
  }
}

// Example usage (using yargs for argument parsing)
async function main() {
  const argv = await import("yargs/yargs")
    .then((yargs) =>
      yargs.default(process.argv.slice(2)).options({
        prompt: {
          type: "string",
          demandOption: true,
          describe: "The search query prompt.",
        },
      })
    )
    .then((y) => y.argv);

  const prompt = argv.prompt;
  await search(prompt);
}

// Run the main function if this script is executed
if (process.argv[1].endsWith("search-data.js")) {
  main();
}