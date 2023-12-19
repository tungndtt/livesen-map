export type UserProfile = {
  email?: string;
  password?: string;
  name?: string;
  address?: string;
  company_name?: string;
  company_size?: number;
};

export type UserProfileField = 
 | "email" 
 | "password" 
 | "name" 
 | "address" 
 | "company_name" 
 | "company_size";