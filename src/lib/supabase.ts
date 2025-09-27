
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 数据库类型定义
export interface User {
  id: string;
  username: string; // 修正字段名
  phone_number: string;
  login_time: string;
  created_at: string;
}

export interface Location {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
}

export interface Item {
  id: string;
  item_code: string;
  item_name: string;
  location_name: string;
  placed_at: string;
  recorded_at: string;
  created_by: string;
  created_by_name: string;
  created_by_phone: string;
  user_id: string;
}
