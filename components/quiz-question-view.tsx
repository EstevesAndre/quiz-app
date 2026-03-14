"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlayQuiz } from "@/lib/quiz-data";

type QuizQuestionViewProps = {
  quiz: PlayQuiz;
  questionIndex: number;
};

type AnswerValue = string | string[];

type QuizProgress = {
  answers: Record<string, AnswerValue>;
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
    return {
      answers: {},
    };
  }
}

function hasAnswer(value: AnswerValue | undefined): boolean {
  if (!value) {
    return false;
  }

  if (typeof value === "string") {
    return value.length > 0;
  }

  return value.length > 0;
}

function isMultipleChoiceCorrect(options: Array<{ isCorrect: boolean }>) {
  return options.filter((option) => option.isCorrect).length > 1;
}

function isOptionChecked(
  answer: AnswerValue | undefined,
  optionValue: string,
  isMultiple: boolean,
) {
  if (!answer) {
    return false;
  }

  if (isMultiple) {
    return Array.isArray(answer) ? answer.includes(optionValue) : false;
  }

  return typeof answer === "string" ? answer === optionValue : false;
}

export function QuizQuestionView({
  quiz,
  questionIndex,
}: QuizQuestionViewProps) {
  const router = useRouter();
  const storageKey = useMemo(() => getStorageKey(quiz.id), [quiz.id]);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(() => {
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
  const hasMainAnswer = hasAnswer(answers[mainQuestionKey]);
  const hasMissingFollowUp = question.followUps.some(
    (followUp) => !hasAnswer(answers[`f-${followUp.id}`]),
  );

  function handleSingleAnswerChange(answerKey: string, answerValue: string) {
    setShowValidationError(false);
    setAnswers((previousAnswers) => ({
      ...previousAnswers,
      [answerKey]: answerValue,
    }));
  }

  function handleMultiAnswerChange(answerKey: string, answerValue: string) {
    setShowValidationError(false);
    setAnswers((previousAnswers) => {
      const currentAnswer = previousAnswers[answerKey];
      const selectedValues =
        Array.isArray(currentAnswer) && currentAnswer.length > 0
          ? currentAnswer
          : [];

      const alreadySelected = selectedValues.includes(answerValue);
      const nextSelectedValues = alreadySelected
        ? selectedValues.filter((value) => value !== answerValue)
        : [...selectedValues, answerValue];

      return {
        ...previousAnswers,
        [answerKey]: nextSelectedValues,
      };
    });
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
          <p className="text-sm text-muted-foreground">
            {question.explanation}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-5">
        <section className="space-y-2">
          {isMultipleChoiceCorrect(question.options) ? (
            <p className="text-xs text-muted-foreground">
              Seleciona todas as respostas corretas.
            </p>
          ) : null}
          {question.options.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm"
            >
              <input
                type={
                  isMultipleChoiceCorrect(question.options)
                    ? "checkbox"
                    : "radio"
                }
                name={`question-${question.id}`}
                value={option.value}
                checked={isOptionChecked(
                  answers[mainQuestionKey],
                  option.value,
                  isMultipleChoiceCorrect(question.options),
                )}
                onChange={() => {
                  if (isMultipleChoiceCorrect(question.options)) {
                    handleMultiAnswerChange(mainQuestionKey, option.value);
                    return;
                  }

                  handleSingleAnswerChange(mainQuestionKey, option.value);
                }}
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
                  {isMultipleChoiceCorrect(followUp.options) ? (
                    <p className="text-xs text-muted-foreground">
                      Seleciona todas as respostas corretas.
                    </p>
                  ) : null}
                  {followUp.options.map((option) => (
                    <label
                      key={option.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm"
                    >
                      <input
                        type={
                          isMultipleChoiceCorrect(followUp.options)
                            ? "checkbox"
                            : "radio"
                        }
                        name={`followup-${followUp.id}`}
                        value={option.value}
                        checked={isOptionChecked(
                          answers[followUpKey],
                          option.value,
                          isMultipleChoiceCorrect(followUp.options),
                        )}
                        onChange={() => {
                          if (isMultipleChoiceCorrect(followUp.options)) {
                            handleMultiAnswerChange(followUpKey, option.value);
                            return;
                          }

                          handleSingleAnswerChange(followUpKey, option.value);
                        }}
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
            {questionIndex >= quiz.questions.length
              ? "Ver resultado"
              : "Seguinte"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
