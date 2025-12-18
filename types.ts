export type BotActions = "insults" | "reactions" | "timeouts" | "nicknameChanger" | "muteMembers";
export type ServerConfiguration = {
    enable: Record<BotActions | "global", boolean>,
    chances: Record<BotActions, number>
    disable: Record<BotActions, string[]>,
    onlyInteractWithThisRole: string | null
};