// src/components/GopherLoader.tsx
import React from "react";
import "./GopherLoader.css";

interface GopherLoaderProps {
  size?: number;       // gopher 大小，默认 96px
  fullScreen?: boolean; // 是否全屏居中
}

const GopherLoader: React.FC<GopherLoaderProps> = ({
  size = 96,
  fullScreen = false,
}) => {
const img = (
  <div className="gopher-loader">
    <div className="gopher-crop">
      <div className="gopher-align-bottom">
        <img
          src="/gopher-dance-long-3x.gif"
          alt="Loading..."
          className="gopher-loader__img"
        />
      </div>
    </div>
  </div>
);




  if (fullScreen) {
    return (
      <div className="gopher-loader-fullscreen">
        {img}
      </div>
    );
  }
  return img;
};

export default GopherLoader;