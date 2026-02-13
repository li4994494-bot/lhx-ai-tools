import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  Send, 
  BookMarked, 
  BrainCircuit, 
  ArrowLeft, 
  Keyboard, 
  Volume2, 
  Sparkles, 
  Bookmark,
  Check,
  RotateCcw,
  Repeat
} from 'lucide-react';
import { LingoLog, ReviewItem } from '../types';

/* --- Type Definitions for Web Speech API --- */
interface IWindow extends Window {
  webkitSpeechRecognition: any;
}
declare const window: IWindow;

interface LingoMemoProps {
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

const SYSTEM_PROMPT = `
Role: Expert Translator & Language Coach (CN <-> EN).
Task: 
1. DETECT INPUT LANGUAGE.
2. IF CHINESE: Translate to English. Correct ASR errors (e.g. "绷直脚本" -> "绷直脚背").
3. IF ENGLISH: Translate to Chinese. Provide refined English alternatives if the input is unnatural.

STRICT OUTPUT FORMAT (JSON):
You must output a single JSON object. The "translated" field must use the EXACT Markdown headers below based on the detected language.

--- SCENARIO A: Input is CHINESE ---
{
  "translated": "**更简洁、常用版（推荐）**\\n[English Sentence]\\n\\n**地道英文（[Context]）**\\n[Native Expression]\\n\\n**关键说明**\\n[ASR corrections, Vocabulary]",
  "expansions": ["keyword1", "keyword2"]
}

--- SCENARIO B: Input is ENGLISH ---
{
  "translated": "**中文翻译（常用版）**\\n[Natural Chinese Translation]\\n\\n**更地道/自然的表达（优化）**\\n[Refined English or 'Already Natural']\\n\\n**关键说明**\\n[Grammar points, Nuances]",
  "expansions": ["keyword1", "keyword2"]
}

CRITICAL:
- For English input, the first header MUST contain "常用版" so the frontend can display it correctly.
- Do not add extra text outside the JSON. Return JSON only.
`;

const levenshteinDistance = (a: string, b: string): number => {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i]