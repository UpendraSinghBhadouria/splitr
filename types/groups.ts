import { getGroupExpenses, getGroupOrMembers } from "@/actions";

export type GetGroupExpenses = Awaited<ReturnType<typeof getGroupExpenses>>;

export type GetGroupOrMembers = Awaited<ReturnType<typeof getGroupOrMembers>>;
