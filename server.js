require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let chatHistory = [];

app.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        const role = req.body.role || "helpful expert";

        let messages = [
            { 
              role: 'system', 
              content: `You are a highly experienced ${role}. Explain things clearly. 
              
              CRITICAL FORMATTING RULES:
              - NEVER use asterisks (**) or hashtags (#) for formatting. 
              - If you show math, use standard LaTeX formatting wrapped in single dollar signs (e.g., $x = 5$).
              - Speak like a normal human.

              VISUAL RULES:
              - If the user asks for a 3D visual, DO NOT generate complex models. ONLY use basic shapes (BoxGeometry, SphereGeometry, TorusGeometry, CylinderGeometry).
              - You MUST output the visual inside <div class="ai-visual"> ... </div>.
              - YOU MUST USE THIS EXACT TEMPLATE FOR 3D (replace shape/color as needed):
              
              <div class="ai-visual">
                <div id="3d-box" style="width:100%; height:100%; display:flex; justify-content:center; align-items:center;"></div>
                <script>
                  const scene = new THREE.Scene();
                  const camera = new THREE.PerspectiveCamera(75, 600 / 350, 0.1, 1000);
                  const renderer = new THREE.WebGLRenderer();
                  renderer.setSize(600, 350);
                  document.getElementById('3d-box').appendChild(renderer.domElement);
                  
                  const geometry = new THREE.BoxGeometry(1, 1, 1);
                  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
                  const cube = new THREE.Mesh(geometry, material);
                  scene.add(cube);
                  
                  camera.position.z = 3;
                  
                  function animate() {
                    requestAnimationFrame(animate);
                    cube.rotation.x += 0.01;
                    cube.rotation.y += 0.01;
                    renderer.render(scene, camera);
                  }
                  animate();
                <\/script>
              </div>
              
              Do not add extra scripts. Just use the template above.` 
            }
        ];

        chatHistory.forEach(msg => messages.push(msg));
        messages.push({ role: 'user', content: userMessage });

        const groqResponse = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'openai/gpt-oss-120b', 
                messages: messages
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const replyText = groqResponse.data.choices[0].message.content;

        chatHistory.push({ role: 'user', content: userMessage });
        chatHistory.push({ role: 'assistant', content: replyText });

        if (chatHistory.length > 10) {
            chatHistory = chatHistory.slice(chatHistory.length - 10);
        }

        res.json({ reply: replyText });

    } catch (error) {
        console.log("ERROR:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Something went wrong." });
    }
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});