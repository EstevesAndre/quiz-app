"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlayQuiz } from "@/lib/quiz-data";

type QuizQuestionViewProps = {
  quiz: PlayQuiz;
  questionIndex: number;
};

type QuizProgress = {
  answers: Record<string, string>;
};

function getStorageKey(quizId: number) {
  return `quiz-progress-${quizId}`;
}

function readProgress(storageKey: string): QuizProgress {
  const raw = sessionStorage.getItem(storageKey);
  if (!raw) {
    return {
      answers: {},
    };
  }

  try {
    const parsed = JSON.parse(raw) as QuizProgress;
    if (!parsed || typeof parsed !== "object" || !parsed.answers) {
      return {
        answers: {},
      };
    }

    return parsed;
  } catch {
    return {
      answers: {},
    };
  }
}

export function QuizQuestionView({ quiz, questionIndex }: QuizQuestionViewProps) {
  const router = useRouter();
  const storageKey = useMemo(() => getStorageKey(quiz.id), [quiz.id]);
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") {
      return {};
    }

    return readProgress(storageKey).answers;
  });
  const [showValidationError, setShowValidationError] = useState(false);

  const question = quiz.questions[questionIndex - 1];

  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify({ answers }));
  }, [answers, storageKey]);

  if (!question) {
    return null;
  }

  const mainQuestionKey = `q-${question.id}`;
  const hasMainAnswer = Boolean(answers[mainQuestionKey]);
  const hasMissingFollowUp = question.followUps.some(
    (followUp) => !answers[`f-${followUp.id}`],
  );

  function handleAnswerChange(answerKey: string, answerValue: string) {
    setShowValidationError(false);
    setAnswers((previousAnswers) => ({
      ...previousAnswers,
      [answerKey]: answerValue,
    }));
  }

  function handleNext() {
    if (!hasMainAnswer || hasMissingFollowUp) {
      setShowValidationError(true);
      return;
    }

    const isLastQuestion = questionIndex >= quiz.questions.length;
    if (isLastQuestion) {
      router.push(`/quiz/${quiz.id}/results`);
      return;
    }

    router.push(`/quiz/${quiz.id}/question/${questionIndex + 1}`);
  }

  function handleBack() {
    if (questionIndex === 1) {
      router.push(`/quiz/${quiz.id}`);
      return;
    }

    router.push(`/quiz/${quiz.id}/question/${questionIndex - 1}`);
  }

  return (
    <Card>
      <CardHeader className="space-y-2">
        <p className="text-xs uppercase text-muted-foreground">
          Pergunta {questionIndex} de {quiz.questions.length}
        </p>
        <CardTitle>{question.text}</CardTitle>
        {question.explanation ? (
          <p className="text-sm text-muted-foreground">{question.explanation}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-5">
        <section className="space-y-2">
          {question.options.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm"
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option.value}
                checked={answers[mainQuestionKey] === option.value}
                onChange={() => handleAnswerChange(mainQuestionKey, option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </section>

        {question.followUps.length > 0 ? (
          <section className="space-y-4 border-t pt-4">
            {question.followUps.map((followUp) => {
              const followUpKey = `f-${followUp.id}`;

              return (
                <div key={followUp.id} className="space-y-2">
                  <p className="text-sm font-medium">{followUp.text}</p>
                  {followUp.options.map((option) => (
                    <label
                      key={option.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm"
                    >
                      <input
                        type="radio"
                        name={`followup-${followUp.id}`}
                        value={option.value}
                        checked={answers[followUpKey] === option.value}
                        onChange={() => handleAnswerChange(followUpKey, option.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              );
            })}
          </section>
        ) : null}

        {showValidationError ? (
          <p className="text-sm text-destructive">
            Responde à pergunta principal e aos follow-ups antes de avançar.
          </p>
        ) : null}

        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" onClick={handleBack}>
            Voltar
          </Button>
          <Button type="button" onClick={handleNext}>
            {questionIndex >= quiz.questions.length ? "Ver resultado" : "Seguinte"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
