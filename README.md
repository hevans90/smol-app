![smol-app-logo](public/smol-logo.svg)

- install `nvm` and then run `nvm use` (alternatively manually install node.js >= 18.16.0)
- install pnpm: https://pnpm.io/installation
- install the netlify CLI globally so it's on your path: `pnpm install --global netlify-cli`
- run `ntl` to check it's working
- run `ntl init`, and you should end up linking the netlify site with our repo:
- [message Ray! on discord to get a .env file](https://discordapp.com/users/147766022336675841)
- install the recommended workspace VSCode extensions to have the best time (if using VS Code)

```
Directory Linked

Admin url: https://app.netlify.com/sites/smol-app
Site url:  https://smol-app.netlify.app
```

---

Now in one terminal run: `ntl dev` to start your dev server.

And in another run `pnpm graphql:generate` to watch changes to graphql files.

---

## Working with our backends

We have two distinctly different technologies being used for backend functionality here:

- [Netlify functions](https://www.netlify.com/products/functions/) - these are serverless functions used exclusively for our PoE & Discord OAuth2 flows. They can be used to crreate long-running background tasks, which may be useful later.

- [Hasura](https://hasura.io/) - an [open source](https://github.com/hasura/graphql-engine) SaaS Haskell server that sits on top of a postgres database and manages permissions using JWT auth to all our data. This tool is magic, it creates CRUD endpoints for us so we don't have to!

---

### Netlify Functions

Found here: [`./netlify/functions`](./netlify/functions/)

These are run locally when running `ntl dev` and will hot reload when the files change. A note here that the POE auth stuff won't work locally as GGG don't allow local redirect URIs... but you can just log in via our deployed app and copy the local storage values to your local app if you wanna test stuff.

---

### Hasura

I haven't (yet) set this up to run locally because it requires a docker setup which makes local dev more complex for the average andy. For now we are developing against a single deployed instance which is hosted on fly.io:

- [deployed hasura console](https://smol-hasura.fly.dev/console)
- [dashboard](https://https://fly.io/dashboard/smol-app/)

If you want to change tables/permissions etc [just talk to Ray! on discord and he will give you everything you need](<(https://discordapp.com/users/147766022336675841)>).

## Local Data dump from Hasura

```bash
curl -H "X-Hasura-Role: admin" -H "Content-Type: application/json" -H "X-Hasura-Admin-Secret: <secret>" \
  --request POST \
  --data '{"opts": ["-O", "-x", "--schema", "public"], "clean_output": true, "source": "default"}' \
  https://smol-hasura.fly.dev/v1alpha1/pg_dump
```
