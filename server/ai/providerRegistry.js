function isEnabled(envValue){
     return String(envValue).toLowerCase() === "true";
}

const providerRegistry = [
    {
        name:"groq",
        enabled:isEnabled(process.env.ENABLE_GROQ??"true"),
        freeTier:true
    },
     {
    name: "openrouter",
    enabled: isEnabled(process.env.ENABLE_OPENROUTER ?? "true"),
    freeTier: true
  }
];

module.exports = providerRegistry.filter(p=>p.enabled);