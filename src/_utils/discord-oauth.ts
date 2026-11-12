// Server side only: built from env at render time and passed to islands.
export const discordOauthUrl = () =>
  `https://discord.com/oauth2/authorize?client_id=${import.meta.env.DISCORD_CLIENT_ID}&redirect_uri=${import.meta.env.DISCORD_REDIRECT}&scope=identify&response_type=code`;
