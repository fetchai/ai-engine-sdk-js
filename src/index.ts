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
  isApiStopMessage,
  isApiTaskList,
} from "./types/api";

import {
  AgentMessage,
  ConfirmationMessage,
  Message,
  TaskOption,
  TaskSelectionMessage,
} from "./types/messages";
import {
  CustomModel,
  DefaultModelId,
  DefaultModelIds,
  getModelId,
  getModelName,
  KnownModelId,
} from "@fetchai/ai-engine-sdk/types/models";

export * from "./types/messages";

export interface CreditBalance {
  totalCredits: number;
  usedCredits: number;
  availableCredits: number;
}

export interface Model {
  id: string;
  name: string;
  credits: number;
}

export interface FunctionGroup {
  uuid: string;
  name: string;
  isPrivate: boolean;
}

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

  return await response.json();
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

  async rejectConfirmation(
    confirmation: ConfirmationMessage,
    reason: string,
  ): Promise<void> {
    await this._submitMessage({
      type: "user_message",
      session_id: this.sessionId,
      message_id: v4().toString().toLowerCase(),
      referral_id: confirmation.id,
      user_message: reason,
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

      // it is possible that a message may be delivered multiple times, therefore we need to filter out duplicates
      if (this._messageIds.has(message.message_id)) {
        continue;
      }

      if (isApiAgentJsonMessage(message)) {
        if (isApiTaskList(message.agent_json)) {
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
          newMessages.push({
            id: message.message_id,
            type: "confirmation",
            text: message.agent_json.text,
            timestamp: new Date(message.timestamp),
            model: message.agent_json.context_json.digest,
            payload: message.agent_json.context_json.args,
          });
        } else {
          console.error("UNKNOWN-JSON:", message);
        }
      } else if (isApiAgentInfoMessage(message)) {
        newMessages.push({
          id: message.message_id,
          type: "ai-engine",
          timestamp: new Date(message.timestamp),
          text: message.agent_info,
        });
      } else if (isApiAgentMessageMessage(message)) {
        newMessages.push({
          id: message.message_id,
          type: "agent",
          timestamp: new Date(message.timestamp),
          text: message.agent_message,
        });
      } else if (isApiStopMessage(message)) {
        newMessages.push({
          id: message.message_id,
          timestamp: new Date(message.timestamp),
          type: "stop",
        });
      } else {
        console.error("UNKNOWN:", message);
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

  async execute_function(functionIds: string[], objective: string, context: string): Promise<void> {
    // You should not start a session before executing this one
    await this._submitMessage({
      type: "execute_functions",
      functions: functionIds,
      objective: objective,
      context: context,
    });
  }

}
export class AiEngine {
  private readonly _apiBaseUrl: string;
  private readonly _apiKey: string;

  constructor(apiKey: string, options?: { apiBaseUrl?: string }) {
    this._apiBaseUrl = options?.apiBaseUrl ?? defaultApiBaseUrl;
    this._apiKey = apiKey;
  }

  async getFunctionGroups(): Promise<FunctionGroup[]> {
    const [publicGroups, privateGroups] = await Promise.all([
      this.getPublicFunctionGroups(),
      this.getPrivateFunctionGroups(),
    ]);

    return [...privateGroups, ...publicGroups];
  }

  private async getPublicFunctionGroups(): Promise<FunctionGroup[]> {
    return await makeApiRequest<FunctionGroup[]>(
      this._apiBaseUrl,
      this._apiKey,
      "GET",
      "/v1beta1/function-groups/public/",
      null,
    );
  }

  private async getPrivateFunctionGroups(): Promise<FunctionGroup[]> {
    return await makeApiRequest<FunctionGroup[]>(
      this._apiBaseUrl,
      this._apiKey,
      "GET",
      "/v1beta1/function-groups/",
      null,
    );
  }

  async getCredits(): Promise<CreditBalance> {
    const r = await makeApiRequest<{
      total_credit: number;
      used_credit: number;
      available_credit: number;
    }>(
      this._apiBaseUrl,
      this._apiKey,
      "GET",
      "/v1beta1/engine/credit/info",
      null,
    );

    return {
      totalCredits: r.total_credit,
      usedCredits: r.used_credit,
      availableCredits: r.available_credit,
    };
  }

  async getModels(): Promise<Model[]> {
    const pendingCredits: Promise<number>[] = [];

    const models: Model[] = [];
    for (const modelId of DefaultModelIds) {
      pendingCredits.push(this.getModelCredits(modelId));

      models.push({
        id: modelId,
        name: getModelName(modelId),
        credits: 0,
      });
    }

    const credits = await Promise.all(pendingCredits);

    // sanity check
    if (credits.length !== models.length) {
      throw new Error("Credit count mismatch");
    }

    for (let i = 0; i < models.length; i++) {
      models[i]!.credits = credits[i]!;
    }

    return models;
  }

  async getModelCredits(model: KnownModelId | CustomModel): Promise<number> {
    const modelId = getModelId(model);

    const r = await makeApiRequest<{ model_tokens: Record<string, number> }>(
      this._apiBaseUrl,
      this._apiKey,
      "GET",
      `/v1beta1/engine/credit/remaining_tokens?models=${modelId}`,
      null,
    );

    return r.model_tokens[modelId] ?? 0;
  }

  async createSession(
    functionGroup: string,
    opts?: {
      email?: string;
      model?: KnownModelId | string;
    },
  ): Promise<Session> {
    const response = await makeApiRequest<
      ApiNewSessionResponse,
      ApiNewSessionRequest
    >(this._apiBaseUrl, this._apiKey, "POST", "/v1beta1/engine/chat/sessions", {
      email: opts?.email ?? "",
      functionGroup,
      preferencesEnabled: false,
      requestModel: opts?.model ?? DefaultModelId,
    });

    return new Session(
      this._apiBaseUrl,
      this._apiKey,
      response.session_id,
      functionGroup,
    );
  }
}
