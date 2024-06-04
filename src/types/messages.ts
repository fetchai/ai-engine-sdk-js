export interface BaseMessage {
  id: string;
  type: string;
  timestamp: Date;
}

export interface TaskOption {
  key: number;
  title: string;
}

export interface TaskSelectionMessage extends BaseMessage {
  type: "task_selection";
  text: string;
  options: TaskOption[];
}

export interface AiEngineMessage extends BaseMessage {
  type: "ai-engine";
  text: string;
}

export interface AgentMessage extends BaseMessage {
  type: "agent";
  text: string;
}

export interface ConfirmationMessage extends BaseMessage {
  type: "confirmation";
  text: string;
  model: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any>;
}

export interface StopMessage extends BaseMessage {
  type: "stop";
}

export type Message =
  | TaskSelectionMessage
  | AgentMessage
  | AiEngineMessage
  | ConfirmationMessage
  | StopMessage;

export const isTaskSelectionMessage = (m: Message): m is TaskSelectionMessage =>
  m.type === "task_selection";

export const isAiEngineMessage = (m: Message): m is AiEngineMessage =>
  m.type === "ai-engine";

export const isAgentMessage = (m: Message): m is AgentMessage =>
  m.type === "agent";

export const isConfirmationMessage = (m: Message): m is ConfirmationMessage =>
  m.type === "confirmation";

export const isStopMessage = (m: Message): m is StopMessage =>
  m.type === "stop";
