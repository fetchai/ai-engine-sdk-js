export interface ApiNewSessionRequest {
  email: string;
  functionGroup: string | null;
  preferencesEnabled: boolean;
  requestModel: string;
}

export interface ApiNewSessionResponse {
  session_id: string;
  user: string;
  num_messages: number;
  last_message_timestamp: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any[];
  // bucket_id: string | null;
  function_group: string;
  model: string;
  remaining_tokens: number;
  status: string | null;
  preferences_enabled: boolean;
}

export interface ApiStartMessage {
  type: "start";
  session_id: string;
  objective: string;
  message_id: string;
  context: string;
  bucket_id: string;
}

export interface ApiSelectedTasks {
  type: "task_list";
  selection: number[];
}

export interface ApiUserJsonMessage {
  type: "user_json";
  session_id: string;
  message_id: string;
  referral_id: string;
  user_json: ApiSelectedTasks;
}

export interface ApiUserMessageMessage {
  type: "user_message";
  session_id: string;
  message_id: string;
  referral_id: string;
  user_message: string;
}

export type ApiMessagePayload =
  | ApiStartMessage
  | ApiUserJsonMessage
  | ApiUserMessageMessage;

export interface ApiSubmitMessage {
  payload: ApiMessagePayload;
}

export interface ApiNewMessages {
  agent_response: string[];
}

export interface ApiAgentJson {
  type: string;
}

export interface ApiOption {
  key: number;
  value: string;
}

export interface ApiTaskList extends ApiAgentJson {
  type: "task_list";
  text: string;
  options: ApiOption[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context_json: any | null;
}

export interface ApiContextJson extends ApiAgentJson {
  type: "context_json";
  text: string;
  options: null;
  context_json: {
    digest: string;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: Record<string, any>;
  };
}

export const isApiTaskList = (obj: ApiAgentJson): obj is ApiTaskList => {
  return obj.type === "task_list";
};

export const isApiContextJson = (obj: ApiAgentJson): obj is ApiContextJson => {
  return obj.type === "context_json";
};

export interface ApiAgentJsonMessage {
  session_id: string | null;
  message_id: string;
  timestamp: string;
  score: number;
  referral_id: string | null;
  type: "agent_json";
  agent_json: ApiAgentJson | ApiContextJson;
}

export interface ApiAgentInfoMessage {
  session_id: string | null;
  message_id: string;
  timestamp: string;
  score: number;
  referral_id: string | null;
  type: "agent_info";
  agent_info: string;
}

export interface ApiAgentMessageMessage {
  session_id: string | null;
  message_id: string;
  timestamp: string;
  score: number;
  referral_id: string | null;
  type: "agent_message";
  agent_message: string;
}

export interface ApiStopMessage {
  type: "stop";
  session_id: string;
  message_id: string;
  timestamp: string;
  score: number;
  referral_id: string;
}

export type ApiMessage =
  | ApiAgentJsonMessage
  | ApiStopMessage
  | ApiAgentInfoMessage
  | ApiAgentMessageMessage;

export const isApiAgentJsonMessage = (
  m: ApiMessage,
): m is ApiAgentJsonMessage => m.type === "agent_json";

export const isApiAgentInfoMessage = (
  m: ApiMessage,
): m is ApiAgentInfoMessage => m.type === "agent_info";

export const isApiAgentMessageMessage = (
  m: ApiMessage,
): m is ApiAgentMessageMessage => m.type === "agent_message";

export const isApiStopMessage = (m: ApiMessage): m is ApiStopMessage =>
  m.type === "stop";
