import styled from '@emotion/styled';
import { useTheme } from '@geist-ui/core';
import { type MDXProvider } from '@mdx-js/react';
import NextImage, { type ImageProps as NextImageProps } from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';

import { type PostDocument } from '@/posts/lib/types';
import { Analytics } from '@/utils/analytics';

import { Code } from './Code';
import { MDXRemote } from './MDXRemote';

const Image: React.FC<NextImageProps> = ({ style, ...props }) => {
  const { palette } = useTheme();
  return (
    <NextImage
      {...props}
      width={1080}
      height={600}
      style={{
        ...style,
        borderColor: palette.accents_1,
        backgroundColor: palette.accents_2,
      }}
    />
  );
};

const useIsBlog = () => {
  const router = useRouter();
  const isBlog = useMemo(() => {
    return ['/blog', '/w/'].some((r) => router.asPath.includes(r));
  }, [router.asPath]);
  return { isBlog };
};

type HeadingProps = React.HTMLAttributes<HTMLHeadingElement>;
const HeadingTwo: React.FC<HeadingProps> = ({ id, style, ...props }) => {
  const [inViewRef, inView] = useInView({ threshold: 0.5 });

  const generatedId = useMemo(() => {
    if (id) {
      return id;
    }
    return props.children?.toString().toLowerCase().replace(/ /g, '-');
  }, [id, props.children]);

  const { isBlog } = useIsBlog();

  useEffect(() => {
    if (isBlog) {
      return;
    }
    if (inView && !!generatedId) {
      Analytics.logEvent('view_landing_section', {
        section: generatedId,
      });
    }
  }, [inView, generatedId, isBlog]);

  return (
    // eslint-disable-next-line jsx-a11y/heading-has-content
    <h2
      ref={inViewRef}
      {...props}
      id={generatedId}
      style={{ ...style, marginTop: 42, fontSize: 28 }}
    />
  );
};

const TrackedAnchor: React.FC<
  React.AnchorHTMLAttributes<HTMLAnchorElement>
> = ({ href, onClick, ...props }) => {
  const { isBlog } = useIsBlog();

  const onClickAnchor = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (onClick) {
        onClick(event);
      }
      if (isBlog) {
        return;
      }
      Analytics.logEvent('click_inline_link', {
        title: props.children?.toString() || 'unknown',
      });
    },
    [isBlog, onClick, props.children],
  );

  return (
    <a
      href={href}
      onClick={onClickAnchor}
      {...props}
      target="_blank"
      rel="noreferrer"
    >
      {props.children}
    </a>
  );
};

const components: React.ComponentProps<typeof MDXProvider>['components'] = {
  h2: HeadingTwo,
  h3: styled.h3`
    margin-top: 42px;
  `,
  h4: styled.h3`
    margin-top: 42px;
  `,
  h5: styled.h3`
    margin-top: 42px;
  `,
  h6: styled.h3`
    margin-top: 42px;
  `,
  p: styled.p`
    color: rgba(255, 255, 255, 0.9);
  `,
  a: TrackedAnchor,
  code: Code,
  Link,
  ImageList: styled.div`
    width: 100%;
    display: flex;
    gap: 4px;

    & > img {
      width: 50%;
      width: calc((100% - 4px) / 2);
    }

    @media screen and (max-width: 600px) {
      flex-direction: column;
      gap: 6px;

      & > img {
        width: 100%;
      }
    }
  `,
  Image: styled(Image)`
    height: fit-content;
    border: 1px solid;
    border-radius: 4px;
    filter: saturate(1.08);
  `,
  pre: (props: { children?: React.ReactNode }) => <div>{props.children}</div>,
};

export const MDXRenderer: React.FC<PostDocument> = (props) => {
  return <MDXRemote {...props} components={components} />;
};
