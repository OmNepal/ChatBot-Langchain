

const userInput = document.getElementById('user-input');
const chatbotConversation = document.getElementById('chatbot-conversation-container');
let question;

const form = document.getElementById('form');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  progressConversation();

  const response = await fetch('user-input', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userInput: question })
  })
})

async function progressConversation() {
  question = userInput.value;
  userInput.value = '';

  //add user message to the conversation
  const newUserSpeechBubble = document.createElement('div');
  newUserSpeechBubble.classList.add('speech', 'speech-human')
  chatbotConversation.appendChild(newUserSpeechBubble);
  newUserSpeechBubble.textContent = question;
  chatbotConversation.scrollTop = chatbotConversation.scrollHeight; //scroll to the bottom of the conversation

  //add AI message to the coversation
  const newAISpeechBubble = document.createElement('div');
  newAISpeechBubble.classList.add('speech', 'speech-ai');
  chatbotConversation.appendChild(newAISpeechBubble);
  newAISpeechBubble.textContent = "Typing...";
  chatbotConversation.scrollTop = chatbotConversation.scrollHeight;

}

