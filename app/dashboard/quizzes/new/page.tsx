import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createQuizAction } from "@/app/dashboard/actions";
import { QuizForm } from "@/app/dashboard/quizzes/_components/quiz-form";

export default function NewQuizPage() {
  return (
    <div className="space-y-4">
      <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
        Voltar ao dashboard
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Criar quiz</CardTitle>
        </CardHeader>
        <CardContent>
          <QuizForm action={createQuizAction} submitLabel="Guardar quiz" />
        </CardContent>
      </Card>
    </div>
  );
}
