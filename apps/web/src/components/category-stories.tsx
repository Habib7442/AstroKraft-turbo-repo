import Image from "next/image";
import Link from "next/link";
import type { Category } from "@astrokraft/db";

interface CategoryStoriesProps {
  categories: Category[];
  locale: string;
}

export function CategoryStories({ categories, locale }: CategoryStoriesProps) {
  if (categories.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-6 pt-3 pb-10">
      <h2 className="text-2xl sm:text-3xl font-bold text-white text-left sm:text-center mb-6">Shop by Category</h2>

      <div className="scrollbar-hide flex [justify-content:safe_center] gap-5 overflow-x-auto px-1 pb-2 snap-x snap-mandatory">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/${locale}/${category.slug}`}
            className="group flex w-24 shrink-0 snap-start flex-col items-center gap-2 sm:w-28"
          >
            <div className="rounded-2xl bg-gold p-[2px] transition-transform group-hover:scale-105">
              <div className="relative h-20 w-20 overflow-hidden rounded-[14px] border-2 border-white bg-white sm:h-24 sm:w-24">
                {category.image_url ? (
                  <Image
                    src={category.image_url}
                    alt={category.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-surface-tint text-lg font-bold text-primary">
                    {category.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <span className="text-center text-xs font-semibold text-white">{category.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
