import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"; //importing RecursiveCharacterTextSplitter from langchain
import { readFile } from 'fs/promises'; //using node.js's fs module to read file
import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase"; //importing SupabaseVectorStore from langchain
import { OpenAIEmbeddings } from "@langchain/openai"; //importing OpenAIEmbeddings from langchain
import dotenv from 'dotenv'; //importing dotenv to manage environment variables
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";

dotenv.config(); //loading environment variables from .env file

const sbApiKey = process.env.SUPABASE_API_KEY;
const sbUrl = process.env.SUPABASE_URL;
const openAiApiKey = process.env.OPENAI_API_KEY;

const client = createClient(sbUrl, sbApiKey) //creating supabase client to interact with the Supabase database

const embeddings = new OpenAIEmbeddings({ openAIApiKey: openAiApiKey })

const llm = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* commented part is how to read a file and create chunks with text splitter and then load them into Supabase
s
const text = await readFile('scrimba-info.txt', 'utf-8') //reading file content

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500, // size of each chunk
  separators: ['\n\n', '\n', ' ', ''], // separators to split the text without losing the actual structure
  chunkOverlap: 50 // overlap between chunks to maintain context
})

const output = await splitter.createDocuments([text])

await SupabaseVectorStore.fromDocuments( //load the documents and their embeddings into Supabase
  output,
  embeddings, //using OpenAIEmbeddings to generate embeddings for the documents
  {
    client,
    tableName: 'documents'
  }
)
  */

export async function handleLangchainTasks(userInput) {
  const prompt = "Create a standalone question based on the folowing user input: {userInput}";
  //creating a prompt template to generate standalone questions based on user input
  const promptTemplate = PromptTemplate.fromTemplate(prompt);

  const vectorStore = new SupabaseVectorStore(embeddings, {
    client,
    tableName: 'documents',
    queryName: 'match_documents'
  })

  //creating a retriever to fetch relevant documents from supabase based on the standalone question
  const retriever = vectorStore.asRetriever()

  //creating a chain that combines the prompt template, LLM, output parser, and retriever
  //output of one component is passed as input to the next component
  const chain = promptTemplate.pipe(llm).pipe(new StringOutputParser()).pipe(retriever);

  const response = await chain.invoke({ userInput });


  const prompt2 = "You are a friendly chatbot that answers questions about Scrimba based on the provided context: {context}. Only answer based on the context and do not make up any information. If you don't know the answer, apologize and ask the user to email at help@scrimba.com. User's query: {question}";

  const promptTemplate2 = PromptTemplate.fromTemplate(prompt2);

  const chain2 = promptTemplate2.pipe(llm)

  const response2 = await chain2.invoke({
    context: response,
    question: userInput
  })

  return response2.content;
}
