import axios from "axios";
import type {
  Category,
  GetAllCategoriesReq,
  GetAllCategoriesResp,
} from "../types/category";

const BASE_URL = import.meta.env.VITE_HERTZ_BASE_URL;

// 获取全部板块（/category/all）
export async function getAllCategories(
  _req?: GetAllCategoriesReq
): Promise<GetAllCategoriesResp> {
  const resp = await axios.get<GetAllCategoriesResp>(`${BASE_URL}/category/all`);
  return resp.data;
}
