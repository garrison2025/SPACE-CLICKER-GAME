import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article';
  schema?: Record<string, any> | Record<string, any>[];
  noindex?: boolean;
}

const SEOHead: React.FC<SEOHeadProps> = ({ 
  title, 
  description, 
  path, 
  image = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200',
  type = 'website',
  schema,
  noindex = false
}) => {
  const normalizedPath = path === '/' ? '/' : '/' + path.split('/').filter(Boolean).join('/') + '/';
  const fullUrl = `https://spaceclickergame.com${normalizedPath}`;
  let socialImage = image;
  try {
    const parsedImage = new URL(image);
    if (parsedImage.hostname === 'images.unsplash.com') {
      parsedImage.searchParams.set('w', '1200');
      parsedImage.searchParams.set('h', '630');
      parsedImage.searchParams.set('fit', 'crop');
      parsedImage.searchParams.set('q', '80');
      socialImage = parsedImage.toString();
    }
  } catch {
    socialImage = image;
  }

  // Prerendered HTML exposes route schema to no-JS crawlers. Once React owns
  // the document, remove that static copy so Helmet remains the single runtime source.
  useEffect(() => {
    document.getElementById('prerender-route-jsonld')?.remove();
  }, [path]);

  return (
    <Helmet>
      {/* Basic Metadata */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {!noindex && <link rel="canonical" href={fullUrl} />}

      {/* Monolingual site: do not emit hreflang/x-default until real localized equivalents exist. */}

      {/* Robots Directive */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      {/* Open Graph / Social */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={socialImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:site_name" content="Space Clicker Game" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={socialImage} />
      <meta name="twitter:image:alt" content={title} />

      {/* JSON-LD Structured Data */}
      {!noindex && schema && (
        <script id="runtime-route-jsonld" type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;