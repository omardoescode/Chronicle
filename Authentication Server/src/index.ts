import 'dotenv/config';
import { ApolloServer } from 'apollo-server';
import { makeExecutableSchema } from '@graphql-tools/schema';
import typeDefs from './schema';
import resolvers from './resolvers';
import { getUserFromToken } from './auth';

const schema = makeExecutableSchema({ typeDefs, resolvers });

async function start() {
  const server = new ApolloServer({
    schema,
    context: async ({ req }) => {
      const auth = req.headers?.authorization || '';
      const user = await getUserFromToken(auth);
      return { user };
    },
  });

  const { url } = await server.listen({ port: 4000 });
  console.log(`Server ready at ${url}`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
