import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOpenQuizzes } from "@/lib/quiz-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const quizzes = await getOpenQuizzes();

  return (
    <main className="flex min-h-screen flex-col bg-muted/30">
      <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Quizzes disponíveis</h1>
        </header>

        {quizzes.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Nenhum quiz público</CardTitle>
              <CardDescription>
                Ainda não há quizzes com estado open.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <section className="grid gap-4">
          {quizzes.map((quiz) => (
            <Card key={quiz.id}>
              <CardHeader className="space-y-2">
                <CardTitle>{quiz.title}</CardTitle>
                <CardDescription>
                  {quiz.description ?? "Sem descrição"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <Button render={<Link href={`/quiz/${quiz.id}`} />}>
                  Começar
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>

      <footer className="bg-background/80">
        <div className="mx-auto flex w-full max-w-3xl justify-end px-4 py-4">
          <Button size="sm" variant="ghost" render={<Link href="/dashboard" />}>
            Dashboard
          </Button>
        </div>
      </footer>
    </main>
  );
}
