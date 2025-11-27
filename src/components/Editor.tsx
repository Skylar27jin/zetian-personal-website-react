// src/components/Editor.tsx
import React, { useEffect, useRef, useState } from "react";
import { EMOJI_MAP } from "../pkg/emojiMap";
import "./Editor.css";
import EmojiPicker from "./EmojiPicker";
import ScrollablePanel from "./ScrollPanel";

interface EditorProps {
  value: string; // 外部值；可包含 :emoji_xxx:
  onChange: (v: string) => void; // 回传占位符文本
  placeholder?: string;
  autoFocus?: boolean;
  minRows?: number;
}

// 只保留 pattern，本地按需 new RegExp，避免 lastIndex 副作用
const EMOJI_PATTERN = ":emoji_([a-zA-Z0-9_]+):";

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

  // ======= Undo 栈：简单记录纯文本 value 的历史 =======
  const undoStackRef = useRef<string[]>([]);
  const undoIndexRef = useRef<number>(-1);
  const isRestoringRef = useRef(false);

  // ================= 工具函数 =================


  // 把新的纯文本状态记录进 undo 栈
  const pushHistory = (nextValue: string) => {
    if (!divRef.current) return;
    if (isRestoringRef.current) return; // 撤销过程中不要再入栈

    const stack = undoStackRef.current;
    let idx = undoIndexRef.current;

    // 第一次
    if (stack.length === 0) {
      stack.push(nextValue);
      undoIndexRef.current = 0;
      return;
    }

    // 和当前顶一样就不重复压
    if (stack[idx] === nextValue) return;

    // 如果之前做过撤销，现在再输入新内容 -> 抛弃 redo 分支
    if (idx < stack.length - 1) {
      stack.splice(idx + 1);
    }

    stack.push(nextValue);
    undoIndexRef.current = stack.length - 1;

    // 简单限制一下长度，例如 100
    const MAX_HISTORY = 100;
    if (stack.length > MAX_HISTORY) {
      stack.shift();
      undoIndexRef.current = stack.length - 1;
    }
  };

  // 根据纯文本状态，重建编辑区 DOM（用于 Ctrl+Z 撤销）
  const applyPlainToEditor = (plain: string) => {
    const el = divRef.current;
    if (!el) return;

    el.innerHTML = "";
    if (!plain) {
      ensureEmojiAnchors();
      return;
    }

    const re = new RegExp(EMOJI_PATTERN, "g");
    const parts = plain.split(re);

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

    ensureEmojiAnchors();

    // 光标移到末尾
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  };




  // 创建 emoji <img>
  const createEmojiImg = (name: string) => {
    const src = EMOJI_MAP[name];
    if (!src) return null;
    const img = document.createElement("img");
    img.src = src;
    img.dataset.emoji = name;
    img.className = "emoji-inline";
    return img;
  };

  // 如果编辑区里只有一只 emoji，没有任何文本，给前后各塞一个零宽空格，方便光标停靠
  const ensureEmojiAnchors = () => {
    const root = divRef.current;
    if (!root) return;

    const imgs = root.querySelectorAll("img[data-emoji]");
    // 只在“只有一只 emoji 且没有其它文本”的情况下兜底
    if (
      imgs.length === 1 &&
      root.childNodes.length === 1 &&    // 只有这一只 IMG
      (root.textContent ?? "").trim() === ""
    ) {
      const img = imgs[0];
      const before = document.createTextNode("\u200B");
      const after = document.createTextNode("\u200B");

      root.insertBefore(before, img);
      if (img.nextSibling) {
        root.insertBefore(after, img.nextSibling);
      } else {
        root.appendChild(after);
      }
    }
  };


  // 把一个 TextNode 中的占位符就地替换成 [Text|IMG|Text...]
  const replacePlaceholdersInTextNode = (textNode: Text) => {
    const text = textNode.data;
    const re = new RegExp(EMOJI_PATTERN, "g");
    if (!re.test(text)) return null;
    re.lastIndex = 0;

    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    let m: RegExpExecArray | null;

    while ((m = re.exec(text))) {
      const before = text.slice(lastIndex, m.index);
      if (before) frag.appendChild(document.createTextNode(before));

      const name = m[1];
      const img = createEmojiImg(name);
      if (img) {
        frag.appendChild(img);
      } else {
        // 未知表情保留原样
        frag.appendChild(document.createTextNode(m[0]));
      }

      lastIndex = re.lastIndex;
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
      const textNode = node as Text;
      const text = textNode.data;
      if (!text) continue;

      const re = new RegExp(EMOJI_PATTERN, "g");
      if (re.test(text)) {
        targets.push(textNode);
      }
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
  const readPlainWithEmojis = (root: HTMLElement | null): string => {
    if (!root) return "";
    const parts: string[] = [];

    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const data = (node as Text).data;
        // 忽略我们自己塞的零宽空格锚点
        if (data === "\u200B") return;
        parts.push(data);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName;

        if (tag === "BR") {
          parts.push("\n");
          return;
        }

        if (tag === "IMG" && el.dataset.emoji) {
          parts.push(`:emoji_${el.dataset.emoji}:`);
          return;
        }

        for (const child of Array.from(el.childNodes)) walk(child);

        if (tag === "DIV" || tag === "P") {
          parts.push("\n");
        }
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

    const re = new RegExp(EMOJI_PATTERN, "g");
    const parts = text.split(re); // [text, name, text, name, ..., text]

    for (let i = 0; i < parts.length; i++) {
      const chunk = parts[i];

      if (i % 2 === 0) {
        // 普通文本
        if (chunk) {
          const t = document.createTextNode(chunk);
          range.insertNode(t);
          range.setStartAfter(t);
          range.collapse(true);
        }
      } else {
        // 表情名
        const name = chunk;
        const img = createEmojiImg(name);
        if (img) {
          range.insertNode(img);
          range.setStartAfter(img);
          range.collapse(true);
        } else {
          const fallback = document.createTextNode(`:emoji_${name}:`);
          range.insertNode(fallback);
          range.setStartAfter(fallback);
          range.collapse(true);
        }
      }
    }

    sel.removeAllRanges();
    sel.addRange(range);
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

    while ((node as Node).lastChild) {
      node = (node as Node).lastChild!;
    }
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

    while ((node as Node).firstChild) {
      node = (node as Node).firstChild!;
    }
    return node;
  };

  // ================= 生命周期 & 事件 =================

  // 外部 value -> 初次/外部更新渲染（把占位符渲染为 IMG）
  useEffect(() => {
    const el = divRef.current;
    if (!el) return;

    const current = readPlainWithEmojis(el);
    if (current === value) return;

    el.innerHTML = "";
    if (!value) return;

    const re = new RegExp(EMOJI_PATTERN, "g");
    const parts = value.split(re);

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
    ensureEmojiAnchors();
    if (autoFocus) {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [value, autoFocus]);

  // 输入：合成中不处理；结束后统一替换
  const handleInput = () => {
    if (isComposing) return;
    const plain = readPlainWithEmojis(divRef.current);
    pushHistory(plain);
    onChange(plain);
    replaceAllPlaceholdersInEditor();
    ensureEmojiAnchors();
  };

  const handlePaste: React.ClipboardEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();

    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain") || "";

    let insertText = text;

    if (html && html.includes("data-emoji=")) {
      const temp = document.createElement("div");
      temp.innerHTML = html;

      // 把 IMG[data-emoji] -> :emoji_xxx:，并去掉「前导空白/换行」
      const raw = readPlainWithEmojis(temp);
      insertText = raw.replace(/^\s+/, "");  // 关键：干掉开头那一坨 \n / 空格
    } else {
      // 兜底优化：如果纯文本刚好是一个表情名，也当成 emoji 处理
      const trimmed = text.trim();
      if (trimmed && EMOJI_MAP[trimmed]) {
        insertText = `:emoji_${trimmed}:`;
      }
    }


    insertPlainTextAtCaret(insertText);
    replaceAllPlaceholdersInEditor();
    ensureEmojiAnchors();
    const plain = readPlainWithEmojis(divRef.current);
    pushHistory(plain);
    onChange(plain);
  };

  // 键盘：Backspace/Delete 删除整张 emoji；ArrowLeft/Right 跳过整张 emoji
  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
// ========= Ctrl/Cmd + Z：撤销 =========
    if ((e.key === "z" || e.key === "Z") && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();

      const stack = undoStackRef.current;
      let idx = undoIndexRef.current;

      if (stack.length === 0 || idx <= 0) {
        return;
      }

      idx -= 1;
      undoIndexRef.current = idx;
      const prev = stack[idx];

      isRestoringRef.current = true;
      applyPlainToEditor(prev);
      onChange(prev);
      isRestoringRef.current = false;

      return; // 不再继续处理别的键盘逻辑
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);

    // 有选区时，统一交给浏览器默认行为处理选中区域
    if (!range.collapsed) return;

    // ========= 方向键：在 emoji 旁边时一次跳过整个 token =========
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      let target: Node | null = null;

      if (e.key === "ArrowLeft") {
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

      const newRange = document.createRange();
      newRange.setStart(range.startContainer, range.startOffset);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);

      ensureEmojiAnchors();
      const plain = readPlainWithEmojis(divRef.current);
      pushHistory(plain);
      onChange(plain);
      e.preventDefault();
    }


      return; // 已处理方向键，直接返回
    }

    // ========= 删除键：Backspace/Delete 一次删掉整张表情 =========
    if (e.key !== "Backspace" && e.key !== "Delete") return;

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

      const newRange = document.createRange();
      newRange.setStart(range.startContainer, range.startOffset);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);

      onChange(readPlainWithEmojis(divRef.current));
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
    ensureEmojiAnchors();
    const plain = readPlainWithEmojis(divRef.current);
    pushHistory(plain);
    onChange(plain);
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
          Emoji
        </button>

        <EmojiPicker
          open={showPicker}
          onClose={() => setShowPicker(false)}
          onSelect={insertEmoji}
          anchor="left"
          searchable={false}
        />
      </div>

      {/* 输入区 */}
      <ScrollablePanel maxHeight="50vh" showProgress>
        <div
          ref={divRef}
          className="editor-editable"
          contentEditable
          suppressContentEditableWarning
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
            ensureEmojiAnchors();
            const plain = readPlainWithEmojis(divRef.current);
            pushHistory(plain);
            onChange(plain);
          }}
        />
      </ScrollablePanel>
    </div>
  );
};

export default Editor;