import HomeLink from "./HomeLink";

/** Page title truly centered regardless of the home icon's width — a plain
 * flex-between would center the title only within the leftover space next
 * to the icon. */
export default function PageHeader({ title }: { title: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center">
      <div />
      <h1 className="app-title text-center text-xl font-bold">{title}</h1>
      <div className="flex justify-end">
        <HomeLink />
      </div>
    </div>
  );
}
