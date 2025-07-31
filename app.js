import express from 'express';
import { handleLangchainTasks } from './index.js'; // Importing the function to create standalone questions

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
  const response = await handleLangchainTasks(userInput);
  res.json({ message: "Input received" });
})

app.listen(3000, () => {
  console.log('Server is running on port 3000');
})