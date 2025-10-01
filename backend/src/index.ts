import { app } from "@getcronit/pylon";
import init from "./init";

await init()
  .then(() => {
    console.log("Initialize the database");
  })
  .catch((err) => {
    console.error("Failed to initialize the database");
    console.error(`Error: ${err}`);
    process.exit(1);
  });

export const graphql = {
  Query: {
    hello: () => {
      return "Hello, world!";
    },
  },
  Mutation: {},
};

export default app;
