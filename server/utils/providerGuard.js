function isProviderEnabled(provider) {
  switch (provider) {
    case "groq":
      return process.env.ENABLE_GROQ === "true";

    case "openrouter":
      return process.env.ENABLE_OPENROUTER === "true";

    default:
      return false;
  }
}

module.exports = { isProviderEnabled };
