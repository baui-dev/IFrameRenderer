import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./IframeWrapper.css";

interface IframeWrapperProps {
  width?: number;
  height?: number;
  children: React.ReactNode;
}

const IframeWrapper: React.FC<IframeWrapperProps> = ({
  width = 800,
  height = 600,
  children,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    const iframeWindow = iframe.contentWindow;
    if (!iframeWindow) return;

    // Create a container for the portal
    const container = iframeWindow.document.createElement("div");
    container.id = "portal-root";
    container.className = "iframe-portal-root";
    iframeWindow.document.body.appendChild(container);

    // Copy all stylesheets from parent window to iframe
    const styleSheets = Array.from(document.styleSheets);
    styleSheets.forEach((styleSheet) => {
      try {
        if (styleSheet.href) {
          // External stylesheets (like Tailwind)
          const linkElement = iframeWindow.document.createElement("link");
          linkElement.rel = "stylesheet";
          linkElement.href = styleSheet.href;
          iframeWindow.document.head.appendChild(linkElement);
        } else if (styleSheet.cssRules) {
          // Inline styles and style tags
          const styleElement = iframeWindow.document.createElement("style");
          Array.from(styleSheet.cssRules).forEach((rule) => {
            styleElement.textContent += rule.cssText + "\n";
          });
          iframeWindow.document.head.appendChild(styleElement);
        }
      } catch (e) {
        console.warn("Could not copy stylesheet:", e);
      }
    });

    // Add base styles for iframe content
    iframeWindow.document.body.className = "iframe-internal-styles";

    // Copy any custom fonts or other resources
    const customElements = document.head.querySelectorAll(
      'link[rel="preconnect"], link[rel="preload"], link[rel="font"]'
    );
    customElements.forEach((element) => {
      const clonedElement = element.cloneNode(true);
      iframeWindow.document.head.appendChild(clonedElement);
    });

    // Set up viewport meta tag
    const viewport = iframeWindow.document.createElement("meta");
    viewport.name = "viewport";
    viewport.content = "width=device-width, initial-scale=1.0";
    iframeWindow.document.head.appendChild(viewport);

    setIframeLoaded(true);

    return () => {
      container.remove();
      Array.from(iframeWindow.document.head.children).forEach((child) =>
        child.remove()
      );
    };
  }, []);

  return (
    <div className="iframe-wrapper" style={{ width, height }}>
      <iframe ref={iframeRef} className="iframe-content" title="Content Frame">
        {iframeLoaded &&
          iframeRef.current?.contentWindow &&
          createPortal(
            children,
            iframeRef.current.contentWindow.document.getElementById(
              "portal-root"
            )!
          )}
      </iframe>
    </div>
  );
};

export default IframeWrapper;
