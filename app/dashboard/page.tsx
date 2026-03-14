import { QuizStatus } from "@prisma/client";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QUIZ_STATUS_LABELS } from "@/lib/quiz-constants";
import { getDashboardQuizzes } from "@/lib/quiz-data";

export const dynamic = "force-dynamic";

function getStatusVariant(status: QuizStatus): "default" | "secondary" | "outline" {
  if (status === QuizStatus.open) {
    return "default";
  }

  if (status === QuizStatus.closed) {
    return "secondary";
  }

  return "outline";
}

export default async function DashboardPage() {
  const quizzes = await getDashboardQuizzes();

  return (
    <div className="space-y-6">
      <section className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Criar e editar quizzes sem autenticação.
          </p>
        </div>
        <Button render={<Link href="/dashboard/quizzes/new" />}>Criar quiz</Button>
      </section>

      <section className="grid gap-4">
        {quizzes.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Nenhum quiz criado</CardTitle>
              <CardDescription>
                Crie o primeiro quiz para começar o MVP.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {quizzes.map((quiz) => (
          <Card key={quiz.id}>
            <CardHeader className="gap-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{quiz.title}</CardTitle>
                <Badge variant={getStatusVariant(quiz.status)}>
                  {QUIZ_STATUS_LABELS[quiz.status]}
                </Badge>
              </div>
              {quiz.description ? (
                <CardDescription>{quiz.description}</CardDescription>
              ) : (
                <CardDescription>Sem descrição</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {quiz._count.questions} pergunta(s)
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  render={<Link href={`/dashboard/quizzes/${quiz.id}`} />}
                >
                  Ver
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  render={<Link href={`/dashboard/quizzes/${quiz.id}/edit`} />}
                >
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
