/**
 * GQty AUTO-GENERATED CODE: PLEASE DO NOT MODIFY MANUALLY
 */

import { type ScalarsEnumsHash } from "gqty";

export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never;
    };
/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  Any: { input: any; output: any };
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.This scalar is serialized to a string in ISO 8601 format and parsed from a string in ISO 8601 format. */
  DateTimeISO: { input: any; output: any };
  File: { input: any; output: any };
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: any; output: any };
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: { input: any; output: any };
  /** Custom scalar that handles both integers and floats */
  Number: { input: number; output: number };
  /** Represents NULL values */
  Void: { input: any; output: any };
}

export enum EditorInput {
  UNKNOWN = "UNKNOWN",
  VSCODE = "VSCODE",
}

export const scalarsEnumsHash: ScalarsEnumsHash = {
  Any: true,
  Boolean: true,
  DateTimeISO: true,
  EditorInput: true,
  File: true,
  JSON: true,
  JSONObject: true,
  Number: true,
  String: true,
  Void: true,
};
export const generatedSchema = {
  AppResponse: {
    __typename: { __type: "String!" },
    data: { __type: "Data" },
    errors: { __type: "[String!]!" },
    success: { __type: "Boolean!" },
  },
  AppResponse_1: {
    __typename: { __type: "String!" },
    data: { __type: "Data_1" },
    errors: { __type: "[String!]!" },
    success: { __type: "Boolean!" },
  },
  AppResponse_2: {
    __typename: { __type: "String!" },
    data: { __type: "Data_2" },
    errors: { __type: "[String!]!" },
    success: { __type: "Boolean!" },
  },
  AppResponse_3: {
    __typename: { __type: "String!" },
    data: { __type: "Data_3" },
    errors: { __type: "[String!]!" },
    success: { __type: "Boolean!" },
  },
  Data: {
    __typename: { __type: "String!" },
    email: { __type: "String!" },
    name: { __type: "String!" },
    user_id: { __type: "Number!" },
  },
  Data_1: {
    __typename: { __type: "String!" },
    token: { __type: "String!" },
    user: { __type: "User!" },
  },
  Data_2: {
    __typename: { __type: "String!" },
    token: { __type: "String!" },
    user: { __type: "User!" },
  },
  Data_3: { __typename: { __type: "String!" }, api_key: { __type: "String!" } },
  SetApiMetadata: {
    __typename: { __type: "String!" },
    errors: { __type: "[String!]!" },
    success: { __type: "Boolean!" },
  },
  User: {
    __typename: { __type: "String!" },
    email: { __type: "String!" },
    name: { __type: "String!" },
    user_id: { __type: "Number!" },
  },
  mutation: {
    __typename: { __type: "String!" },
    generateApiKey: { __type: "AppResponse_3!" },
    login: {
      __type: "AppResponse_1!",
      __args: { email: "String!", password: "String!" },
    },
    register: {
      __type: "AppResponse_2!",
      __args: {
        email: "String!",
        name: "String!",
        password: "String!",
        timezone: "Number!",
      },
    },
    setApiMetadata: {
      __type: "SetApiMetadata!",
      __args: {
        api_key: "String!",
        editor: "EditorInput!",
        machine_name: "String!",
        os: "String!",
      },
    },
  },
  query: {
    __typename: { __type: "String!" },
    hello: { __type: "AppResponse!" },
  },
  subscription: {},
} as const;

export interface AppResponse {
  __typename?: "AppResponse";
  data?: Maybe<Data>;
  errors: Array<ScalarsEnums["String"]>;
  success: ScalarsEnums["Boolean"];
}

export interface AppResponse_1 {
  __typename?: "AppResponse_1";
  data?: Maybe<Data_1>;
  errors: Array<ScalarsEnums["String"]>;
  success: ScalarsEnums["Boolean"];
}

export interface AppResponse_2 {
  __typename?: "AppResponse_2";
  data?: Maybe<Data_2>;
  errors: Array<ScalarsEnums["String"]>;
  success: ScalarsEnums["Boolean"];
}

export interface AppResponse_3 {
  __typename?: "AppResponse_3";
  data?: Maybe<Data_3>;
  errors: Array<ScalarsEnums["String"]>;
  success: ScalarsEnums["Boolean"];
}

export interface Data {
  __typename?: "Data";
  email: ScalarsEnums["String"];
  name: ScalarsEnums["String"];
  user_id: ScalarsEnums["Number"];
}

export interface Data_1 {
  __typename?: "Data_1";
  token: ScalarsEnums["String"];
  user: User;
}

export interface Data_2 {
  __typename?: "Data_2";
  token: ScalarsEnums["String"];
  user: User;
}

export interface Data_3 {
  __typename?: "Data_3";
  api_key: ScalarsEnums["String"];
}

export interface SetApiMetadata {
  __typename?: "SetApiMetadata";
  errors: Array<ScalarsEnums["String"]>;
  success: ScalarsEnums["Boolean"];
}

export interface User {
  __typename?: "User";
  email: ScalarsEnums["String"];
  name: ScalarsEnums["String"];
  user_id: ScalarsEnums["Number"];
}

export interface Mutation {
  __typename?: "Mutation";
  generateApiKey: AppResponse_3;
  login: (args: {
    email: ScalarsEnums["String"];
    password: ScalarsEnums["String"];
  }) => AppResponse_1;
  register: (args: {
    email: ScalarsEnums["String"];
    name: ScalarsEnums["String"];
    password: ScalarsEnums["String"];
    timezone: ScalarsEnums["Number"];
  }) => AppResponse_2;
  setApiMetadata: (args: {
    api_key: ScalarsEnums["String"];
    editor: EditorInput;
    machine_name: ScalarsEnums["String"];
    os: ScalarsEnums["String"];
  }) => SetApiMetadata;
}

export interface Query {
  __typename?: "Query";
  hello: AppResponse;
}

export interface Subscription {
  __typename?: "Subscription";
}

export interface GeneratedSchema {
  query: Query;
  mutation: Mutation;
  subscription: Subscription;
}

export type ScalarsEnums = {
  [Key in keyof Scalars]: Scalars[Key] extends { output: unknown }
    ? Scalars[Key]["output"]
    : never;
} & {
  EditorInput: EditorInput;
};
