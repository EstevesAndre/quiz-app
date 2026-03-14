import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateQuizAction } from "@/app/dashboard/actions";
import { QuizForm } from "@/app/dashboard/quizzes/_components/quiz-form";
import { getQuizById, parseIntegerParam } from "@/lib/quiz-data";

export const dynamic = "force-dynamic";

type EditQuizPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditQuizPage({ params }: EditQuizPageProps) {
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
          <CardTitle>Editar quiz</CardTitle>
        </CardHeader>
        <CardContent>
          <QuizForm
            action={updateQuizAction}
            submitLabel="Guardar alterações"
            quizId={quiz.id}
            initialValues={{
              title: quiz.title,
              description: quiz.description,
              status: quiz.status,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
