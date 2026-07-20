import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";
import DefaultLayout from "@/layouts/default";

export default function IndexPage() {
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg justify-center text-center">
          <span className={title()}>Make&nbsp;</span>
          <span className={title({ color: "blue" })}>beautiful&nbsp;</span>
          <br />
          <span className={title()}>websites regardless of your design experience.</span>
          <div className={subtitle({ class: "mt-4" })}>
            Beautiful, fast and modern React UI library.
          </div>
        </div>

        <div className="flex gap-3">
          <a
            className="button button--primary button--md rounded-full"
            href={siteConfig.links.docs}
            rel="noopener noreferrer"
            target="_blank"
          >
            Documentation
          </a>
          <a
            className="button button--tertiary button--md rounded-full"
            href={siteConfig.links.github}
            rel="noopener noreferrer"
            target="_blank"
          >
            <GithubIcon size={20} />
            GitHub
          </a>
        </div>

        <div className="mt-8">
          <div className="bg-surface shadow-surface flex items-center gap-2 rounded-xl px-4 py-2">
            <pre className="font-mono text-sm font-medium">
              Get started by editing{" "}
              <code className="bg-accent/20 text-accent inline h-fit rounded-sm px-2 py-1 font-mono text-sm font-normal whitespace-nowrap">
                pages/index.tsx
              </code>
            </pre>
          </div>
        </div>
      </section>
    </DefaultLayout>
  );
}
