import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const setupSteps = [
  "Prisma is configured to use PostgreSQL through DATABASE_URL.",
  "shadcn/ui components live locally in components/ui.",
  "The app is ready for your first quiz, admin, or onboarding flow.",
];

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-6 py-16">
      <Card className="w-full max-w-3xl border-border/70 shadow-sm">
        <CardHeader className="gap-3">
          <CardTitle className="text-3xl">Quiz App Starter</CardTitle>
          <CardDescription className="max-w-2xl text-base leading-7">
            This standalone Next.js app is set up with Prisma, PostgreSQL, and
            local shadcn/ui components so you can start building features
            without any monorepo or shared-package overhead.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              Included setup
            </h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {setupSteps.map((step) => (
                <li
                  key={step}
                  className="rounded-lg border border-border/70 bg-background px-4 py-3"
                >
                  {step}
                </li>
              ))}
            </ul>
          </section>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-between">
          <Button type="button">Create your first quiz</Button>
          <Button type="button" variant="outline">
            Review the Prisma schema
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
