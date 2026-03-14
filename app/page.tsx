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
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Quizzes disponíveis</h1>
          {/* <p className="text-sm text-muted-foreground">
            Mostramos apenas quizzes com estado open.
          </p>
          <Button size="sm" variant="outline" render={<Link href="/dashboard" />}>
            Abrir dashboard
          </Button> */}
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
    </main>
  );
}
