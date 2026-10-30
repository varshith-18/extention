const submitBtn = document.getElementById("submitBtn");

const result = document.getElementById("result");

function displayResponse(markdown) {
  // Convert Markdown into HTML
  const html = marked.parse(markdown);

  // Sanitize HTML before displaying
  result.innerHTML = DOMPurify.sanitize(html);
}

submitBtn.addEventListener("click", async () => {
  const prompt = document.getElementById("prompt").value.trim();
  const code = document.getElementById("code").value.trim();

  if (!prompt) {
    result.innerText = "Please enter a prompt!";
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerText = "Generating...";

  result.innerText = "AI is thinking...";

  try {
    const response = await fetch("http://localhost:5000/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        code,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    // Render formatted Gemini response
    displayResponse(data.result);
  } catch (error) {
    console.error("Frontend Error:", error);
    result.innerText = error.message;
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Generate Response";
  }
});
