"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlayQuiz } from "@/lib/quiz-data";

type QuizResultsViewProps = {
  quiz: PlayQuiz;
};

type QuizProgress = {
  answers: Record<string, string>;
};

type ResultEntry = {
  id: string;
  text: string;
  userAnswer: string | null;
  correctAnswer: string | null;
  isCorrect: boolean;
};

function getStorageKey(quizId: number) {
  return `quiz-progress-${quizId}`;
}

function readProgress(storageKey: string): QuizProgress {
  const raw = sessionStorage.getItem(storageKey);
  if (!raw) {
    return { answers: {} };
  }

  try {
    const parsed = JSON.parse(raw) as QuizProgress;
    if (!parsed || typeof parsed !== "object" || !parsed.answers) {
      return { answers: {} };
    }
    return parsed;
  } catch {
    return { answers: {} };
  }
}

function resolveLabel(
  options: Array<{ label: string; value: string }>,
  value: string | null,
): string {
  if (!value) {
    return "Sem resposta";
  }

  const option = options.find((item) => item.value === value);
  return option?.label ?? value;
}

export function QuizResultsView({ quiz }: QuizResultsViewProps) {
  const router = useRouter();
  const storageKey = useMemo(() => getStorageKey(quiz.id), [quiz.id]);
  const [answers] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") {
      return {};
    }

    return readProgress(storageKey).answers;
  });

  const entries = useMemo(() => {
    const flattened: ResultEntry[] = [];

    for (const question of quiz.questions) {
      const questionKey = `q-${question.id}`;
      const questionCorrectOption =
        question.options.find((option) => option.isCorrect) ?? null;
      const questionAnswer = answers[questionKey] ?? null;
      flattened.push({
        id: questionKey,
        text: question.text,
        userAnswer: resolveLabel(question.options, questionAnswer),
        correctAnswer: resolveLabel(
          question.options,
          questionCorrectOption?.value ?? null,
        ),
        isCorrect:
          questionAnswer !== null &&
          questionCorrectOption !== null &&
          questionAnswer === questionCorrectOption.value,
      });

      for (const followUp of question.followUps) {
        const followUpKey = `f-${followUp.id}`;
        const followUpCorrectOption =
          followUp.options.find((option) => option.isCorrect) ?? null;
        const followUpAnswer = answers[followUpKey] ?? null;

        flattened.push({
          id: followUpKey,
          text: followUp.text,
          userAnswer: resolveLabel(followUp.options, followUpAnswer),
          correctAnswer: resolveLabel(
            followUp.options,
            followUpCorrectOption?.value ?? null,
          ),
          isCorrect:
            followUpAnswer !== null &&
            followUpCorrectOption !== null &&
            followUpAnswer === followUpCorrectOption.value,
        });
      }
    }

    return flattened;
  }, [answers, quiz.questions]);

  const total = entries.length;
  const correct = entries.filter((entry) => entry.isCorrect).length;
  const incorrect = total - correct;
  const score = total === 0 ? 0 : Math.round((correct / total) * 100);

  function handleStartOver() {
    sessionStorage.removeItem(storageKey);
    router.push(`/quiz/${quiz.id}/question/1`);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle>Resultado final</CardTitle>
          <p className="text-sm text-muted-foreground">
            Score: {score}% · {correct}/{total}
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">Respostas certas: {correct}</p>
          <p className="text-sm">Respostas erradas: {incorrect}</p>
          <Button type="button" onClick={handleStartOver}>
            Repetir / Start over
          </Button>
        </CardContent>
      </Card>

      {entries.map((entry) => (
        <Card key={entry.id}>
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm">{entry.text}</CardTitle>
              <Badge variant={entry.isCorrect ? "default" : "secondary"}>
                {entry.isCorrect ? "Certo" : "Errado"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-1 pb-4 text-sm">
            <p>A tua resposta: {entry.userAnswer}</p>
            <p className="text-muted-foreground">
              Resposta correta: {entry.correctAnswer}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
