
const generateQuizBtn = document.getElementById("generateQuizBtn");
const quizContainer = document.getElementById("quiz-container");
const quizResult = document.getElementById("quiz-result");

let quizQuestions = [];

generateQuizBtn.addEventListener("click", generateQuiz);

async function generateQuiz() {
    const code = document.getElementById("code").value.trim();
    const numberOfQuestions = Number(
        document.getElementById("questionCount").value
    );

    if (!code) {
        quizResult.textContent = "Please enter or select some code first!";
        return;
    }

    generateQuizBtn.disabled = true;
    generateQuizBtn.textContent = "Generating Quiz...";
    quizContainer.innerHTML = "";
    quizResult.textContent = "";

    try {
        const response = await fetch("http://localhost:5000/quiz", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                code,
                numberOfQuestions
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Quiz generation failed");
        }

        quizQuestions = data.questions;

        displayQuiz();

    } catch (error) {
        console.error("Quiz Error:", error);
        quizResult.textContent = error.message;

    } finally {
        generateQuizBtn.disabled = false;
        generateQuizBtn.textContent = "Generate Quiz";
    }
}

function displayQuiz() {
    quizContainer.innerHTML = "";

    quizQuestions.forEach((item, index) => {

        const questionCard = document.createElement("div");
        questionCard.className = "question-card";

        const heading = document.createElement("h4");
        heading.textContent = `Question ${index + 1}`;

        const question = document.createElement("p");
        question.className = "question-text";
        question.textContent = item.question;

        questionCard.append(heading, question);

        item.options.forEach((option, optionIndex) => {

            const label = document.createElement("label");
            label.className = "quiz-option";

            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = `question-${index}`;
            radio.value = optionIndex;

            const optionText = document.createElement("span");
            optionText.textContent = option;

            label.append(radio, optionText);
            questionCard.appendChild(label);
        });

        quizContainer.appendChild(questionCard);
    });

    const submitBtn = document.createElement("button");
    submitBtn.id = "submitQuizBtn";
    submitBtn.textContent = "Submit Quiz";

    submitBtn.addEventListener("click", submitQuiz);

    quizContainer.appendChild(submitBtn);
}

function submitQuiz() {

    let score = 0;
    let attempted = 0;

    quizQuestions.forEach((item, index) => {

        const selected = document.querySelector(
            `input[name="question-${index}"]:checked`
        );

        if (selected) {
            attempted++;

            if (Number(selected.value) === item.answerIndex) {
                score++;
            }
        }
    });

    if (attempted !== quizQuestions.length) {
        quizResult.textContent =
            `Please answer all ${quizQuestions.length} questions before submitting.`;
        return;
    }

    // Disable further changes
    document.querySelectorAll(".quiz-option input").forEach(input => {
        input.disabled = true;
    });

    document.getElementById("submitQuizBtn").disabled = true;

    // Display score
    quizResult.textContent =
        `Your Score: ${score} / ${quizQuestions.length} (${Math.round(
            score / quizQuestions.length * 100
        )}%)`;

    // Display correct answers and explanations
    quizQuestions.forEach((item, index) => {

        const card = document.querySelectorAll(".question-card")[index];

        const selected = document.querySelector(
            `input[name="question-${index}"]:checked`
        );

        const selectedIndex = Number(selected.value);

        item.options.forEach((option, optionIndex) => {

            const label = card.querySelectorAll(".quiz-option")[optionIndex];

            if (optionIndex === item.answerIndex) {
                label.classList.add("correct-option");
            } else if (optionIndex === selectedIndex) {
                label.classList.add("wrong-option");
            }
        });

        const explanation = document.createElement("div");
        explanation.className = "explanation";

        const title = document.createElement("strong");
        title.textContent = "Explanation";

        const text = document.createElement("p");
        text.textContent = item.explanation;

        explanation.append(title, text);
        card.appendChild(explanation);
    });
}
