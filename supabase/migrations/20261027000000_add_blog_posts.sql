-- ========================================================
-- Migration: Blog posts (authored in apps/admin, rendered at /en/blog)
-- ========================================================
-- Body is an ordered array of typed blocks (heading / paragraph / list /
-- quote / images / embed) in `content`, validated by blogPostSchema in
-- @astrokraft/validators before every write (strictly only on publish -
-- drafts may be incomplete). Images are Cloudflare R2 URLs
-- uploaded through the r2-presign Edge Function (folder "blog"); the cover
-- image doubles as the post's OG/Twitter share image.

CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) <= 120),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  excerpt TEXT NOT NULL DEFAULT '' CHECK (char_length(excerpt) <= 300),
  cover_image_url TEXT NOT NULL DEFAULT '',
  cover_image_alt TEXT NOT NULL DEFAULT '',
  content JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(content) = 'array'),
  faqs JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(faqs) = 'array'),
  tags TEXT[] NOT NULL DEFAULT '{}',
  author_name TEXT NOT NULL DEFAULT 'AstroKraft',
  seo_title TEXT CHECK (seo_title IS NULL OR char_length(seo_title) <= 70),
  seo_description TEXT CHECK (seo_description IS NULL OR char_length(seo_description) <= 170),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Drafts may be half-written; a published post must have everything the
  -- storefront page, its OG card and its JSON-LD need.
  CONSTRAINT blog_posts_published_complete CHECK (
    status = 'draft' OR (
      published_at IS NOT NULL
      AND excerpt <> ''
      AND cover_image_url LIKE 'https://%'
      AND cover_image_alt <> ''
      AND jsonb_array_length(content) > 0
    )
  )
);

-- The storefront only ever lists published posts newest-first.
CREATE INDEX idx_blog_posts_published ON public.blog_posts (published_at DESC) WHERE status = 'published';

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- (SELECT public.is_admin()) is evaluated once per statement rather than
-- once per row.
CREATE POLICY "Public read published blog posts" ON public.blog_posts
  FOR SELECT USING (status = 'published' OR (SELECT public.is_admin()));

CREATE POLICY "Admins insert blog posts" ON public.blog_posts
  FOR INSERT WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "Admins update blog posts" ON public.blog_posts
  FOR UPDATE USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY "Admins delete blog posts" ON public.blog_posts
  FOR DELETE USING ((SELECT public.is_admin()));
