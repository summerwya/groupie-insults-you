import {
    InteractionContextType,
    PermissionFlagsBits,
    RESTPostAPIApplicationCommandsJSONBody,
    SlashCommandBuilder,
} from "discord.js";
import { REST, Routes } from 'discord.js';

async function main() {
    const commands: RESTPostAPIApplicationCommandsJSONBody[] = [
        new SlashCommandBuilder()
            .setName("set")
            .setDescription("Set settings")
            .setContexts([InteractionContextType.PrivateChannel, InteractionContextType.Guild])
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator | PermissionFlagsBits.BanMembers)
            .addSubcommand(subCmd => subCmd.setName("global")
                .setDescription("Set global (server-wide) settings")
                .addStringOption(opt => opt.setName("action")
                    .setDescription("Which action to enable?")
                    .setChoices(
                        { name: "Insults", value: "insults" },
                        { name: "Reactions", value: "reactions" },
                        { name: "Timeout members", value: "timeouts" },
                        { name: "Set VC status", value: "setVCStatus" },
                        { name: "Change nicknames", value: "nicknameChanger" },
                        { name: "Mute members", value: "muteMembers" }
                    )
                )
                .addBooleanOption(opt => opt.setName("enable")
                    .setDescription("Enable this action?")
                )
            )
            .addSubcommand(cmd => cmd.setName("disable-in-here")
                .setDescription("Disable specific actions in the specified or current channel")
                    .addStringOption(opt => opt.setName("action")
                        .setDescription("Which action to disable?")
                        .setChoices(
                            { name: "Everything", value: "global" },
                            { name: "Insults", value: "insults" },
                            { name: "Reactions", value: "reactions" },
                            { name: "Timeout members", value: "timeouts" },
                            { name: "Set VC status", value: "setVCStatus" },
                            { name: "Change nicknames", value: "nicknameChanger" },
                            { name: "Mute members", value: "muteMembers" }
                        )
                        .setRequired(true)
                    )
                    .addChannelOption(opt => opt.setName("channel")
                        .setDescription("Channel to disable this in")
                    )
                    .addBooleanOption(opt => opt.setName("disable")
                        .setDescription("disable this action?")
                    )
                )
            .addSubcommand(cmd => cmd.setName("only-interact-with")
                .setDescription("Make the bot only interact with this specific role")
                .addRoleOption(opt => opt.setName("role")
                    .setDescription("Only interact with members with this role")
                    .setRequired(true)
                )
            )
            .addSubcommand(cmd => cmd.setName("chance")
                .setDescription("Set the chance of a specific action")
                .addStringOption(opt => opt.setName("action")
                    .setDescription("Which one to set the chance of?")
                    .setChoices(
                        { name: "Insults", value: "insults" },
                        { name: "Reactions", value: "reactions" },
                        { name: "Timeout members", value: "timeouts" },
                        { name: "Set VC status", value: "setVCStatus" },
                        { name: "Change nicknames", value: "nicknameChanger" },
                        { name: "Mute members", value: "muteMembers" }
                    )
                    .setRequired(true)
                )
                .addIntegerOption(opt => opt.setName("chance")
                    .setDescription("Do this action with an 1 in N chance")
                    .setMinValue(2)
                    .setRequired(true)
                )
            )
    ].map(builder => builder.toJSON());

    const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

    try {
        console.log(`Started refreshing ${commands.length} commands.`);

        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_BOT_CLIENT_ID!),
            {body: commands},
        );

        console.log(`Successfully reloaded commands.`);
    } catch (error) {
        console.error(error);
    }
}

main().then(() => {});