import { QuestionType } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateQuestionAction } from "@/app/dashboard/actions";
import { QuestionForm } from "@/app/dashboard/quizzes/_components/question-form";
import { getQuizById, parseIntegerParam } from "@/lib/quiz-data";

export const dynamic = "force-dynamic";

function toOptionsText(
  options: Array<{ label: string; value: string; isCorrect: boolean }>,
): string {
  return options
    .map((option) => `${option.label}|${option.value}|${option.isCorrect}`)
    .join("\n");
}

function toFollowUpsJson(
  followUps: Array<{
    text: string;
    type: QuestionType;
    order: number;
    explanation: string | null;
    options: Array<{ label: string; value: string; isCorrect: boolean }>;
  }>,
): string {
  const serialized = followUps.map((followUp) => {
    const base = {
      text: followUp.text,
      type: followUp.type,
      order: followUp.order,
      explanation: followUp.explanation ?? undefined,
    };

    if (followUp.type === QuestionType.boolean) {
      return {
        ...base,
        booleanCorrect:
          followUp.options.find((option) => option.isCorrect)?.value === "false"
            ? "false"
            : "true",
      };
    }

    return {
      ...base,
      options: followUp.options.map((option) => ({
        label: option.label,
        value: option.value,
        isCorrect: option.isCorrect,
      })),
    };
  });

  return serialized.length > 0 ? JSON.stringify(serialized, null, 2) : "";
}

type EditQuestionPageProps = {
  params: Promise<{
    id: string;
    questionId: string;
  }>;
};

export default async function EditQuestionPage({ params }: EditQuestionPageProps) {
  const { id, questionId } = await params;
  const quizId = parseIntegerParam(id);
  const parsedQuestionId = parseIntegerParam(questionId);
  if (!quizId || !parsedQuestionId) {
    notFound();
  }

  const quiz = await getQuizById(quizId);
  if (!quiz) {
    notFound();
  }

  const question = quiz.questions.find((item) => item.id === parsedQuestionId);
  if (!question) {
    notFound();
  }

  const booleanCorrectValue =
    question.options.find((option) => option.isCorrect)?.value === "false"
      ? "false"
      : "true";

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
          <CardTitle>Editar pergunta</CardTitle>
        </CardHeader>
        <CardContent>
          <QuestionForm
            action={updateQuestionAction}
            quizId={quiz.id}
            questionId={question.id}
            submitLabel="Guardar alterações"
            initialValues={{
              text: question.text,
              type: question.type,
              order: question.order,
              explanation: question.explanation,
              optionsText:
                question.type === QuestionType.boolean
                  ? ""
                  : toOptionsText(question.options),
              booleanCorrect: booleanCorrectValue,
              followUpsJson: toFollowUpsJson(question.followUps),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
