import { v4 } from "uuid";

import {
  ApiMessage,
  ApiMessagePayload,
  ApiNewMessages,
  ApiNewSessionRequest,
  ApiNewSessionResponse,
  ApiSubmitMessage,
  isApiAgentInfoMessage,
  isApiAgentJsonMessage,
  isApiAgentMessageMessage,
  isApiContextJson,
  isApiTaskList,
} from "ai-engine-sdk/types/api";

import {
  AgentMessage,
  ConfirmationMessage,
  Message,
  TaskOption,
  TaskSelectionMessage,
} from "ai-engine-sdk/types/messages";

export * from "ai-engine-sdk/types/messages";

const defaultApiBaseUrl = "https://agentverse.ai";

async function makeApiRequest<RESP, REQ = null>(
  apiBaseUrl: string,
  apiKey: string,
  method: "GET" | "POST" | "DELETE",
  endpoint: string,
  payload: REQ,
): Promise<RESP> {
  const body = payload ? JSON.stringify(payload) : null;

  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    method: method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body,
  });
  if (!response.ok) {
    throw new Error(
      `Request failed with status ${response.status} to ${endpoint}`,
    );
  }

  const resp = await response.json();
  console.log("API", resp);
  return resp;
}

export class Session {
  private readonly _apiBaseUrl: string;
  private readonly _apiKey: string;
  private _messages: ApiMessage[] = [];
  private _messageIds: Set<string> = new Set();
  readonly sessionId: string;
  readonly functionGroup: string;

  constructor(
    apiBaseUrl: string,
    apiKey: string,
    sessionId: string,
    functionGroup: string,
  ) {
    this._apiBaseUrl = apiBaseUrl;
    this._apiKey = apiKey;
    this.sessionId = sessionId;
    this.functionGroup = functionGroup;
  }

  private async _submitMessage(payload: ApiMessagePayload) {
    await makeApiRequest<null, ApiSubmitMessage>(
      this._apiBaseUrl,
      this._apiKey,
      "POST",
      `/v1beta1/engine/chat/sessions/${this.sessionId}/submit`,
      {
        payload,
      },
    );
  }

  async start(objective: string, context?: string): Promise<void> {
    await this._submitMessage({
      type: "start",
      session_id: this.sessionId,
      bucket_id: this.functionGroup,
      message_id: v4().toString().toLowerCase(),
      objective,
      context: context ?? "",
    });
  }

  async submitTaskSelection(
    selection: TaskSelectionMessage,
    options: TaskOption[],
  ): Promise<void> {
    await this._submitMessage({
      type: "user_json",
      session_id: this.sessionId,
      message_id: v4().toString().toLowerCase(),
      referral_id: selection.id,
      user_json: {
        type: "task_list",
        selection: options.map((o) => o.key),
      },
    });
  }

  async submitResponse(query: AgentMessage, response: string): Promise<void> {
    await this._submitMessage({
      type: "user_message",
      session_id: this.sessionId,
      message_id: v4().toString().toLowerCase(),
      referral_id: query.id,
      user_message: response,
    });
  }

  async submitConfirmation(confirmation: ConfirmationMessage): Promise<void> {
    await this._submitMessage({
      type: "user_message",
      session_id: this.sessionId,
      message_id: v4().toString().toLowerCase(),
      referral_id: confirmation.id,
      user_message: "confirm",
    });
  }

  async getMessages(): Promise<Message[]> {
    let queryParams = "";
    if (this._messages.length > 0) {
      queryParams = `?last_message_id=${this._messages[this._messages.length - 1]!.message_id}`;
    }

    const response = await makeApiRequest<ApiNewMessages>(
      this._apiBaseUrl,
      this._apiKey,
      "GET",
      `/v1beta1/engine/chat/sessions/${this.sessionId}/new-messages${queryParams}`,
      null,
    );

    const newMessages: Message[] = [];
    for (const item of response.agent_response) {
      const message: ApiMessage = JSON.parse(item);

      console.log("RESP", message);
      if (isApiAgentJsonMessage(message)) {
        console.log("AGENT-JSON", message.agent_json);
        if (isApiTaskList(message.agent_json)) {
          console.log("TASK-LIST", message.agent_json.options);

          newMessages.push({
            id: message.message_id,
            type: "task_selection",
            timestamp: new Date(message.timestamp),
            text: message.agent_json.text,
            options: message.agent_json.options.map((o) => {
              return { key: o.key, title: o.value };
            }),
          });
        } else if (isApiContextJson(message.agent_json)) {
          console.log("CONTEXT-JSON", message.agent_json.context_json);

          newMessages.push({
            id: message.message_id,
            type: "confirmation",
            text: message.agent_json.text,
            timestamp: new Date(message.timestamp),
            model: message.agent_json.context_json.digest,
            payload: message.agent_json.context_json.args,
          });
        } else {
          console.log("UNKNOWN-JSON:", message);
        }
      } else if (isApiAgentInfoMessage(message)) {
        console.log("AGENT-JSON", message.agent_info);

        newMessages.push({
          id: message.message_id,
          type: "ai-engine",
          timestamp: new Date(message.timestamp),
          text: message.agent_info,
        });
      } else if (isApiAgentMessageMessage(message)) {
        console.log("AGENT-JSON", message.agent_message);

        newMessages.push({
          id: message.message_id,
          type: "agent",
          timestamp: new Date(message.timestamp),
          text: message.agent_message,
        });
      } else {
        console.log("UNKNOWN:", message);
      }

      // store the message (if we have not already seen it)
      if (!this._messageIds.has(message.message_id)) {
        this._messages.push(message);
        this._messageIds.add(message.message_id);
      }
    }

    return newMessages;
  }

  async delete(): Promise<void> {
    await makeApiRequest<void>(
      this._apiBaseUrl,
      this._apiKey,
      "DELETE",
      `/v1beta1/engine/chat/sessions/${this.sessionId}`,
      null,
    );
  }
}

export class AiEngine {
  private readonly _apiBaseUrl: string;
  private readonly _apiKey: string;

  constructor(apiKey: string, options?: { apiBaseUrl?: string }) {
    this._apiBaseUrl = options?.apiBaseUrl ?? defaultApiBaseUrl;
    this._apiKey = apiKey;
  }

  async createSession(): Promise<Session> {
    const functionGroup = "e504eabb-4bc7-458d-aa8c-7c3748f8952c";

    const response = await makeApiRequest<
      ApiNewSessionResponse,
      ApiNewSessionRequest
    >(this._apiBaseUrl, this._apiKey, "POST", "/v1beta1/engine/chat/sessions", {
      email: "",
      functionGroup,
      preferencesEnabled: false,
      requestModel: "talkative-01",
    });

    return new Session(
      this._apiBaseUrl,
      this._apiKey,
      response.session_id,
      functionGroup,
    );
  }
}
