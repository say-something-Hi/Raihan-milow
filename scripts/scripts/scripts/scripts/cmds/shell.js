const { exec } = require("child_process");

module.exports = {
  config: {
    name: "shell",
aliases: ["sh"],
    version: "1.0",
    author: "nexo_here",
    shortDescription: { en: "Run shell commands (admin only)" },
    longDescription: { en: "Execute shell commands and reply only with output" },
    category: "system",
    role: 2, // admin only
    guide: { en: "{pn} <command>" }
  },

  onStart: async function({ message, args }) {
    if (!args.length) return message.reply("Please provide a shell command.");

    const command = args.join(" ");

    exec(command, { timeout: 15000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) return message.reply(error.message || stderr || "Error occurred");

      let output = stdout || stderr || "No output";

      if (output.length > 1900) {
        output = output.slice(0, 1900) + "\n...Output truncated...";
      }

      return message.reply(output);
    });
  }
};
