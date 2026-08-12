import { requireOnboardedUser } from "../../lib/auth";
export default async function Layout({ children }: { children: React.ReactNode }) { await requireOnboardedUser(); return children; }
