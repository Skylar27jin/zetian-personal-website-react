// src/types/category.ts

// 和后端 category.Category 一一对应
export interface Category {
  id: number;
  name: string;
  key: string;
  aliases: string[];      // list<string>
  description: string;
}

// 和 category.GetAllCategoriesReq 对应（空结构体，用不到字段）
export interface GetAllCategoriesReq {
  // 空就行，占位
}

// 和 category.GetAllCategoriesResp 对应
export interface GetAllCategoriesResp {
  isSuccessful: boolean;
  errorMessage: string;
  categories: Category[];
}
