// src/components/Editor.tsx
import React, { useEffect, useRef, useState } from "react";
import { EMOJI_MAP } from "../pkg/emojiMap";
import "./Editor.css";
import EmojiPicker from "./EmojiPicker";

interface EditorProps {
  value: string; // 外部值；可包含 :emoji_xxx:
  onChange: (v: string) => void; // 回传占位符文本
  placeholder?: string;
  autoFocus?: boolean;
  minRows?: number;
}

const EMOJI_RE = /:emoji_([a-zA-Z0-9_]+):/g;

const Editor: React.FC<EditorProps> = ({
  value,
  onChange,
  placeholder = "write something~ You can use cute gopher emojis!",
  autoFocus = false,
  minRows = 5,
}) => {
  const divRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  // ================= 工具函数（都放在组件内部，避免 this/作用域问题） =================

  // 创建 emoji <img>
  const createEmojiImg = (name: string) => {
    const src = EMOJI_MAP[name];
    if (!src) return null;
    const img = document.createElement("img");
    img.src = src;
    img.dataset.emoji = name;
    img.className = "emoji-inline";
    img.contentEditable = "false";
    return img;
  };

  // 把一个 TextNode 中的占位符就地替换成 [Text|IMG|Text...]
  const replacePlaceholdersInTextNode = (textNode: Text) => {
    const text = textNode.data;
    if (!EMOJI_RE.test(text)) {
      EMOJI_RE.lastIndex = 0;
      return null;
    }
    EMOJI_RE.lastIndex = 0;

    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    let m: RegExpExecArray | null;

    while ((m = EMOJI_RE.exec(text))) {
      const before = text.slice(lastIndex, m.index);
      if (before) frag.appendChild(document.createTextNode(before));

      const name = m[1];
      const img = createEmojiImg(name);
      if (img) {
        frag.appendChild(img);
      } else {
        frag.appendChild(document.createTextNode(m[0])); // 未知表情保留原样
      }

      lastIndex = EMOJI_RE.lastIndex;
    }

    const tail = text.slice(lastIndex);
    if (tail) frag.appendChild(document.createTextNode(tail));

    const parent = textNode.parentNode!;
    parent.replaceChild(frag, textNode);
    return parent.lastChild; // 便于把光标放在替换末尾
  };

  // 遍历编辑区，把所有 TextNode 里的占位符替换为 IMG
  const replaceAllPlaceholdersInEditor = () => {
    const root = divRef.current;
    if (!root) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const targets: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if ((node as Text).data && EMOJI_RE.test((node as Text).data)) {
        targets.push(node as Text);
      }
      EMOJI_RE.lastIndex = 0;
    }

    let lastReplaced: ChildNode | null = null;
    targets.forEach((t) => {
      const end = replacePlaceholdersInTextNode(t);
      if (end) lastReplaced = end;
    });

    // 若有替换，把光标移到最后一个替换节点之后
    if (lastReplaced) {
      const sel = window.getSelection();
      if (sel) {
        const range = document.createRange();
        range.setStartAfter(lastReplaced);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  };

  // 把 DOM 读回占位符文本
  const readPlainWithEmojis = (): string => {
    const root = divRef.current!;
    const parts: string[] = [];

    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        parts.push((node as Text).data);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.tagName === "BR") {
          parts.push("\n");
          return;
        }
        if (el.tagName === "IMG" && el.dataset.emoji) {
          parts.push(`:emoji_${el.dataset.emoji}:`);
          return;
        }
        for (const child of Array.from(el.childNodes)) walk(child);
        if (el.tagName === "DIV" || el.tagName === "P") parts.push("\n");
      }
    };

    for (const child of Array.from(root.childNodes)) walk(child);
    return parts.join("").replace(/\n+$/g, "");
  };

  // 在光标处插入“纯文本”（函数内部会识别占位符并把它替换为 <img>）
  const insertPlainTextAtCaret = (text: string) => {
    const el = divRef.current;
    if (!el) return;

    el.focus();
    const sel = window.getSelection();
    if (!sel) return;

    if (sel.rangeCount === 0) {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      sel.addRange(range);
    }

    const range = sel.getRangeAt(0);
    range.deleteContents();

    // 按占位符拆分，插入 TextNode / IMG
    let last: Node | null = null;
    const parts = text.split(EMOJI_RE); // 结果：[text, name, text, name, ... , text]
    for (let i = 0; i < parts.length; i++) {
      const chunk = parts[i];
      if (i % 2 === 0) {
        if (chunk) {
          const t = document.createTextNode(chunk);
          range.insertNode(t);
          last = t;
          range.setStartAfter(t);
          range.collapse(true);
        }
      } else {
        const name = chunk;
        const img = createEmojiImg(name);
        if (img) {
          range.insertNode(img);
          last = img;
          range.setStartAfter(img);
          range.collapse(true);
        } else {
          const fallback = document.createTextNode(`:emoji_${name}:`);
          range.insertNode(fallback);
          last = fallback;
          range.setStartAfter(fallback);
          range.collapse(true);
        }
      }
    }

    sel.removeAllRanges();
    sel.addRange(range);
    return last;
  };

  // 取光标左/右侧“叶子”节点（用于 Backspace/Delete 一次删掉整张表情）
  const getPrevLeaf = (container: Node, offset: number): Node | null => {
    if (container.nodeType === Node.TEXT_NODE && offset > 0) return container;
    let node: Node | null = container;
    if (node.nodeType === Node.ELEMENT_NODE && offset > 0) {
      node = (node as Element).childNodes[offset - 1] || null;
    } else {
      while (node && !node.previousSibling) node = node.parentNode;
      node = node?.previousSibling || null;
    }
    if (!node) return null;
    while ((node as any) && (node as Node).lastChild)
      node = (node as Node).lastChild!;
    return node;
  };

  const getNextLeaf = (container: Node, offset: number): Node | null => {
    if (container.nodeType === Node.TEXT_NODE) {
      const text = container as Text;
      if (offset < text.data.length) return container;
    }
    let node: Node | null = container;
    if (node.nodeType === Node.ELEMENT_NODE) {
      node = (node as Element).childNodes[offset] || null;
    } else {
      while (node && !node.nextSibling) node = node.parentNode;
      node = node?.nextSibling || null;
    }
    if (!node) return null;
    while ((node as any) && (node as Node).firstChild)
      node = (node as Node).firstChild!;
    return node;
  };

  // ================= 生命周期 & 事件 =================

  // 外部 value -> 初次/外部更新渲染（把占位符渲染为 IMG）
  useEffect(() => {
    const el = divRef.current;
    if (!el) return;

    const current = readPlainWithEmojis();
    if (current === value) return;

    el.innerHTML = ""; // 仅当外部驱动变更时重建
    if (!value) return;

    const parts = value.split(EMOJI_RE);
    for (let i = 0; i < parts.length; i++) {
      const chunk = parts[i];
      if (i % 2 === 0) {
        if (chunk) el.appendChild(document.createTextNode(chunk));
      } else {
        const name = chunk;
        const img = createEmojiImg(name);
        if (img) el.appendChild(img);
        else el.appendChild(document.createTextNode(`:emoji_${name}:`));
      }
    }

    if (autoFocus) {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [value, autoFocus]); // 外部驱动

  // 输入：合成中不处理；结束后统一替换
  const handleInput = () => {
    if (isComposing) return;
    onChange(readPlainWithEmojis());
    replaceAllPlaceholdersInEditor();
  };

  const handlePaste: React.ClipboardEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    insertPlainTextAtCaret(text);
    replaceAllPlaceholdersInEditor();
    onChange(readPlainWithEmojis());
  };

  // 键盘删除：Backspace/Delete 一次删掉整张表情
  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key !== "Backspace" && e.key !== "Delete") return;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    if (!range.collapsed) return; // 有选区则用默认行为

    let target: Node | null = null;

    if (e.key === "Backspace") {
      const left = getPrevLeaf(range.startContainer, range.startOffset);
      if (
        left &&
        left.nodeType === Node.ELEMENT_NODE &&
        (left as HTMLElement).tagName === "IMG" &&
        (left as HTMLElement).dataset.emoji
      ) {
        target = left;
      }
    } else {
      const right = getNextLeaf(range.startContainer, range.startOffset);
      if (
        right &&
        right.nodeType === Node.ELEMENT_NODE &&
        (right as HTMLElement).tagName === "IMG" &&
        (right as HTMLElement).dataset.emoji
      ) {
        target = right;
      }
    }

    if (target) {
      const parent = target.parentNode!;
      parent.removeChild(target);

      // 保持光标位置
      const newRange = document.createRange();
      newRange.setStart(range.startContainer, range.startOffset);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);

      onChange(readPlainWithEmojis());
      e.preventDefault();
    }
  };

  // 点击外部关闭面板
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // 插入 emoji：先插 token，再就地替换成 IMG
  const insertEmoji = (name: string) => {
    const token = `:emoji_${name}:`;
    insertPlainTextAtCaret(token);
    replaceAllPlaceholdersInEditor();
    onChange(readPlainWithEmojis());
    setShowPicker(false);
  };

  // ================= 渲染 =================

  return (
    <div className="editor-wrapper" ref={wrapperRef}>
      {/* emoji picker */}
      <div className="editor-toolbar" style={{ position: "relative" }}>
        <button
          type="button"
          className="editor-emoji-toggle"
          onClick={() => setShowPicker((s) => !s)}
        >
          😀 Emoji
        </button>

        <EmojiPicker
          open={showPicker}
          onClose={() => setShowPicker(false)}
          onSelect={(key) => {
            // 复用你现有逻辑：插入 token -> 替换成 IMG -> 同步占位符文本
            const token = `:emoji_${key}:`;
            insertPlainTextAtCaret(token);
            replaceAllPlaceholdersInEditor();
            onChange(readPlainWithEmojis());
            setShowPicker(false);
          }}
          anchor="left" // or "right"
          searchable={false} // 需要搜索时改成 true
        />
      </div>

      {/* 输入区 */}
      <div
        ref={divRef}
        className="editor-editable"
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        style={{ minHeight: `${minRows * 1.5}em` }}
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => {
          setIsComposing(false);
          replaceAllPlaceholdersInEditor();
          onChange(readPlainWithEmojis());
        }}
      />
    </div>
  );
};

export default Editor;
