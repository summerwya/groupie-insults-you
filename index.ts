import { CacheType, Channel, ChatInputCommandInteraction, Client, Events, GatewayIntentBits, Guild, Interaction, MessageFlags, PartialGroupDMChannel, Partials, TextBasedChannel } from "discord.js";
import "dotenv/config";
import {readFileSync, writeFileSync, existsSync, lstatSync} from "fs";
import randomize from "./randomize";
import { a, enOrDis } from "./utilities";

// SECTION - Global Variables
const SERVER_CONFIGURATIONS_FILE: string = "data/serverConfigs.json";
const DEFAULT_CHANCE: number = 20;

const insults: string[] = readFileSync("data/insults.txt").toString().split("\n");
let serverConfigs: Record<string, {enable: boolean, chance: number, disableIn: string[] }> = {};

//!SECTION

// SECTION - Helpers
const saveServerConfigFile = (): void => writeFileSync(SERVER_CONFIGURATIONS_FILE, JSON.stringify(serverConfigs));
const getGuildId = (interaction: ChatInputCommandInteraction): string => interaction.guildId ?? interaction.channelId;
function addServerIfNotExists(guildId: string): void {
    if (guildId in serverConfigs) return;

    serverConfigs[guildId] = {
        enable: true,
        disableIn: [],
        chance: DEFAULT_CHANCE
    };
};
// !SECTION

// SECTION - Command Handlers
async function cmdSetChance(interaction: ChatInputCommandInteraction): Promise<void> {
    const newChance: number = interaction.options.getInteger("chance")!;

    serverConfigs[getGuildId(interaction)].chance = newChance;
    saveServerConfigFile();

    await interaction.reply({ content: `there's now a 1 in ${newChance} chance that i insult someone` });
}
async function cmdSetEnable(interaction: ChatInputCommandInteraction): Promise<void> {
    const enable: boolean = interaction.options.getBoolean("enable")!;
    
    serverConfigs[getGuildId(interaction)].enable = enable;
    saveServerConfigFile();

    await interaction.reply({ content: `you've **${enOrDis(enable)}abled** me`, flags: MessageFlags.Ephemeral });
}
async function cmdSetDisableHere(interaction: ChatInputCommandInteraction): Promise<void> {
    const disable: boolean = interaction.options.getBoolean("disable", false) ?? true;
    const channel = interaction.options.getChannel("channel", false) ?? interaction.channel!;
    const serverConfig = serverConfigs[getGuildId(interaction)];

    if (disable) serverConfig.disableIn.push(channel.id);
    else serverConfig.disableIn = serverConfig.disableIn.filter(channelId => channelId !== channel.id);
    saveServerConfigFile();

    await interaction.reply({ content: `You've ${enOrDis(!disable)}abled me in ${channel}` });
}
// !SECTION

// SECTION - Discord Client
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    partials: [Partials.Message]
});

client.on(Events.MessageCreate, async message => {
    addServerIfNotExists(message.guildId!);

    if (message.author.id === client.user!.id || !message.guildId || serverConfigs[message.guildId]?.enable === false || serverConfigs[message.guildId]?.disableIn.includes(message.channelId)) return;

    const serverConfig = serverConfigs[message.guildId]!;
    const roll: number = Math.floor(Math.random() * serverConfig.chance) + 1;

    try {
        if (roll === 1) await message.reply(randomize(insults[Math.floor(Math.random() * insults.length)]!));
    } catch(e) {}
});

client.on(Events.InteractionCreate, async (interaction: Interaction<CacheType>) => {
    if (!(interaction instanceof ChatInputCommandInteraction)) return;

    addServerIfNotExists(getGuildId(interaction));

    const commandName = interaction.commandName + a(interaction.options.getSubcommandGroup(false)) + a(interaction.options.getSubcommand(false));

    switch(commandName) {
        case "set-chance": cmdSetChance(interaction); break;
        case "set-enable": cmdSetEnable(interaction); break;
        case "set-disable-here": cmdSetDisableHere(interaction); break;
        default:
            await interaction.reply("Bruh, i don't even know that command.");
    }
});

client.on(Events.ClientReady, async client => {
    if (!process.env.ALIVE_CHANNEL) return;

    try {
        const channel = await client.channels.fetch(process.env.ALIVE_CHANNEL, {force: true});
        if (!channel?.isSendable()) return console.warn(`Can't send messages in ${channel}`);

        await channel.send("I'm alive, bitches.");
    } catch(e) {
        console.warn("Couldn't say that I was back", e);
    }
});

client.once(Events.ClientReady, readyClient => console.log(`Logged in as ${readyClient.user.tag}`));
//!SECTION

//SECTION - Initialization
async function main() {
    // Check if the configuration file exists, create one if not
    if (existsSync(SERVER_CONFIGURATIONS_FILE) && lstatSync(SERVER_CONFIGURATIONS_FILE).isFile()) {
        serverConfigs = JSON.parse(readFileSync(SERVER_CONFIGURATIONS_FILE).toString());
    } else saveServerConfigFile();

    await client.login(process.env.DISCORD_TOKEN);
}

main()