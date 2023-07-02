import { FC, ReactNode, useRef, useEffect, useState, useCallback, useId, memo, isValidElement, SyntheticEvent } from 'react';
import { ErrorBoundary } from '../common/ErrorBoundary';
import Tooltip from '../tooltip/Tooltip';
import {
  ELLIPSIS,
  isEqual,
  elementIsVisibleInViewport,
  buildTruncated,
} from '../utils';
import './TextTruncate.scss';

type TextTruncateProps = {
  children: ReactNode
  tailLength: number
  title?: string
  className?: string
}

const TextTruncate: FC<TextTruncateProps> = ({ children, tailLength = 0, title = '', className = '' }) => {
  const elementId = useId();
  const originalTextRef = useRef<HTMLDivElement | null>(null);
  const textToRenderRef = useRef<HTMLDivElement | null>(null);
  const scopeRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isElementIntersecting, setIsElementIntersecting] = useState(false);

  const getTextWidth = (text: string): number => {
    const assumedTextWidth = canvasRef?.current?.measureText(text).width || 0;
    return Math.ceil(assumedTextWidth);
  }

  const shouldRenderTruncate = useCallback((): boolean => {
    return !!tailLength && !isValidElement(children);
  }, [tailLength, children])

  const updateCanvasStyles = () => {
    if (scopeRef.current) {
      const style = window.getComputedStyle(scopeRef.current as Element);
      const font = [
        style.getPropertyValue('font-weight'),
        style.getPropertyValue('font-style'),
        style.getPropertyValue('font-size'),
        style.getPropertyValue('font-family'),
      ].join(' ');

      if (canvasRef.current) {
        canvasRef.current.font = font;
      }
    }
  };

  const setTextToRender = (text: string): void => {
    if (!textToRenderRef.current) {
      return;
    }
    textToRenderRef.current.innerText = text;
  }

  /**
   * Quick way to calculate the width of the truncated text by ratio to fill the container
   */
  const truncateTextByWidthRatio = useCallback((
    text: string,
    containerWidth: number,
    textWidth: number,
    tailText: string
  ): string => {
    const containerTextRatio = Math.round(((containerWidth / textWidth) + Number.EPSILON) * 100) / 100;
    const len = text.length - ELLIPSIS.length;
    const textTruncateIndex = Math.floor(len * containerTextRatio);
    let slice = textTruncateIndex - ELLIPSIS.length;
  
    if (textWidth > containerWidth) {
      let truncatedText = buildTruncated(text, slice, tailText);
      while (getTextWidth(truncatedText) > containerWidth && slice >= 0) {
        truncatedText = buildTruncated(text, slice--, tailText);
      }
      return truncatedText;
    }

    return text;
  }, [])

  const getOriginalText = (): string => {
    return originalTextRef.current?.textContent || '';
  }

  /**
   * Calculate truncated text to display
   * 1 - if no original text -> do nothing
   * 2 - if no container -> do nothing
   * 3 - if container width is greater than original text width -> display original text
   * 4 - if container width is less than 'ellipsis + tailText' -> leave only tail text and 'overflow:hidden'
   * 5 - otherwise do the truncation calculation
   */
  const calcTargetWidth = useCallback((scopeWidth: number): void => {
    if (!originalTextRef.current) {
      return;
    }

    if (!scopeWidth) {
      setTextToRender('');
      return;
    }

    const originalText = getOriginalText();
    let fullTextWidth = getTextWidth(originalText);
    if (scopeWidth > fullTextWidth || isEqual(scopeWidth, fullTextWidth)) {
      setTextToRender(originalText);
      return;
    }

    const originalTextLength = originalText.length;
    if (tailLength > originalTextLength) {
      setTextToRender(originalText);
      return;
    }

    const tailText = originalText.slice(-tailLength);
    const tailEllipsisWidth = getTextWidth(ELLIPSIS + tailText);
    if (scopeWidth < tailEllipsisWidth) {
      setTextToRender(tailText);
      return;
    }

    const toDisplay = truncateTextByWidthRatio(originalText, scopeWidth, fullTextWidth, tailText);
    setTextToRender(toDisplay);
  }, [tailLength, truncateTextByWidthRatio])

  useEffect(() => {
    if (shouldRenderTruncate()) {
      // Create phantom canvas to track the font chnages
      const canvas = document.createElement('canvas');
      const canvasContext = canvas.getContext('2d');
      canvasRef.current = canvasContext;
      updateCanvasStyles();
    }
  }, [shouldRenderTruncate])

  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;

    if (shouldRenderTruncate()) {
      resizeObserver = new ResizeObserver(entries => {
        const [rootEntry] = entries;
        // Reassure that the element is within the viewport to eliminate unnecessary calculations and reflows
        if (elementIsVisibleInViewport(scopeRef.current, true)) {
          // Wrap in requestAnimationFrame to avoid the error - ResizeObserver loop limit exceeded
          window.requestAnimationFrame(() => {
            if (!Array.isArray(entries) || !entries.length) {
              return;
            }

            const { contentRect } = rootEntry;
            if (contentRect) {
              // Taking the width via 'parentRef.current.getBoundingClientRect().width' triggers
              // additional reflows and slower UI, take width from ResizeObserver
              calcTargetWidth(contentRect.width);
            }
          });
        }
      });

      if (scopeRef.current) {
        if (isElementIntersecting) {
          resizeObserver.observe(scopeRef.current);
        } else {
          // Skip unnecessary resize tracking for the elements outside the viewport
          resizeObserver.unobserve(scopeRef.current);
        }
      }
    }

    return () => {
      resizeObserver?.disconnect();
    }
  }, [isElementIntersecting, calcTargetWidth, shouldRenderTruncate])

  useEffect(() => {
    // Check if the element appears in the viewport to adjust the text width and ellipsis
    let observer: IntersectionObserver | null = null;

    if (shouldRenderTruncate()) {
      const options = {
        root: null,
        rootMargin: '0px',
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
      };

      const observer = new IntersectionObserver(([entry]) => {
        const { isIntersecting, boundingClientRect: { width } } = entry;
        setIsElementIntersecting(isIntersecting);

        if (isIntersecting) {
          calcTargetWidth(width);
        }
      }, options);

      if (scopeRef.current) {
        observer.observe(scopeRef.current);
      }
    }

    return () => {
      observer?.disconnect();
    };
  }, [calcTargetWidth, shouldRenderTruncate])

  const handleInput = (e: SyntheticEvent): void => {
    setTextToRender(getOriginalText());
    e.preventDefault();
  }

  const handleMouseDown = (): void => {
    setTextToRender(getOriginalText());
  }

  if (!shouldRenderTruncate()) {
    return (
      <Tooltip text={title}>
        <div className='text-truncate-no-tail'>{children}</div>
      </Tooltip>
    );
  }

  return (
    <Tooltip text={title}>
      <div id={`text-truncate-${elementId}`} ref={scopeRef} className={`text-truncate ${className}`}>
        <div ref={originalTextRef}>{children}</div>
        {/** Remove above node when original text is initialised */}
        <div ref={textToRenderRef}
          contentEditable={true}
          onInput={handleInput}
          onMouseDown={handleMouseDown}
          className='text-truncate-content'
        />
      </div>
    </Tooltip>
  );
}

const TextTruncateWithErrorBoundary: FC<
  TextTruncateProps
> = (props) => (
  <ErrorBoundary>
    <TextTruncate {...props} />
  </ErrorBoundary>
)

export default memo(TextTruncateWithErrorBoundary);
