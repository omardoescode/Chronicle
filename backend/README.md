# Backend

This backend will be responsible for maintaining a database where all user records, and using *batch processing* (hopefully, I wanna try it :) ) to make statistics on this data to create useful stats for the users

# Development
The folder structure is straightforward. 
- utils: for basic use-everywhere functions
- services: for main logic of the system
- db: the only place where usage of databases is a must
- init.ts: a script to initialize the scheme in the database
- index.ts: the main graphql endpoint, where it calls functions from the services


To develop
1. Copy the `.env.example` to `.env` as is (no need to change any value now)
2. Run the docker instance
```sh
docker compose up
```

3. Run the project
```sh
bun run dev 
#or 
npm run dev
```

4. Work on your branch
5. Create a pull request after finishing your work
6. Wait for me to review your code
