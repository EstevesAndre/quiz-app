import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { QuizQuestionView } from "@/components/quiz-question-view";
import {
  getOpenQuizById,
  parseIntegerParam,
  serializeQuizForPlay,
} from "@/lib/quiz-data";

export const dynamic = "force-dynamic";

type QuizQuestionPageProps = {
  params: Promise<{
    id: string;
    index: string;
  }>;
};

export default async function QuizQuestionPage({
  params,
}: QuizQuestionPageProps) {
  const { id, index } = await params;
  const quizId = parseIntegerParam(id);
  const questionIndex = parseIntegerParam(index);

  if (!quizId || !questionIndex) {
    notFound();
  }

  const quiz = await getOpenQuizById(quizId);
  if (!quiz) {
    notFound();
  }

  if (questionIndex > quiz.questions.length) {
    redirect(`/quiz/${quiz.id}/results`);
  }

  const serializedQuiz = serializeQuizForPlay(quiz);

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-4">
        <div>
          <Link
            href={`/quiz/${quiz.id}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            Voltar ao início do quiz
          </Link>
        </div>
        <QuizQuestionView quiz={serializedQuiz} questionIndex={questionIndex} />
      </div>
    </main>
  );
}
