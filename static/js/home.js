function runTool2(tool) {
  const sslscantool = document.getElementById("sslscanbtn");
  const mhunttool = document.getElementById("mhuntbtn");

  sslscantool.disabled = true;
  mhunttool.disabled = true;

  runTool(tool).finally(() => {
    sslscantool.disabled = false;
    mhunttool.disabled = false;
  });
}

function runTool(tool) {
  const url = document.getElementById("url").value.trim();
  document.getElementById("url").value = "";

  const loadingElement = document.getElementById("loading");
  const chatContainer = document.getElementById("chatContainer");

  // Append message for the scan request
  const scanRequestMessage = document.createElement("div");
  scanRequestMessage.classList.add("chat-message", "right");
  scanRequestMessage.textContent = `Running scan for: ${url}`;
  chatContainer.appendChild(scanRequestMessage);

  // Show the spinner
  loadingElement.style.display = "flex";

  return fetch(`/${tool}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ url: url }),
  })
    .then((response) => response.json())
    .then((data) => {
      loadingElement.style.display = "none";

      // Append scan result message (right side)
      const resultMessage = document.createElement("div");
      resultMessage.classList.add("chat-message", "left");
      if (data.error) {
        resultMessage.textContent = `Error: ${data.error}`;
      } else {
        resultMessage.innerHTML = data.result;
      }
      chatContainer.appendChild(resultMessage);

      // Scroll to bottom to show latest messages
      chatContainer.scrollTop = chatContainer.scrollHeight;
    })
    .catch((error) => {
      loadingElement.style.display = "none";
      const errorMessage = document.createElement("div");
      errorMessage.classList.add("chat-message", "right");
      errorMessage.textContent = `Error: ${error.message}`;
      chatContainer.appendChild(errorMessage);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    });
}

const print = console.log;

function runMhuntScan2() {
  const sslscantool = document.getElementById("sslscanbtn");
  const mhunttool = document.getElementById("mhuntbtn");

  sslscantool.disabled = true;
  mhunttool.disabled = true;

  runMhuntScan().finally(() => {
    sslscantool.disabled = false;
    mhunttool.disabled = false;
  });
}

function runMhuntScan() {
  const url = document.getElementById("url").value.trim(); // Get the URL input
  document.getElementById("url").value = "";
  const loadingElement = document.getElementById("loading");
  const chatContainer = document.getElementById("chatContainer");

  // Append a message indicating the scan request has been made
  const scanRequestMessage = document.createElement("div");
  scanRequestMessage.classList.add("chat-message", "right");
  scanRequestMessage.textContent = `Running scan for: ${url}`;
  chatContainer.appendChild(scanRequestMessage);

  // Show the loading spinner
  loadingElement.style.display = "flex";

  // Send POST request to start the scan

  return new Promise((resolve, reject) => {
    fetch("/mhunt", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ url: url }),
    })
      .then((response) => {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const stream = new ReadableStream({
          start(controller) {
            function push() {
              reader.read().then(({ done, value }) => {
                if (done) {
                  controller.close();
                  loadingElement.style.display = "none"; // Hide the loading spinner when the stream ends
                  resolve(); // Resolve the promise when the stream ends
                  return;
                }
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n");

                lines.forEach((line) => {
                  if (
                    line.trim() !== "" &&
                    line.trim() !== "\n" &&
                    line.trim() !== "data:"
                  ) {
                    // Create a new chat message for this line
                    const message = document.createElement("div");
                    message.classList.add("chat-message", "left");
                    message.textContent = line.replace("data: ", "");
                    chatContainer.appendChild(message);

                    // Scroll to the bottom to keep the latest message visible
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                  }
                });

                push(); // Continue reading the next chunk
              });
            }

            push(); // Start reading the first chunk
          },
        });

        // Start processing the response as a stream
        new Response(stream);
      })
      .catch((error) => {
        loadingElement.style.display = "none";
        const errorMessage = document.createElement("div");
        errorMessage.classList.add("chat-message", "right");
        errorMessage.textContent = `Error: ${error.message}`;
        chatContainer.appendChild(errorMessage);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        reject(error); // Reject the promise on error
      });
  });
}
