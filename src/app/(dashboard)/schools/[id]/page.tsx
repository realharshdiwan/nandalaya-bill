import { SchoolDetailContent } from "./school-detail-content";

export async function generateStaticParams() {
  return [{ id: "00000000-0000-0000-0000-000000000000" }];
}

export default function Page() {
  return <SchoolDetailContent />;
}
