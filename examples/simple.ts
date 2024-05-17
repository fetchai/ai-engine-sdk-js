import {
  AiEngine,
  isAgentMessage,
  isAiEngineMessage,
  isConfirmationMessage,
  isTaskSelectionMessage,
} from "@fetchai/ai-engine-sdk";

const apiBaseUrl = "https://engine-staging.sandbox-london-b.fetch-ai.com";
const apiKey = process.env["API_KEY"] ?? "";

const snooze = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
  const aiEngine = new AiEngine(apiKey, { apiBaseUrl });

  const session = await aiEngine.createSession();
  await session.start("Find a holiday destination");

  let emptyCount = 0;
  while (emptyCount < 12) {
    const messages = await session.getMessages();
    if (messages.length === 0) {
      emptyCount++;
    } else {
      emptyCount = 0;
    }

    console.log("MSGS", messages);

    for (const message of messages) {
      if (isTaskSelectionMessage(message)) {
        console.log("TASK", message);
        await session.submitTaskSelection(message, [message.options[1]!]);
      } else if (isAgentMessage(message)) {
        console.log("AGENT", message);

        if (message.text.includes("please provide the request id")) {
          await session.submitResponse(message, "14");
        } else if (message.text.includes("please provide your email address")) {
          await session.submitResponse(message, "edward.fitzgerald@fetch.ai");
        } else if (message.text.includes("please provide your full name")) {
          await session.submitResponse(message, "Edward FitzGerald");
        } else if (message.text.includes("please provide your response")) {
          await session.submitResponse(message, "I am happy with the result");
        }
      } else if (isAiEngineMessage(message)) {
        console.log("ENGINE", message);
      } else if (isConfirmationMessage(message)) {
        console.log("CONFIRM", message);
        await session.submitConfirmation(message);
      } else {
        console.log("???", message);
      }
    }

    // console.log("Chilling for 3 seconds...");
    await snooze(1200);
  }

  await session.delete();

  console.log(aiEngine);
  console.log(session);
};

main();
