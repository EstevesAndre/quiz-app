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

type AnswerValue = string | string[];

type QuizProgress = {
  answers: Record<string, AnswerValue>;
};

type ResultEntry = {
  id: string;
  text: string;
  userAnswer: string;
  correctAnswer: string;
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

    const sanitizedAnswers = Object.entries(parsed.answers).reduce<
      Record<string, AnswerValue>
    >((accumulator, [key, value]) => {
      if (typeof value === "string") {
        accumulator[key] = value;
        return accumulator;
      }

      if (Array.isArray(value)) {
        accumulator[key] = value
          .filter((entry): entry is string => typeof entry === "string")
          .map((entry) => entry.trim())
          .filter(Boolean);
      }

      return accumulator;
    }, {});

    return {
      answers: sanitizedAnswers,
    };
  } catch {
    return { answers: {} };
  }
}

function resolveLabel(
  options: Array<{ label: string; value: string }>,
  value: string,
): string {
  if (!value) {
    return "Sem resposta";
  }

  const option = options.find((item) => item.value === value);
  return option?.label ?? value;
}

function resolveAnswersLabel(
  options: Array<{ label: string; value: string }>,
  value: AnswerValue | undefined,
): string {
  if (!value) {
    return "Sem resposta";
  }

  if (typeof value === "string") {
    return resolveLabel(options, value);
  }

  if (value.length === 0) {
    return "Sem resposta";
  }

  return value.map((entry) => resolveLabel(options, entry)).join(", ");
}

function toSelectedValues(value: AnswerValue | undefined): string[] {
  if (!value) {
    return [];
  }

  if (typeof value === "string") {
    return value ? [value] : [];
  }

  return value;
}

function isCorrectAnswer(
  selectedValues: string[],
  correctValues: string[],
): boolean {
  if (correctValues.length === 0) {
    return false;
  }

  if (selectedValues.length !== correctValues.length) {
    return false;
  }

  const selectedSet = new Set(selectedValues);
  return correctValues.every((value) => selectedSet.has(value));
}

export function QuizResultsView({ quiz }: QuizResultsViewProps) {
  const router = useRouter();
  const storageKey = useMemo(() => getStorageKey(quiz.id), [quiz.id]);
  const [answers] = useState<Record<string, AnswerValue>>(() => {
    if (typeof window === "undefined") {
      return {};
    }

    return readProgress(storageKey).answers;
  });

  const entries = useMemo(() => {
    const flattened: ResultEntry[] = [];

    for (const question of quiz.questions) {
      const questionKey = `q-${question.id}`;
      const questionCorrectValues = question.options
        .filter((option) => option.isCorrect)
        .map((option) => option.value);
      const questionAnswer = answers[questionKey];

      flattened.push({
        id: questionKey,
        text: question.text,
        userAnswer: resolveAnswersLabel(question.options, questionAnswer),
        correctAnswer: resolveAnswersLabel(question.options, questionCorrectValues),
        isCorrect: isCorrectAnswer(
          toSelectedValues(questionAnswer),
          questionCorrectValues,
        ),
      });

      for (const followUp of question.followUps) {
        const followUpKey = `f-${followUp.id}`;
        const followUpCorrectValues = followUp.options
          .filter((option) => option.isCorrect)
          .map((option) => option.value);
        const followUpAnswer = answers[followUpKey];

        flattened.push({
          id: followUpKey,
          text: followUp.text,
          userAnswer: resolveAnswersLabel(followUp.options, followUpAnswer),
          correctAnswer: resolveAnswersLabel(
            followUp.options,
            followUpCorrectValues,
          ),
          isCorrect: isCorrectAnswer(
            toSelectedValues(followUpAnswer),
            followUpCorrectValues,
          ),
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
