import { QuizStatus } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QUESTION_TYPE_LABELS, QUIZ_STATUS_LABELS } from "@/lib/quiz-constants";
import { getQuizById, parseIntegerParam } from "@/lib/quiz-data";

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

type QuizDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function QuizDetailsPage({ params }: QuizDetailsPageProps) {
  const { id } = await params;
  const quizId = parseIntegerParam(id);
  if (!quizId) {
    notFound();
  }

  const quiz = await getQuizById(quizId);
  if (!quiz) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
        Voltar ao dashboard
      </Link>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{quiz.title}</CardTitle>
            <Badge variant={getStatusVariant(quiz.status)}>
              {QUIZ_STATUS_LABELS[quiz.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {quiz.description ?? "Sem descrição"}
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            render={<Link href={`/dashboard/quizzes/${quiz.id}/edit`} />}
          >
            Editar quiz
          </Button>
          <Button
            size="sm"
            render={<Link href={`/dashboard/quizzes/${quiz.id}/questions/new`} />}
          >
            Adicionar pergunta
          </Button>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Perguntas</h2>
        {quiz.questions.length === 0 ? (
          <Card>
            <CardContent className="py-5 text-sm text-muted-foreground">
              Ainda não existem perguntas neste quiz.
            </CardContent>
          </Card>
        ) : null}

        {quiz.questions.map((question) => (
          <Card key={question.id}>
            <CardHeader className="gap-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm">#{question.order}</CardTitle>
                <Badge variant="outline">{QUESTION_TYPE_LABELS[question.type]}</Badge>
              </div>
              <p className="text-sm">{question.text}</p>
            </CardHeader>
            <CardContent className="space-y-3 pb-5">
              <p className="text-xs text-muted-foreground">
                {question.options.length} opção(ões) · {question.followUps.length} follow-up(s)
              </p>
              <Button
                size="sm"
                variant="outline"
                render={
                  <Link
                    href={`/dashboard/quizzes/${quiz.id}/questions/${question.id}/edit`}
                  />
                }
              >
                Editar pergunta
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
