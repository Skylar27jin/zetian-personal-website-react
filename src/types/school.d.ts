// src/types/school.d.ts
export interface School {
  id: number;
  name: string;
  short_name: string;
  aliases: string[];
  description: string;
  created_at: number;
  updated_at: number;
}

export interface GetAllSchoolsResp {
  isSuccessful: boolean;
  errorMessage: string;
  Schools: School[];
}
