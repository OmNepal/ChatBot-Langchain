import express from 'express';
const app = express();

// Middleware to parse JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('.'));

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: '.' });
})

app.post('/user-input', (req, res) => {
  const userInput = req.body.userInput;
  console.log("Received user input:", userInput);
  res.json({ message: "Input received", userInput });
})

app.listen(3000, () => {
  console.log('Server is running on port 3000');
})