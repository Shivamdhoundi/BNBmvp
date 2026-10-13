import { TaskPage } from "@/components/operations/task-page";
export default function CleaningPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <TaskPage kind="cleaning" searchParams={searchParams} />;
}
