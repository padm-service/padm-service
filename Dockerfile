FROM oven/bun:latest

WORKDIR /app

COPY . .

RUN bun i
RUN bun run build

EXPOSE 9999

ENTRYPOINT [ "bun", "run", "dist/src/index.js" ]
