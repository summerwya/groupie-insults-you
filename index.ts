import {
    ChatInputCommandInteraction,
    Client,
    Events,
    GatewayIntentBits,
    Interaction,
    Message,
    MessageFlags,
    MessagePayload,
    MessageReplyOptions,
    Partials
} from "discord.js";
import "dotenv/config";
import {existsSync, lstatSync, readFileSync, writeFileSync} from "fs";
import randomize from "./randomize";
import {a, awaitSafe, enOrDis, pick} from "./utilities";
import {BotActions, ServerConfiguration} from "./types";

// SECTION - Global Variables
const SERVER_CONFIGURATIONS_FILE: string = "data/serverConfigs.json";

const DEFAULT_INSULT_CHANCE: number = 20;
const DEFAULT_REACTION_CHANCE: number = 20;
const DEFAULT_TIMEOUT_CHANCE: number = 500;
const DEFAULT_NICKNAME_CHANGE_CHANCE: number = 50;
const DEFAULT_MUTE_MEMBER_CHANCE: number = 200;

const INSULT_LIST: string[] = readFileSync("data/insults.txt").toString().split("\n").filter(content => !!content);
const REACTION_EMOJI_LIST: string[] = readFileSync("data/emojis.txt").toString().split(/\r?\n/g).filter(content => !!content);
const NICKNAME_LIST: string[] = readFileSync("data/nicknames.txt").toString().split("\n").filter(content => !!content);
const TIMEOUT_DURATION: number = 10000; // Duration in ms

let serverConfigs: Record<string, ServerConfiguration> = {};
//!SECTION

// SECTION - Helpers
const saveServerConfigFile = (): void => writeFileSync(SERVER_CONFIGURATIONS_FILE, JSON.stringify(serverConfigs));
const getGuildId = (interaction: ChatInputCommandInteraction): string => interaction.guildId ?? interaction.channelId;
function addServerIfNotExists(guildId: string): void {
    if (guildId in serverConfigs) return;

    serverConfigs[guildId] = {
        enable: {
            global: true,
            insults: true,
            reactions: true,
            timeouts: false,
            nicknameChanger: true,
            muteMembers: true
        },
        chances: {
            insults: DEFAULT_INSULT_CHANCE,
            reactions: DEFAULT_REACTION_CHANCE,
            timeouts: DEFAULT_TIMEOUT_CHANCE,
            nicknameChanger: DEFAULT_NICKNAME_CHANGE_CHANCE,
            muteMembers: DEFAULT_MUTE_MEMBER_CHANCE
        },
        disable: {
            insults: [],
            reactions: [],
            timeouts: [],
            nicknameChanger: [],
            muteMembers: []
        },
        onlyInteractWithThisRole: null
    };
}
// !SECTION

// SECTION - Utilities
async function sendReply(message: Message, content: string | MessagePayload | MessageReplyOptions) {
    try {
        await message.reply(content);
    } catch(e) {
        console.warn("Couldn't send message", e);
    }
}
// !SECTION

// SECTION - Command Handlers
async function cmdSetChance(interaction: ChatInputCommandInteraction): Promise<void> {
    const action: string | BotActions = interaction.options.getString("action", true);
    const chance: number = interaction.options.getInteger("chance", true);

    serverConfigs[getGuildId(interaction)].chances[action] = chance;
    saveServerConfigFile();

    await interaction.reply({ content: `The chance of "${action}" happening is now 1 in ${chance}` });
}
async function cmdSetGlobal(interaction: ChatInputCommandInteraction): Promise<void> {
    const action: string | BotActions = interaction.options.getString("action") ?? "global";
    const enable: boolean = interaction.options.getBoolean("enable") ?? true;

    serverConfigs[getGuildId(interaction)].enable[action] = enable;
    saveServerConfigFile();

    await interaction.reply({ content: `You've **${enOrDis(enable)}abled** ${action} globally`, flags: MessageFlags.Ephemeral });
}
async function cmdSetDisableInHere(interaction: ChatInputCommandInteraction): Promise<void> {
   const action: string | BotActions = interaction.options.getString("action", true);
   const channel = interaction.options.getChannel("channel") || interaction.channel!;
   const disable: boolean = interaction.options.getBoolean("disable") ?? true;

   const serverConfig: ServerConfiguration = serverConfigs[getGuildId(interaction)];
   if (action === "global") {
       for(const key in serverConfig.disable) {
           if (disable) serverConfig.disable[key].push(channel.id);
           else serverConfig.disable[key] = serverConfig.disable[key].filter(id => id !== channel.id);
       }
   } else {
       if (disable) serverConfig.disable[action].push(channel.id);
       else serverConfig.disable[action] = serverConfig.disable[action].filter(id => id !== channel.id);
   }
   saveServerConfigFile();

   await interaction.reply({ content: action === "global" ? `Everything has been ${enOrDis(!disable)}abled in ${channel}` : `The action ${action} has been ${enOrDis(!disable)}abled in ${channel}`});
}
async function cmdSetOnlyInteractWith(interaction: ChatInputCommandInteraction): Promise<void> {
    const role = interaction.options.getRole("role")!;

    serverConfigs[getGuildId(interaction)].onlyInteractWithThisRole = role.id;
    saveServerConfigFile();

    await interaction.reply({ content: `I'll only interact with members with the ${role} from now on`, flags: MessageFlags.Ephemeral });
}
// !SECTION

// SECTION - Discord Client
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    partials: [Partials.Message]
});

client.on(Events.MessageCreate, async message => {
    if (!message.guildId) return;
    addServerIfNotExists(message.guildId);

    // Ignore message if it's the bot's message, not from a guild, or disabled in the guild
    if (message.author.id === client.user!.id || !message.guildId || serverConfigs[message.guildId].enable.global === false) return;

    const serverConfig: ServerConfiguration = serverConfigs[message.guildId]!;
    const isEnabled = (action: BotActions) => serverConfig.disable[action].indexOf(message.channelId) === -1;

    // Check if there's a specific role that the bot should only interact with, if yes and the message author doesn't have that role, then just ignore
    if (serverConfig.onlyInteractWithThisRole && !message.member?.roles.cache.has(serverConfig.onlyInteractWithThisRole)) return;

    if (isEnabled("insults") && Math.floor(Math.random() * serverConfig.chances.insults) === 1) await sendReply(message, randomize(pick(INSULT_LIST)));
    if (isEnabled("reactions") && Math.floor(Math.random() * serverConfig.chances.reactions) === 1) {
        await awaitSafe(message.react(pick(REACTION_EMOJI_LIST)), "Couldn't react to message!");
    }
    if (isEnabled("timeouts") && Math.floor(Math.random() * serverConfig.chances.timeouts) === 1) {
        try {
            await message.member?.timeout(TIMEOUT_DURATION);
            await message.channel.send(`Timed out ${message.author} for being a little too annoying`);
        } catch(e) {
            await awaitSafe(message.reply(`Btw, I wanted to time you out but I couldn't, so ${randomize(pick(INSULT_LIST))}`), "Couldn't tell them that I wanted to mute them");
        }
    }
    if (isEnabled("nicknameChanger") && Math.floor(Math.random() * serverConfig.chances.nicknameChanger) === 1) {
        await awaitSafe(message.member?.setNickname(pick(NICKNAME_LIST)), "Couldn't change the nickname of this person");
    }
    // TODO - execute this every minute that the user passes while in VC
    if (isEnabled("muteMembers") && Math.floor(Math.random() * serverConfig.chances.muteMembers) === 1) {

    }
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!(interaction instanceof ChatInputCommandInteraction)) return;

    addServerIfNotExists(getGuildId(interaction));

    const commandName = interaction.commandName + a(interaction.options.getSubcommandGroup(false)) + a(interaction.options.getSubcommand(false));

    switch(commandName) {
        case "set-global": await cmdSetGlobal(interaction); break;
        case "set-disable-in-here": await cmdSetDisableInHere(interaction); break;
        case "set-chance": await cmdSetChance(interaction); break;
        case "set-only-interact-with": await cmdSetOnlyInteractWith(interaction);
    }
});

client.once(Events.ClientReady, async client => {
    if (!process.env.ALIVE_CHANNEL) return;

    try {
        const channel = await client.channels.fetch(process.env.ALIVE_CHANNEL, {force: true});
        if (!channel?.isSendable()) return console.warn(`Can't send messages in ${channel}`);

        await channel.send("I'm alive");
    } catch(e) {
        console.warn("Couldn't say that I was back", e);
    }
});

client.once(Events.ClientReady, readyClient => console.log(`Logged in as ${readyClient.user.tag}`));
//!SECTION

//SECTION - Initialization
// Check if the configuration file exists, create one if not
if (existsSync(SERVER_CONFIGURATIONS_FILE) && lstatSync(SERVER_CONFIGURATIONS_FILE).isFile()) {
    serverConfigs = JSON.parse(readFileSync(SERVER_CONFIGURATIONS_FILE).toString());
} else saveServerConfigFile();

client.login(process.env.DISCORD_TOKEN).then(() => {});

//!SECTION