const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { generateCompletion } = require('./src/utils/aiService');

async function testAI() {
  try {
    console.log("Testing AI completion...");
    const res = await generateCompletion({
      systemPrompt: "You are a professional technical interviewer.",
      prompt: "Greet the candidate and ask ONE question about Java."
    });
    console.log("SUCCESS! Response:\n", res);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

testAI();
