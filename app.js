import express from 'express';
import { createStandaloneQuestion } from './index.js'; // Importing the function to create standalone questions

const app = express();


// Middleware to parse JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('.'));

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: '.' });
})

app.post('/user-input', async (req, res) => {
  const userInput = req.body.userInput;
  const response = await createStandaloneQuestion(userInput);
  res.json({ message: "Input received", response: response.content });
})

app.listen(3000, () => {
  console.log('Server is running on port 3000');
})