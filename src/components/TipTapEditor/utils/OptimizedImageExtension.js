import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import OptimizedImage from "../../OptimizedImage";

export const OptimizedImageExtension = Node.create({
  name: "optimizedImage",

  addOptions() {
    return {
      inline: false,
      allowBase64: true,
      HTMLAttributes: {},
    };
  },

  inline() {
    return this.options.inline;
  },

  group() {
    return this.options.inline ? "inline" : "block";
  },

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
      loading: {
        default: "lazy",
      },
      priority: {
        default: false,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "img[src]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(({ node, updateAttributes, deleteNode }) => {
      const { src, alt, title, width, height, loading, priority } = node.attrs;

      return (
        <div className="optimized-image-node">
          <OptimizedImage
            src={src}
            alt={alt || ""}
            title={title}
            width={width ? parseInt(width) : undefined}
            height={height ? parseInt(height) : undefined}
            priority={priority}
            style={{
              maxWidth: "100%",
              height: "auto",
              borderRadius: "4px",
            }}
            onError={() => {
              console.warn("Image failed to load:", src);
            }}
          />

          {}
          <div
            className="image-controls"
            style={{
              position: "absolute",
              top: "4px",
              right: "4px",
              opacity: 0,
              transition: "opacity 0.2s ease",
              display: "flex",
              gap: "4px",
            }}
          >
            <button
              onClick={() => {
                const newSrc = prompt("Enter new image URL:", src);
                if (newSrc) {
                  updateAttributes({ src: newSrc });
                }
              }}
              style={{
                padding: "4px 8px",
                fontSize: "12px",
                backgroundColor: "rgba(0,0,0,0.7)",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Edit
            </button>
            <button
              onClick={deleteNode}
              style={{
                padding: "4px 8px",
                fontSize: "12px",
                backgroundColor: "rgba(231, 76, 60, 0.8)",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>

          <style jsx>{`
            .optimized-image-node {
              position: relative;
              display: inline-block;
              margin: "8px 0";
            }
            .optimized-image-node:hover .image-controls {
              opacity: 1 !important;
            }
          `}</style>
        </div>
      );
    });
  },

  addCommands() {
    return {
      setImage:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
