export const INCOME_CATEGORIES = ["월급", "용돈", "부수입", "기타"] as const;
export const EXPENSE_CATEGORIES = [
  "식비",
  "생활용품",
  "건강",
  "자기개발",
  "문화생활",
  "쇼핑",
] as const;

export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type Category = IncomeCategory | ExpenseCategory;
