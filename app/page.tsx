import { redirect } from "next/navigation";
import { getStudent } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (await getStudent()) redirect("/exam");
  return (
    <>
      <header className="top"><h1>Évaluation de cours</h1></header>
      <main>
        <LoginForm />
      </main>
    </>
  );
}
