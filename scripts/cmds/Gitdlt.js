const axios = require('axios');
const path = require('path');

module.exports = {
  config: {
    name: "gitdelete",
    version: "1.0",
    author: "xnil",
    countDown: 5,
    role: 2,
    shortDescription: "Delete a file from GitHub repo",
    longDescription: "Delete a JavaScript file from your GitHub repository using filename.",
    category: "utility",
    guide: {
      en: "Usage:\ngitdelete <file name>.js"
    }
  },

  onStart: async function ({ api, message, args }) {
    const fileName = args[0];

    if (!fileName) {
      return message.reply({
        body: `⚠️ Missing Argument!\nUse: gitdelete <file name>.js`
      });
    }

    if (!fileName.endsWith('.js')) {
      return message.reply({
        body: `❌ Invalid File Name!\nOnly *.js files are allowed.`
      });
    }

    const githubToken = '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';
    const owner = 'Raihan9099';
    const repo = 'hydrocarbons';
    const branch = 'main';
    const filePath = `scripts/cmds/${fileName}`;

    try {
      // Get the current file's SHA
      const { data: fileData } = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
        headers: {
          Authorization: `token ${githubToken}`
        }
      });

      const fileSha = fileData.sha;

      // Delete the file
      await axios.delete(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
        headers: {
          Authorization: `token ${githubToken}`
        },
        data: {
          message: `Delete ${fileName}`,
          sha: fileSha,
          branch: branch
        }
      });

      message.reply({
        body: `🗑️ File deleted successfully!

📂 File: ${fileName}
📁 Path: scripts/cmds/${fileName}`
      });

    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      message.reply({
        body: `❌ Failed to delete file!\nError: ${errorMsg}`
      });
    }
  }
};
