FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
# `npm ci` is stricter than `npm install` about platform-specific optional
# deps (WASM bindings pulled in by sharp/tailwind-oxide/unrs-resolver), which
# npm 11 records inconsistently across OSes. Rebuilding the tree from
# package.json keeps the build reproducible on linux/amd64.
RUN npm install --no-audit --no-fund

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
