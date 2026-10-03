export type Role = 'ADMIN' | 'EMPLOYEE';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT';
export type AttendanceClassification = 'FULL_DAY' | 'HALF_DAY' | 'ABSENT' | 'LATE';
export type TaskStatus = 'DRAFT' | 'PUBLISHED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type OrderStatus = 'DRAFT' | 'BROADCAST' | 'CLAIMED' | 'DISPATCHED' | 'DELIVERED' | 'FAILED' | 'COMPLETED';

export interface User {
  id: string;
  email: string;
  role: Role;
  name: string;
}

export interface Employee {
  id: string;
  user_id: string;
  employee_code: string;
  full_name: string;
  department?: string;
  designation?: string;
  employment_type: EmploymentType;
  base_salary: number;
  join_date: string;
  is_active: boolean;
}

export interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  classification?: AttendanceClassification;
  total_hours?: number;
}
