FROM oven/bun:1 as base

LABEL description="Offical docker image for Pylon services (Bun)"
LABEL org.opencontainers.image.source="https://github.com/getcronit/pylon"
LABEL maintainer="office@cronit.io"

WORKDIR /usr/src/pylon


# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev

COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM install AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# [optional] tests & build
ENV NODE_ENV=production

# Create .pylon folder (mkdir)
RUN mkdir -p .pylon
# RUN bun test
RUN bun run pylon build

# copy production dependencies and source code into final image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/pylon/.pylon .pylon
COPY --from=prerelease /usr/src/pylon/package.json .
COPY --from=prerelease /usr/src/pylon/src src  
COPY --from=prerelease /usr/src/pylon/tsconfig.json tsconfig.json

# run the app
USER bun
EXPOSE 3000/tcp
CMD [ "bun", "run", "/usr/src/pylon/.pylon/index.js" ]
