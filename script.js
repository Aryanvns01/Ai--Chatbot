

const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");

const API_KEY = "AIzaSyCWUX0lXoThxGSrNSnp8rrM36vSR3fNPvA"; // Replace with your actual API key
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const userData = {
  message: null,
  file: {
    data: null,
    mime_type: null,
  },
};

const chatHistory = [];
const initialInputHeight = messageInput.scrollHeight;

// Helper to create messages
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// Bot response handler
const generateBotResponse = async (incomingMessageDiv) => {
  const messageElement = incomingMessageDiv.querySelector(".message-text");

  chatHistory.push({
    role: "user",
    parts: [
      { text: userData.message },
      ...(userData.file.data ? [{ inline_data: userData.file }] : []),
    ],
  });

  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: chatHistory }),
  };

  try {
    const response = await fetch(API_URL, requestOptions);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "API error");

    const apiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .trim();

    messageElement.innerText = apiResponseText;

    chatHistory.push({ role: "model", parts: [{ text: apiResponseText }] });
  } catch (error) {
    messageElement.innerText = error.message;
    messageElement.style.color = "#ff0000";
  } finally {
    incomingMessageDiv.classList.remove("thinking");
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    userData.file = { data: null, mime_type: null }; // reset file
  }
};

// Send message
const handleOutgoingMessage = (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text && !userData.file.data) return;

  userData.message = text;
  messageInput.value = "";
  messageInput.dispatchEvent(new Event("input"));

  const filePreview = userData.file.data
    ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment" />`
    : "";

  const userMessage = createMessageElement(
    `<div class="message-text"></div>${filePreview}`,
    "user-message"
  );

  userMessage.querySelector(".message-text").textContent = text;
  chatBody.appendChild(userMessage);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

  setTimeout(() => {
    const botMessage = createMessageElement(
      `<div class="bot-avatar"></div>
       <div class="message-text">
         <div class="thinking-indicator">
           <div class="dot"></div>
           <div class="dot"></div>
           <div class="dot"></div>
         </div>
       </div>`,
      "bot-message",
      "thinking"
    );

    chatBody.appendChild(botMessage);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    generateBotResponse(botMessage);
  }, 600);
};

// Handle Enter key (desktop)
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 768) {
    handleOutgoingMessage(e);
  }
});

// Auto-resize input
messageInput.addEventListener("input", () => {
  messageInput.style.height = `${initialInputHeight}px`;
  messageInput.style.height = `${messageInput.scrollHeight}px`;
  const form = document.querySelector(".chat-form");
  if (form) {
    form.style.borderRadius =
      messageInput.scrollHeight > initialInputHeight ? "15px" : "32px";
  }
});

// Handle file uploads
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target.result.split(",")[1];
    userData.file = {
      data: base64,
      mime_type: file.type,
    };
    fileInput.value = "";
  };
  reader.readAsDataURL(file);
});

// Button & togglers
sendMessageButton.addEventListener("click", handleOutgoingMessage);

document.querySelector("#file-upload")?.addEventListener("click", () => {
  fileInput.click();
});

chatbotToggler?.addEventListener("click", () => {
  document.body.classList.toggle("show-chatbot");
});

closeChatbot?.addEventListener("click", () => {
  document.body.classList.remove("show-chatbot");
});

