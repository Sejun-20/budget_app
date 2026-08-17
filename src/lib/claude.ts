import Anthropic from "@anthropic-ai/sdk";
import { getExpenseCategoryNames } from "./categories";
import { getApiKey } from "./apiKey";
import { getDefaultPaymentMethod } from "./settings";
import type { SupportedImageMediaType } from "./image";

const HAIKU_MODEL = "claude-haiku-4-5-20251001";
const FALLBACK_MODEL = "claude-sonnet-5";

function getClient(): Anthropic {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Claude API 키가 설정되지 않았습니다. 설정에서 입력해주세요.");
  // Direct browser calls are an officially supported (if discouraged) mode
  // for "bring your own API key" client-side apps — the key never leaves
  // this device except in the request to Anthropic itself.
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

export interface ReceiptDraft {
  merchant: string;
  date: string;
  amount: number;
  category: string;
  memo: string;
  paymentMethod: "cash" | "card";
}

function buildExtractTool(categoryNames: string[], fallbackPaymentMethod: "cash" | "card"): Anthropic.Tool {
  return {
    name: "extract_receipt",
    description: "영수증 사진에서 상호명, 날짜, 총액, 카테고리, 결제수단, 메모를 추출합니다.",
    input_schema: {
      type: "object",
      properties: {
        merchant: {
          type: "string",
          description: "상호명. 알아볼 수 없으면 빈 문자열.",
        },
        date: {
          type: "string",
          description: "거래 날짜, YYYY-MM-DD 형식. 연도가 영수증에 없으면 오늘 날짜의 연도로 추정.",
        },
        amount: {
          type: "integer",
          description: "총 결제 금액 (원화 기준 정수, 콤마/원 기호 제외).",
        },
        category: {
          type: "string",
          enum: categoryNames,
          description: "다음 중 가장 적절한 지출 카테고리 하나: " + categoryNames.join(", "),
        },
        paymentMethod: {
          type: "string",
          enum: ["cash", "card"],
          description:
            "결제수단. 영수증에 '카드', '승인번호', 카드사명 등 카드결제 흔적이 있으면 card, '현금', '현금(영수증)', '현금결제'처럼 현금 결제임이 명시되어 있으면 cash. 판단이 애매하면 " +
            fallbackPaymentMethod +
            "로 추정.",
        },
        memo: {
          type: "string",
          description: "구매 품목 등 참고할 메모. 없으면 빈 문자열.",
        },
      },
      required: ["merchant", "date", "amount", "category", "paymentMethod", "memo"],
    },
  };
}

function isValidDraft(input: unknown, categoryNames: string[]): input is ReceiptDraft {
  if (!input || typeof input !== "object") return false;
  const d = input as Record<string, unknown>;
  return (
    typeof d.merchant === "string" &&
    typeof d.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(d.date) &&
    typeof d.amount === "number" &&
    Number.isFinite(d.amount) &&
    d.amount > 0 &&
    typeof d.category === "string" &&
    categoryNames.includes(d.category) &&
    (d.paymentMethod === "cash" || d.paymentMethod === "card") &&
    typeof d.memo === "string"
  );
}

async function callExtract(
  model: string,
  base64: string,
  mediaType: SupportedImageMediaType,
  categoryNames: string[],
  fallbackPaymentMethod: "cash" | "card"
): Promise<ReceiptDraft | null> {
  const response = await getClient().messages.create({
    model,
    max_tokens: 1024,
    tools: [buildExtractTool(categoryNames, fallbackPaymentMethod)],
    tool_choice: { type: "tool", name: "extract_receipt" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          {
            type: "text",
            text: "이 영수증 사진에서 정보를 추출해 extract_receipt 도구를 호출하세요.",
          },
        ],
      },
    ],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse || !isValidDraft(toolUse.input, categoryNames)) return null;
  return toolUse.input;
}

/**
 * Extracts structured receipt data via Claude Vision, called directly from
 * the browser. Tries Haiku first (cheap/fast); on any failure or
 * low-confidence (invalid/unparseable) result, retries once with Sonnet.
 */
export async function extractReceipt(
  base64: string,
  mediaType: SupportedImageMediaType
): Promise<ReceiptDraft> {
  const [categoryNames, fallbackPaymentMethod] = await Promise.all([
    getExpenseCategoryNames(),
    getDefaultPaymentMethod(),
  ]);

  try {
    const draft = await callExtract(HAIKU_MODEL, base64, mediaType, categoryNames, fallbackPaymentMethod);
    if (draft) return draft;
  } catch {
    // fall through to the fallback model
  }

  const fallbackDraft = await callExtract(FALLBACK_MODEL, base64, mediaType, categoryNames, fallbackPaymentMethod);
  if (fallbackDraft) return fallbackDraft;

  throw new Error("영수증 정보를 추출하지 못했습니다.");
}
