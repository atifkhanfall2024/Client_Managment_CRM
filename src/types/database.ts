export type UserRole =
  | "super_admin"
  | "admin"
  | "manager"
  | "employee"
  | "client";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type ClientStatus = "lead" | "active" | "inactive" | "archived";
export type PriorityLevel = "low" | "medium" | "high" | "urgent";
export type ProjectStatus =
  | "planning"
  | "in_progress"
  | "on_hold"
  | "completed"
  | "cancelled";
export type TaskStatus = "todo" | "in_progress" | "review" | "done" | "cancelled";
export type MeetingStatus = "scheduled" | "completed" | "cancelled";
export type EntityType =
  | "client"
  | "company"
  | "project"
  | "task"
  | "user"
  | "document"
  | "meeting";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  phone: string | null;
  is_active: boolean;
  approval_status: ApprovalStatus;
  approved_by: string | null;
  reports_to: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  created_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  company_id: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  industry: string | null;
  budget: number | null;
  deadline: string | null;
  requirements: string | null;
  notes: string | null;
  status: ClientStatus;
  priority: PriorityLevel;
  created_by: string | null;
  assigned_manager_id: string | null;
  portal_user_id: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  company?: Company | null;
  assigned_manager?: Profile | null;
  created_by_profile?: Profile | null;
}

export interface Project {
  id: string;
  name: string;
  client_id: string;
  description: string | null;
  budget: number | null;
  deadline: string | null;
  priority: PriorityLevel;
  status: ProjectStatus;
  progress: number;
  created_by: string | null;
  manager_id: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  client?: Client | null;
  manager?: Profile | null;
  members?: ProjectMember[];
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  assigned_at: string;
  profile?: Profile;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  project_id: string;
  assigned_to: string | null;
  due_date: string | null;
  priority: PriorityLevel;
  status: TaskStatus;
  created_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  project?: Project | null;
  assignee?: Profile | null;
  comments?: TaskComment[];
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}

export interface Document {
  id: string;
  name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  entity_type: EntityType;
  entity_id: string;
  uploaded_by: string | null;
  deleted_at: string | null;
  created_at: string;
  uploader?: Profile | null;
}

export interface ActivityLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: EntityType;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor?: Profile | null;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface ProjectMeeting {
  id: string;
  project_id: string;
  client_id: string;
  title: string;
  agenda: string | null;
  notes: string | null;
  scheduled_at: string;
  duration_minutes: number;
  location: string | null;
  meeting_url: string | null;
  status: MeetingStatus;
  created_by: string | null;
  manager_id: string | null;
  visible_to_client: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  project?: { id: string; name: string } | null;
  manager?: { id: string; full_name: string; email: string } | null;
}

export interface DashboardStats {
  total_clients: number;
  active_projects: number;
  completed_projects: number;
  pending_tasks: number;
  revenue: number;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
