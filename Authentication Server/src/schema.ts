import { gql } from 'apollo-server';

const typeDefs = gql`
  type User {
    id: ID!
    email: String!
    name: String
    phone: String
    failedAttempts: Int
  }

  type AuthPayload {
    token: String!
    user: User!
    id: ID
    email: String
    name: String
    phone: String
  }

  type Query {
    me: User
    users: [User!]!
  }

  type Mutation {
    signup(email: String!, password: String!, name: String, phone: String): AuthPayload!
    login(identifier: String!, password: String!): AuthPayload!
  }
`;

export default typeDefs;
