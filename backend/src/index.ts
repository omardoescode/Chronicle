import { app } from "@getcronit/pylon";
import * as auth from "@/auth/service";
import * as api from "@/api/service";
import {
  AppResponse,
  ErrorResponse,
  errToResponse,
  SuccessResponse,
} from "./utils/responses";
import { validateTimezone } from "./utils/validation";
import { type User } from "./auth/validation";
import { authorized } from "./auth/middleware";
import { AppError } from "./utils/error";
import { ApiKey, Editor } from "./api/validation";
import { withApi } from "./api/middleware";
import {
  ProjectSessionInput,
  ProjectSessionSchema,
} from "./heartbeat/validation";
import * as heartbeat from "./heartbeat/service";
import OutboxProcessor from "./workers/OutboxProcessor";
import env from "./utils/env";
import { Kafka } from "kafkajs";
import pool from "./pool";

console.log("kafka is on", env.KAFKA_URL);
const kafka = new Kafka({
  clientId: "backend",
  brokers: [env.KAFKA_URL],
});

const outbox_processor = new OutboxProcessor(
  "enriched_file_segments",
  kafka,
  pool,
  1000
);
outbox_processor.start();

export const graphql = {
  Query: {
    hello: authorized(async (user) => SuccessResponse({ ...user })),
  },
  Mutation: {
    async login(
      email: string,
      password: string
    ): Promise<AppResponse<{ token: string; user: User }>> {
      const data = await auth.login(email, password);
      if (data instanceof AppError) return errToResponse(data);
      return SuccessResponse(data);
    },

    async register(
      name: string,
      email: string,
      password: string,
      timezone: number
    ): Promise<AppResponse<{ token: string; user: User }>> {
      const timezoneError = validateTimezone(timezone);
      if (timezoneError) return ErrorResponse([timezoneError]);

      const data = await auth.register({
        name,
        email,
        password,
        timezone,
      });

      if (data instanceof AppError) return errToResponse(data);
      return SuccessResponse(data);
    },
    generateApiKey: authorized(
      async (user): Promise<AppResponse<{ api_key: string }>> => {
        const api_key = await api.generateApiKey(user.user_id);
        if (api_key instanceof AppError) return errToResponse(api_key);
        return SuccessResponse({ api_key });
      }
    ),
    async setApiMetadata(
      api_key: ApiKey,
      editor: Editor,
      machine_name: string,
      os: string
    ) {
      const res = await api.setApiMetadata(api_key, editor, machine_name, os);
      if (res instanceof AppError) return errToResponse(res);
      return SuccessResponse<void>();
    },
    heartbeat: withApi(
      async (user: User, api: ApiKey, session: ProjectSessionInput) => {
        const data = await heartbeat.heartbeat(
          user,
          api,
          ProjectSessionSchema.parse(session)
        );
        if (data instanceof AppError) return errToResponse(data);
        return SuccessResponse<void>();
      }
    ),
  },
};

export default app;
