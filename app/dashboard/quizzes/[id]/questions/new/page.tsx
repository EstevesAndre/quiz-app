import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createQuestionAction } from "@/app/dashboard/actions";
import { QuestionForm } from "@/app/dashboard/quizzes/_components/question-form";
import { getQuizById, parseIntegerParam } from "@/lib/quiz-data";

export const dynamic = "force-dynamic";

type NewQuestionPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function NewQuestionPage({ params }: NewQuestionPageProps) {
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
    <div className="space-y-4">
      <Link
        href={`/dashboard/quizzes/${quiz.id}`}
        className="text-sm text-muted-foreground hover:underline"
      >
        Voltar ao quiz
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar pergunta</CardTitle>
        </CardHeader>
        <CardContent>
          <QuestionForm
            action={createQuestionAction}
            quizId={quiz.id}
            submitLabel="Guardar pergunta"
            initialValues={{
              order: quiz.questions.length + 1,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
