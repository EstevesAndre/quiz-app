import Link from "next/link";
import { notFound } from "next/navigation";

import { QuizResultsView } from "@/components/quiz-results-view";
import {
  getOpenQuizById,
  parseIntegerParam,
  serializeQuizForPlay,
} from "@/lib/quiz-data";

export const dynamic = "force-dynamic";

type QuizResultsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function QuizResultsPage({
  params,
}: QuizResultsPageProps) {
  const { id } = await params;
  const quizId = parseIntegerParam(id);
  if (!quizId) {
    notFound();
  }

  const quiz = await getOpenQuizById(quizId);
  if (!quiz) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-6">
        <div>
          <Link
            href={`/quiz/${quiz.id}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            Voltar ao quiz
          </Link>
        </div>
        <QuizResultsView quiz={serializeQuizForPlay(quiz)} />
      </div>
    </main>
  );
}
