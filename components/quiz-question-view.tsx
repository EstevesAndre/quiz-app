"use client";

import Image from "next/image";
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

type QuizOption = {
  id: number;
  label: string;
  value: string;
  imageUrl: string | null;
  isCorrect: boolean;
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

function looksLikeImageReference(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return /(^\/api\/uploads\/.+)|(\.(png|jpe?g|webp)(\?.*)?$)/i.test(
    value.trim(),
  );
}

function resolveOptionImageUrl(option: QuizOption) {
  if (option.imageUrl) {
    return option.imageUrl;
  }

  if (looksLikeImageReference(option.label)) {
    return option.label;
  }

  if (looksLikeImageReference(option.value)) {
    return option.value;
  }

  return null;
}

function resolveOptionLabel(
  option: QuizOption,
  optionIndex: number,
  hasImage: boolean,
) {
  if (!hasImage) {
    return option.label || `Opção ${optionIndex + 1}`;
  }

  if (looksLikeImageReference(option.label)) {
    return `Imagem ${optionIndex + 1}`;
  }

  return option.label || `Imagem ${optionIndex + 1}`;
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
  const [previewImage, setPreviewImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);

  const question = quiz.questions[questionIndex - 1];

  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify({ answers }));
  }, [answers, storageKey]);

  useEffect(() => {
    if (!previewImage) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPreviewImage(null);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [previewImage]);

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

  function renderOptionsBlock({
    options,
    answerKey,
    inputName,
  }: {
    options: QuizOption[];
    answerKey: string;
    inputName: string;
  }) {
    const isMultiple = isMultipleChoiceCorrect(options);
    const hasImageOptions = options.some((option) =>
      Boolean(resolveOptionImageUrl(option)),
    );

    return (
      <>
        {isMultiple ? (
          <p className="text-xs text-muted-foreground">
            Seleciona todas as respostas corretas.
          </p>
        ) : null}

        <div
          className={hasImageOptions ? "grid grid-cols-2 gap-3" : "space-y-2"}
        >
          {options.map((option, optionIndex) => {
            const imageUrl = resolveOptionImageUrl(option);
            const optionLabel = resolveOptionLabel(
              option,
              optionIndex,
              Boolean(imageUrl),
            );
            const checked = isOptionChecked(
              answers[answerKey],
              option.value,
              isMultiple,
            );

            if (hasImageOptions) {
              return (
                <label
                  key={option.id}
                  className={`relative flex cursor-pointer flex-col gap-2 rounded-xl border p-2 text-sm transition ${
                    checked
                      ? "border-primary ring-2 ring-primary/20"
                      : "hover:border-muted-foreground/40"
                  }`}
                >
                  <input
                    type={isMultiple ? "checkbox" : "radio"}
                    name={inputName}
                    value={option.value}
                    checked={checked}
                    onChange={() => {
                      if (isMultiple) {
                        handleMultiAnswerChange(answerKey, option.value);
                        return;
                      }

                      handleSingleAnswerChange(answerKey, option.value);
                    }}
                    className="absolute top-2 left-2 z-10 size-4"
                  />

                  {imageUrl ? (
                    <button
                      type="button"
                      className="absolute bottom-1 right-2 z-10 rounded-md border bg-background/90 px-3 py-1 text-[10px] font-medium text-foreground shadow-sm"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setPreviewImage({
                          src: imageUrl,
                          alt: optionLabel,
                        });
                      }}
                    >
                      Ver
                    </button>
                  ) : null}

                  {imageUrl ? (
                    <div className="ml-6 overflow-hidden rounded-lg border">
                      <Image
                        src={imageUrl}
                        alt={optionLabel}
                        width={400}
                        height={300}
                        className="h-36 w-full object-cover sm:h-44"
                      />
                    </div>
                  ) : (
                    <div className="ml-6 flex h-36 items-center justify-center rounded-lg border bg-muted text-xs text-muted-foreground sm:h-44">
                      Sem imagem
                    </div>
                  )}

                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {optionLabel}
                  </p>
                </label>
              );
            }

            return (
              <label
                key={option.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm"
              >
                <input
                  type={isMultiple ? "checkbox" : "radio"}
                  name={inputName}
                  value={option.value}
                  checked={checked}
                  onChange={() => {
                    if (isMultiple) {
                      handleMultiAnswerChange(answerKey, option.value);
                      return;
                    }

                    handleSingleAnswerChange(answerKey, option.value);
                  }}
                />
                <div className="flex flex-1 items-center gap-3">
                  <span>{optionLabel}</span>
                </div>
              </label>
            );
          })}
        </div>
      </>
    );
  }

  return (
    <>
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
            {renderOptionsBlock({
              options: question.options,
              answerKey: mainQuestionKey,
              inputName: `question-${question.id}`,
            })}
          </section>

          {question.followUps.length > 0 ? (
            <section className="space-y-4 border-t pt-4">
              {question.followUps.map((followUp) => {
                const followUpKey = `f-${followUp.id}`;

                return (
                  <div key={followUp.id} className="space-y-2">
                    <p className="text-sm font-medium">{followUp.text}</p>
                    {renderOptionsBlock({
                      options: followUp.options,
                      answerKey: followUpKey,
                      inputName: `followup-${followUp.id}`,
                    })}
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

      {previewImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 rounded-md border border-white/40 bg-black/30 px-3 py-1 text-sm text-white"
            onClick={(event) => {
              event.stopPropagation();
              setPreviewImage(null);
            }}
          >
            Fechar
          </button>

          <div
            className="relative h-[85vh] w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={previewImage.src}
              alt={previewImage.alt}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
