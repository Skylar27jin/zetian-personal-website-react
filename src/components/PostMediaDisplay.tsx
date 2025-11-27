// src/components/PostMediaDisplay.tsx
import React, { useState } from "react";
import { Carousel } from "react-bootstrap";
import "./PostMediaDisplay.css";
import ViewMedia from "./ViewMedia";

interface PostMediaCarouselProps {
  mediaType: string;
  mediaUrls: string[];
}

const PostMediaDisplay: React.FC<PostMediaCarouselProps> = ({
  mediaType,
  mediaUrls,
}) => {
  if (!mediaUrls || mediaUrls.length === 0) return null;

  const [activeIndex, setActiveIndex] = useState(0);

  // 大图预览状态
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  if (mediaType === "image") {
    const showCarouselChrome = mediaUrls.length > 1;

    return (
      <>
        <div className="post-media-display mb-4">
          <Carousel
            activeIndex={activeIndex}
            onSelect={(index) => setActiveIndex(index)}
            indicators={showCarouselChrome}
            controls={showCarouselChrome}
            interval={null}
            variant="dark"
            prevIcon={
              <span
                className="post-media-display-arrow"
                aria-hidden="true"
              >
                ‹
              </span>
            }
            nextIcon={
              <span
                className="post-media-display-arrow"
                aria-hidden="true"
              >
                ›
              </span>
            }
          >
            {mediaUrls.map((url, idx) => (
              <Carousel.Item key={url || idx}>
                <div className="post-media-display-inner">
                  <img
                    src={url}
                    alt={`post image ${idx + 1}`}
                    style={{ cursor: "zoom-in" }}
                    onClick={() => {
                      setViewerIndex(idx);
                      setViewerOpen(true);
                    }}
                  />
                </div>
              </Carousel.Item>
            ))}
          </Carousel>

          {/* 右上角 1/10 */}
          {showCarouselChrome && (
            <div className="post-media-display-counter">
              {activeIndex + 1}/{mediaUrls.length}
            </div>
          )}
        </div>

        {/* 大图预览 */}
        <ViewMedia
          open={viewerOpen}
          mediaType="image"
          mediaUrls={mediaUrls}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      </>
    );
  }

  if (mediaType === "video") {
    return (
      <>
        <div className="post-media-display mb-4">
          <div className="post-media-display-inner">
            <video
              controls
              src={mediaUrls[0]}
              className="post-media-video"
              style={{ cursor: "zoom-in" }}
              onClick={() => {
                setViewerIndex(0);
                setViewerOpen(true);
              }}
            />
          </div>
        </div>

        <ViewMedia
          open={viewerOpen}
          mediaType="video"
          mediaUrls={mediaUrls}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      </>
    );
  }

  return null;
};

export default PostMediaDisplay;
