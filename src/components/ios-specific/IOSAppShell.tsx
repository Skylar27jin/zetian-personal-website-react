// src/components/ios-specific/IOSAppShell.tsx
import React, { type ReactNode } from 'react';
import { isNativeApp } from '../../pkg/platform';
import { usePreventExternalOpen } from '../../hooks/usePreventExternalOpen';

interface AppShellProps {
  children: ReactNode;
}

// 简单版：上面一个 header，下面是内容区域
const AppShell: React.FC<AppShellProps> = ({ children }) => {

    
    usePreventExternalOpen();



  if (!isNativeApp()) {
    // 浏览器里就直接渲染 children，不包一层
    return <>{children}</>;
  }

  return (
    <div className="app-shell">
      {/* 顶部导航栏，可以自定义成你的风格 */}
      <div className="app-shell-header">
        <span className="app-shell-title">Let&apos;s Talk!</span>
      </div>

      {/* 内容区域 */}
      <div className="app-shell-content">
        {children}
      </div>
    </div>
  );
};

export default AppShell;
