import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"; //importing RecursiveCharacterTextSplitter from langchain
import { readFile } from 'fs/promises'; //using node.js's fs module to read file
import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase"; //importing SupabaseVectorStore from langchain
import { OpenAIEmbeddings } from "@langchain/openai"; //importing OpenAIEmbeddings from langchain
import dotenv from 'dotenv'; //importing dotenv to manage environment variables
import { PromptTemplate } from "@langchain/core/prompts";

dotenv.config(); //loading environment variables from .env file

try {
  const text = await readFile('scrimba-info.txt', 'utf-8') //reading file content

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500, // size of each chunk
    separators: ['\n\n', '\n', ' ', ''], // separators to split the text without losing the actual structure
    chunkOverlap: 50 // overlap between chunks to maintain context
  })

  const output = await splitter.createDocuments([text])

  const sbApiKey = process.env.SUPABASE_API_KEY;
  const sbUrl = process.env.SUPABASE_URL;
  const openAiApiKey = process.env.OPENAI_API_KEY;

  const client = createClient(sbUrl, sbApiKey) //creating supabase client to interact with the Supabase database

  await SupabaseVectorStore.fromDocuments( //load the documents and their embeddings into Supabase
    output,
    new OpenAIEmbeddings({ openAIApiKey: openAiApiKey }), //using OpenAIEmbeddings to generate embeddings for the documents
    {
      client,
      tableName: 'documents'
    }
  )

} catch (error) {
  console.error("An error occurred:", error);
}

export async function getResponse() {
  const prompt = "Create a standalone question based on the folowing information: {userInput}";
  const promptTemplate = PromptTemplate.fromTemplate(prompt);
  console.log("Prompt Template:", promptTemplate);
}