import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getAuthOptions } from "@/lib/auth";
import Navbar from "@/components/Navbar";

export default async function DashboardLayout({
    children,
}: {
    readonly children: React.ReactNode;
}) {
    const authOptions = getAuthOptions();
    const session = await getServerSession(authOptions);
    console.log("[DashboardLayout] getServerSession result:", session);

    if (!session?.user?.id) {
        redirect("/login");
    }

    return (
        <>
            <Navbar />
            {children}
        </>
    );
}
