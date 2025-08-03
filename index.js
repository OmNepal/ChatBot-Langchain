import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"; //importing RecursiveCharacterTextSplitter from langchain
import { readFile } from 'fs/promises'; //using node.js's fs module to read file
import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase"; //importing SupabaseVectorStore from langchain
import { OpenAIEmbeddings } from "@langchain/openai"; //importing OpenAIEmbeddings from langchain
import dotenv from 'dotenv'; //importing dotenv to manage environment variables
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";

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

const convHistory = [];

export async function handleLangchainTasks(userInput) {
  convHistory.push(`Human: ${userInput}`);

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

  const prompt2 = "You are a friendly chatbot that answers questions about Scrimba based on the provided context: {context} and user's conversation history: {convHistory}. Use the conversation history to provide a specific personalized responses to the user. Very importantly, only answer based on the provided information and do not make up any information. Remember that you will not add any labels like AI or HUMAN in your response. If you don't know the answer, apologize and ask the user to email at help@scrimba.com. User's query: {userInput}";

  const promptTemplate2 = PromptTemplate.fromTemplate(prompt2);

  //const chain = promptTemplate.pipe(llm).pipe(new StringOutputParser()).pipe(retriever).pipe(extractText).pipe(promptTemplate2).pipe(llm);

  const standaloneQsnChain = RunnableSequence.from([
    promptTemplate,
    llm,
    new StringOutputParser() // here, we'll get the standalone qsn
  ])

  const retrieverChain = RunnableSequence.from([
    prevResult => prevResult.qsn,
    retriever,
    extractText,
  ])

  const finalResponseChain = RunnableSequence.from([
    promptTemplate2,
    llm,
    new StringOutputParser()
  ])

  const chain = RunnableSequence.from([
    {
      qsn: standaloneQsnChain,
      original_input: new RunnablePassthrough()
    },
    {
      context: retrieverChain,
      userInput: ({ original_input }) => original_input.userInput,
      convHistory: ({ original_input }) => original_input.convHistory
    },
    finalResponseChain
  ])

  const convHistoryStr = formatConvHistory(convHistory);

  const response = await chain.invoke({ userInput, convHistory: convHistoryStr });

  convHistory.push(`AI: ${response}`)

  return response;

}

let contextText;
const extractText = (retrievedArray) => {
  retrievedArray.map((item) => {
    contextText += item.pageContent + "\n";
  })
  return contextText;
}


const formatConvHistory = (convHistory) => convHistory.map((c) => c).join('\n');

