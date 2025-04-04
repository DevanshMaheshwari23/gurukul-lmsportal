import React from 'react';
import NextLink from 'next/link';
import { getAppPath } from '@/lib/utils/navigation';

type LinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  target?: string;
  rel?: string;
  prefetch?: boolean;
};

/**
 * Custom Link component that automatically handles basePath
 * Use this component instead of Next.js Link component to ensure correct routing
 */
const Link: React.FC<LinkProps> = ({
  href,
  children,
  className,
  onClick,
  target,
  rel,
  prefetch,
  ...rest
}) => {
  // External links don't need basePath handling
  const isExternal = href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:');
  
  // If it's an external link, don't apply basePath
  const fullHref = isExternal ? href : getAppPath(href);
  
  return (
    <NextLink
      href={fullHref}
      className={className}
      onClick={onClick}
      target={target}
      rel={rel || (target === '_blank' ? 'noopener noreferrer' : undefined)}
      prefetch={prefetch}
      {...rest}
    >
      {children}
    </NextLink>
  );
};

export default Link; 