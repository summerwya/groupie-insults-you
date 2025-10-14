import {
    InteractionContextType,
    PermissionFlagsBits,
    RESTPostAPIApplicationCommandsJSONBody,
    SlashCommandBuilder,
} from "discord.js";
import { REST, Routes } from 'discord.js';

async function main() {
    let commands: RESTPostAPIApplicationCommandsJSONBody[] = [
        new SlashCommandBuilder()
            .setName("set")
            .setDescription("Set settings")
            .setContexts([InteractionContextType.PrivateChannel, InteractionContextType.Guild])
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator | PermissionFlagsBits.BanMembers)
            .addSubcommand(subCmd => subCmd.setName("chance")
                .setDescription("Set the chances of groupie insulting you")
                .addIntegerOption(option => option
                    .setName("chance")
                    .setDescription("How often? 1 in N chance")
                    .setMinValue(2)
                    .setMaxValue(1000)
                )
            )
            .addSubcommandGroup(cmd => cmd.setName("disable")
                .setDescription("Disable where?")
                .addSubcommand(cmd => cmd.setName("here")
                    .setDescription("Don't sent insults in the current channel or in a specific channel")
                    .addBooleanOption(opt => opt.setName("disable")
                        .setDescription("Disable or Enable?")
                        .setRequired(false)
                    )
                    .addChannelOption(opt => opt.setName("channel")
                        .setDescription("The specific channel to disable groupie in")
                        .setRequired(false)
                    )
                )
            )
            .addSubcommand(cmd => cmd.setName("enable")
                .setDescription("Enable or disable groupie entirely")
                .addBooleanOption(opt => opt.setName("enable")
                    .setDescription("Enable?")
                )
            )
    ].map(builder => builder.toJSON());

    const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_BOT_CLIENT_ID!),
            {body: commands},
        );

        console.log(`Successfully reloaded application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
}

main();