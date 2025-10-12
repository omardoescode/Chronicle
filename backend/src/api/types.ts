import { Editor } from "./validation";

export interface ApiMetadata {
  value: string;
  user_id: number;
  editor: Editor;
  machine: {
    machine_id: number;
    name: string;
    os: string;
  };
}
