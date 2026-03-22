"use client";

import { useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";

const translationCache = new Map<string, string>();
const pendingCache = new Map<string, Promise<string>>();

function shouldTranslateText(text: string) {
  const value = text.trim();
  if (!value) return false;
  if (/^(https?:\/\/|www\.)/i.test(value)) return false;
  if (/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(value)) return false;
  if (!/[A-Za-z]/.test(value)) return false;
  return true;
}

function collectTextNodes(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const result: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    const node = current as Text;
    const parent = node.parentElement;
    const text = node.nodeValue ?? "";
    if (
      parent &&
      parent.tagName !== "SCRIPT" &&
      parent.tagName !== "STYLE" &&
      parent.tagName !== "NOSCRIPT" &&
      !parent.closest("[data-no-translate='true']") &&
      shouldTranslateText(text)
    ) {
      result.push(node);
    }
    current = walker.nextNode();
  }
  return result;
}

function collectTranslatableAttributes(root: ParentNode) {
  const attributes = ["placeholder", "title", "aria-label", "value"] as const;
  const items: Array<{ element: Element; name: (typeof attributes)[number]; value: string }> = [];
  const nodes = root instanceof Element ? [root, ...Array.from(root.querySelectorAll("*"))] : Array.from(document.querySelectorAll("*"));
  for (const element of nodes) {
    if (element.closest("[data-no-translate='true']")) continue;
    for (const name of attributes) {
      const value = element.getAttribute(name);
      if (value && shouldTranslateText(value)) {
        items.push({ element, name, value });
      }
    }
  }
  return items;
}

async function fetchTranslation(text: string) {
  const cached = translationCache.get(text);
  if (cached) return cached;
  const pending = pendingCache.get(text);
  if (pending) return pending;

  const request = fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts: [text], target: "hr" }),
  })
    .then(async (response) => {
      if (!response.ok) return text;
      const json = (await response.json()) as { translations?: string[] };
      const translated = json.translations?.[0] ?? text;
      translationCache.set(text, translated);
      pendingCache.delete(text);
      return translated;
    })
    .catch(() => {
      pendingCache.delete(text);
      return text;
    });

  pendingCache.set(text, request);
  return request;
}

async function translateDom(root: ParentNode) {
  const textNodes = collectTextNodes(root);
  const attributeNodes = collectTranslatableAttributes(root);
  const uniqueTexts = new Set<string>();
  for (const node of textNodes) uniqueTexts.add((node.nodeValue ?? "").trim());
  for (const item of attributeNodes) uniqueTexts.add(item.value.trim());

  const translationMap = new Map<string, string>();
  for (const text of uniqueTexts) {
    if (!shouldTranslateText(text)) continue;
    const translated = await fetchTranslation(text);
    translationMap.set(text, translated);
  }

  for (const node of textNodes) {
    const original = (node.nodeValue ?? "").trim();
    const translated = translationMap.get(original);
    if (translated && translated !== original) node.nodeValue = (node.nodeValue ?? "").replace(original, translated);
  }

  for (const item of attributeNodes) {
    const translated = translationMap.get(item.value.trim());
    if (translated && translated !== item.value.trim()) {
      item.element.setAttribute(item.name, translated);
    }
  }
}

export function RuntimeTextTranslator() {
  const { locale } = useLocale();

  useEffect(() => {
    if (locale !== "hr") return;
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      await translateDom(document.body);
    };

    run();

    const observer = new MutationObserver((records) => {
      if (cancelled) return;
      const nodes = new Set<ParentNode>();
      for (const record of records) {
        if (record.type === "childList") {
          record.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
              nodes.add((node as ParentNode).nodeType === Node.TEXT_NODE ? (node.parentNode as ParentNode) : (node as ParentNode));
            }
          });
        } else if (record.target) {
          nodes.add(record.target as ParentNode);
        }
      }
      nodes.forEach((node) => {
        if (node) void translateDom(node);
      });
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "title", "aria-label", "value"],
    });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [locale]);

  return null;
}
