const utils = require("../utils");
const threads = require("../data/threads");

module.exports = ({ bot, knex, config, commands }) => {
  commands.addInboxServerCommand("newthread", `<userId:userId> [mode:string=${config.defaultNewThreadMode}]`, async (msg, args, thread) => {
    const user = bot.users.get(args.userId) || await bot.getRESTUser(args.userId).catch(() => null);
    if (! user) {
      utils.postSystemMessageWithFallback(msg.channel, thread, "User not found!");
      return;
    }

    if (user.bot) {
      utils.postSystemMessageWithFallback(msg.channel, thread, "Can't create a thread for a bot");
      return;
    }

    if (config.threadsInsteadOfChannels) {
      if (!["public", "private"].includes(args.mode)) {
        utils.postSystemMessageWithFallback(msg.channel, thread, "The mode should be public or private.");
        return;
      }
      if (!utils.getInboxGuild().features.includes("PRIVATE_THREADS") && args.mode === "private") {
        utils.postSystemMessageWithFallback(msg.channel, thread, "The guild does not have support for private threads. (Did you try boosting? They come discounted with Nitro!)");
        return;
      }
    }

    const existingThread = await threads.findOpenThreadByUserId(user.id);
    if (existingThread) {
      utils.postSystemMessageWithFallback(msg.channel, thread, `Cannot create a new thread; there is another open thread with this user: <#${existingThread.channel_id}>`);
      return;
    }

    const createdThread = await threads.createNewThreadForUser(user, {
      quiet: true,
      ignoreRequirements: true,
      ignoreHooks: true,
      source: "command",
      private: args.mode === "private",
    });

    createdThread.postSystemMessage(`Thread was opened by ${msg.author.username}#${msg.author.discriminator}`);

    msg.channel.createMessage(`Thread opened: <#${createdThread.channel_id}>`);
  });
};
