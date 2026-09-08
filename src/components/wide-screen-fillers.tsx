/** Decorative "empty card" panels flanking a section's content on very wide
 *  screens, so the page doesn't feel empty once the viewport outgrows the
 *  1440px content column. Render inside a `relative` container that wraps
 *  the section's content — the fillers match that container's height. */
export function WideScreenFillers() {
  const fillerStyle = {
    width: "calc((100vw - 1440px) / 2 - 48px)",
  };

  return (
    <>
      <div
        aria-hidden="true"
        style={fillerStyle}
        className="pointer-events-none absolute inset-y-0 right-full mr-6 hidden rounded-[2rem] border border-slate-200 bg-background shadow-sm min-[2200px]:block"
      />
      <div
        aria-hidden="true"
        style={fillerStyle}
        className="pointer-events-none absolute inset-y-0 left-full ml-6 hidden rounded-[2rem] border border-slate-200 bg-background shadow-sm min-[2200px]:block"
      />
    </>
  );
}
