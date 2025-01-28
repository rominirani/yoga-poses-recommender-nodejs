# Yoga pose recommender
A Node.js web application that demonstrates how to do Vector Search on a Yoga Poses database in Firestore.

The application is a step by step demonstration of the following:
1. Utilize an existing Hugging Face Dataset of Yoga poses (JSON format).
2. Enhance the dataset with an additional field `description` that uses Gemini to generate descriptions for each of the poses.
3. Use Langchain JS to create a Document and Firestore API to create the collection in Firestore.
4. Create a composite index in Firestore to allow for Vector search.
5. Utilize the Vector Search in a Node.js Application that brings everything together as shown below:

<img title="a title" alt="Alt text" src="/images/screenshot.png">

## Technologies used:
1. JavaScript + Node.js Framework
2. Google Cloud : Firestore, Cloud Run, Gemini in Vertex AI
3. Langchain JS framework

