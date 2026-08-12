import { requireAdmin } from "../../lib/auth";
export default async function Layout({ children }: { children: React.ReactNode }) { await requireAdmin(); return children; }
