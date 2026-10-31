require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let chatHistory = [];

app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        const role = req.body.role || "helpful assistant";

        let messages = [
            { 
              role: 'system', 
              content: `You are a highly experienced ${role}. Explain things clearly and speak like a normal human (use contractions, do not sound like a robot). 
              
              CRITICAL FORMATTING RULES:
              - NEVER use asterisks (**) or hashtags (#) for formatting. 
              - If you show math, use standard LaTeX formatting wrapped in single dollar signs (e.g., $x = 5$).

              VISUAL RULES (Very Important):
              1. If the user asks for a 2D chart (like a pie chart, bar chart, or line graph), you MUST write Chart.js code. 
                 Use this exact format, and DO NOT include any base64 image data:
                 <div class="ai-visual">
                   <canvas id="chart-canvas" style="width:100%; height:100%;"></canvas>
                   <script>
                     const ctx = document.getElementById('chart-canvas').getContext('2d');
                     new Chart(ctx, {
                       type: 'pie', 
                       data: {
                         labels: ['Apple', 'Samsung', 'Xiaomi'],
                         datasets: [{ data: [30, 40, 30], backgroundColor: ['#ff6384', '#36a2eb', '#cc65fe'] }]
                       },
                       options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: 'white' } } } }
                     });
                   <\/script>
                 </div>

              2. If the user asks for a 3D graph or 3D animation, you MUST write Three.js code.
                 Use this exact format:
                 <div class="ai-visual">
                   <div id="3d-box" style="width:100%; height:100%; display:flex; justify-content:center; align-items:center;"></div>
                   <script>
                     const scene = new THREE.Scene();
                     const camera = new THREE.PerspectiveCamera(75, 600 / 350, 0.1, 1000);
                     const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
                     renderer.setSize(600, 350);
                     document.getElementById('3d-box').appendChild(renderer.domElement);
                     
                     const geometry = new THREE.BoxGeometry(2, 2, 2);
                     const material = new THREE.MeshNormalMaterial();
                     const mesh = new THREE.Mesh(geometry, material);
                     scene.add(mesh);
                     
                     camera.position.z = 5;
                     
                     function animate() {
                       requestAnimationFrame(animate);
                       mesh.rotation.x += 0.01;
                       mesh.rotation.y += 0.01;
                       renderer.render(scene, camera);
                     }
                     animate();
                   <\/script>
                 </div>

              3. ALWAYS write a short text explanation first, and then provide the visual code inside the <div class="ai-visual"> tags. NEVER output base64 images. Do not put the code inside markdown blocks like \`\`\`html.` 
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

// ⚠️ THIS IS THE VERCEL EXPORT
module.exports = app;
