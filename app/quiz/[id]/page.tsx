import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { startQuizAction } from "@/app/quiz/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getOpenQuizById, parseIntegerParam } from "@/lib/quiz-data";

export const dynamic = "force-dynamic";

type QuizStartPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function QuizStartPage({ params }: QuizStartPageProps) {
  const { id } = await params;
  const quizId = parseIntegerParam(id);
  if (!quizId) {
    notFound();
  }

  const quiz = await getOpenQuizById(quizId);
  if (!quiz) {
    notFound();
  }

  const cookieStore = await cookies();
  const savedName = cookieStore.get("quiz_user_name")?.value ?? "";

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-6">
        <div>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:underline"
          >
            Voltar à lista
          </Link>
        </div>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>{quiz.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {quiz.description ?? "Sem descrição"}
            </p>
          </CardHeader>
          <CardContent className="flex flex-row gap-3">
            <form action={startQuizAction} className="space-y-3 flex-1">
              <input type="hidden" name="quizId" value={quiz.id} />
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Nome (opcional)
                </label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={savedName}
                  placeholder="Escreve o teu nome"
                />
              </div>
              <Button type="submit" name="mode" value="named">
                Começar quiz
              </Button>
            </form>

            <form action={startQuizAction} className="self-end">
              <input type="hidden" name="quizId" value={quiz.id} />
              <Button
                type="submit"
                name="mode"
                value="anonymous"
                variant="outline"
              >
                Continuar anónimo
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
