import { TaskPage } from "@/components/operations/task-page";
export default function MaintenancePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <TaskPage kind="maintenance" searchParams={searchParams} />;
}
