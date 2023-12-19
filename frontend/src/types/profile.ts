export type UserProfile = {
  email?: string;
  password?: string;
  name?: string;
  address?: string;
  companyName?: string;
  companySize?: number;
};

export type UserProfileField = 
 | "email" 
 | "password" 
 | "name" 
 | "address" 
 | "companyName" 
 | "companySize";

export function parseUserProfile(profile: any) {
  const {
    email, 
    password, 
    name, 
    address, 
    company_name: companyName, 
    company_size: companySize
  } = profile;
  return {email, password, name, address, companyName, companySize};
}

export function deparseUserProfile(profile: UserProfile) {
  const {
    email, 
    password, 
    name, 
    address, 
    companyName, 
    companySize
  } = profile;
  return {
    email, 
    password, 
    name, 
    address, 
    company_name: companyName, 
    company_size: companySize
  };
}