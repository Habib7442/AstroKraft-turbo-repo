import { Fragment, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { BlogBlock, BlogImage } from "@astrokraft/db";
import { parseVideoEmbed } from "@astrokraft/validators";
import { tableOfContents } from "@/lib/blog";

const PROVIDER_LABEL = { youtube: "YouTube", facebook: "Facebook", instagram: "Instagram" } as const;

// [label](url), **bold**, *italic* - built as React elements, never as an
// HTML string (see the dangerouslySetInnerHTML note in next.config.mjs).
const INLINE_TOKEN = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE_TOKEN)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push(text.slice(last, index));
    const [whole, label, href, bold, italic] = match;
    const key = `${index}-${whole.length}`;
    if (label !== undefined && href !== undefined) {
      if (href.startsWith("/") && !href.startsWith("//")) {
        nodes.push(
          <Link key={key} href={href} className="font-medium text-primary underline underline-offset-2 hover:text-primary-bright">
            {label}
          </Link>
        );
      } else if (href.startsWith("https://")) {
        nodes.push(
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-2 hover:text-primary-bright"
          >
            {label}
          </a>
        );
      } else {
        // javascript:, data:, http: etc. - show the words, drop the link.
        nodes.push(label);
      }
    } else if (bold !== undefined) {
      nodes.push(
        <strong key={key} className="font-semibold text-foreground">
          {bold}
        </strong>
      );
    } else if (italic !== undefined) {
      nodes.push(<em key={key}>{italic}</em>);
    }
    last = index + whole.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function renderLines(text: string): ReactNode[] {
  return text.split("\n").map((line, i) => (
    <Fragment key={i}>
      {i > 0 ? <br /> : null}
      {renderInline(line)}
    </Fragment>
  ));
}

function Figure({ image, sizes, className }: { image: BlogImage; sizes: string; className?: string }) {
  return (
    <figure className={className}>
      <Image
        src={image.url}
        alt={image.alt}
        width={1600}
        height={1067}
        sizes={sizes}
        className="h-auto w-full rounded-lg border border-surface-border bg-surface-tint"
      />
      {image.caption ? <figcaption className="mt-2 text-center text-xs text-ink-muted">{image.caption}</figcaption> : null}
    </figure>
  );
}

function ImagesBlock({ images }: { images: BlogImage[] }) {
  if (images.length === 1) {
    return <Figure image={images[0]} sizes="(max-width: 768px) 100vw, 720px" className="my-8" />;
  }
  return (
    <div className={`my-8 grid gap-3 ${images.length === 2 || images.length === 4 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
      {images.map((image, i) => (
        <figure key={`${image.url}-${i}`}>
          <div className="relative aspect-square overflow-hidden rounded-lg border border-surface-border bg-surface-tint">
            <Image src={image.url} alt={image.alt} fill sizes="(max-width: 640px) 50vw, 240px" className="object-cover" />
          </div>
          {image.caption ? <figcaption className="mt-1.5 text-center text-[11px] text-ink-muted">{image.caption}</figcaption> : null}
        </figure>
      ))}
    </div>
  );
}

function EmbedBlock({ block }: { block: Extract<BlogBlock, { type: "embed" }> }) {
  // Re-parsed at render time: the iframe src is always rebuilt from the
  // allowlisted provider + id, never read from the stored URL as-is.
  const embed = parseVideoEmbed(block.url);
  if (!embed) return null;
  const label = PROVIDER_LABEL[embed.provider];
  const title = block.caption || `${label} video`;
  return (
    <figure className="my-8">
      <div
        className={`overflow-hidden rounded-lg border border-surface-border bg-black ${
          embed.orientation === "portrait" ? "mx-auto aspect-[9/16] w-full max-w-[360px]" : "aspect-video w-full"
        }`}
      >
        <iframe
          src={embed.embedSrc}
          title={title}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="h-full w-full border-0"
        />
      </div>
      <figcaption className="mt-2 text-center text-xs text-ink-muted">
        {block.caption ? <>{block.caption} · </> : null}
        <a href={block.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          Watch on {label}
        </a>
      </figcaption>
    </figure>
  );
}

export function BlogContent({ blocks }: { blocks: BlogBlock[] }) {
  const headingIds = tableOfContents(blocks).map((entry) => entry.id);
  let headingIndex = 0;

  return (
    <div className="text-[17px] leading-8 text-ink-body">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading": {
            const id = headingIds[headingIndex++];
            return block.level === 2 ? (
              <h2 key={i} id={id} className="mt-12 scroll-mt-24 font-serif text-2xl font-bold leading-snug text-foreground sm:text-[28px]">
                {block.text}
              </h2>
            ) : (
              <h3 key={i} id={id} className="mt-8 scroll-mt-24 font-serif text-xl font-semibold leading-snug text-foreground">
                {block.text}
              </h3>
            );
          }
          case "paragraph":
            return block.text
              .split(/\n\s*\n/)
              .filter((p) => p.trim())
              .map((p, j) => (
                <p key={`${i}-${j}`} className="mt-5">
                  {renderLines(p.trim())}
                </p>
              ));
          case "list": {
            const items = block.items.map((item, j) => (
              <li key={j} className="pl-1">
                {renderInline(item)}
              </li>
            ));
            return block.style === "number" ? (
              <ol key={i} className="mt-5 list-decimal space-y-2 pl-6 marker:font-semibold marker:text-primary">
                {items}
              </ol>
            ) : (
              <ul key={i} className="mt-5 list-disc space-y-2 pl-6 marker:text-gold">
                {items}
              </ul>
            );
          }
          case "quote":
            return (
              <blockquote key={i} className="my-8 rounded-r-lg border-l-4 border-gold bg-surface-tint px-5 py-4">
                <p className="font-serif text-lg italic leading-relaxed text-foreground">{block.text}</p>
                {block.cite ? <cite className="mt-2 block text-sm not-italic text-ink-muted">— {block.cite}</cite> : null}
              </blockquote>
            );
          case "images":
            return <ImagesBlock key={i} images={block.images} />;
          case "embed":
            return <EmbedBlock key={i} block={block} />;
        }
      })}
    </div>
  );
}
