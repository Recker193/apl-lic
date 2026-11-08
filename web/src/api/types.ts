export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  schoolId: string;
}

export interface Group {
  id: string;
  name: string;
  schoolId: string;
  subjectId: string;
  classId: string;
  teacherId: string;
  createdAt: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  membershipRole: 'TEACHER' | 'STUDENT';
  canPost: boolean;
  joinedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
}

export interface Announcement {
  id: string;
  groupId: string;
  authorId: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface Assignment {
  id: string;
  groupId: string;
  authorId: string;
  title: string;
  description: string;
  dueAt: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  progress?: {
    status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
    updatedAt: string;
  };
}

export interface Exam {
  id: string;
  groupId: string;
  authorId: string;
  title: string;
  description?: string;
  scheduledAt: string;
  status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
}

export interface Material {
  id: string;
  groupId: string;
  authorId: string;
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export interface SchoolEvent {
  id: string;
  schoolId: string;
  authorId: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  resourceType?: string;
  resourceId?: string;
  readAt?: string | null;
  createdAt: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  schoolYear: string;
  schoolId: string;
}

export interface Subject {
  id: string;
  name: string;
  schoolId: string;
}

export interface AuditLogItem {
  id: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  createdAt: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  schoolYear: string;
  schoolId: string;
  createdAt?: string;
}

export interface Subject {
  id: string;
  name: string;
  schoolId: string;
  createdAt?: string;
}

export type DayOfWeek = 
  | 'MONDAY' 
  | 'TUESDAY' 
  | 'WEDNESDAY' 
  | 'THURSDAY' 
  | 'FRIDAY' 
  | 'SATURDAY' 
  | 'SUNDAY';

export interface WeekendMeeting {
  id: string;
  clubId: string;
  title: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room?: string;
  description?: string;
  club?: {
    id: string;
    name: string;
    formsUrl?: string;
    coordinatorId: string;
  };
}

export interface ClubMember {
  id: string;
  clubId: string;
  userId: string;
  joinedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface Club {
  id: string;
  name: string;
  description?: string;
  formsUrl?: string;
  coordinatorId: string;
  coordinator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
  };
  members?: ClubMember[];
  meetings?: WeekendMeeting[];
}


export interface TimetableEntry {
  id: string;
  schoolId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: DayOfWeek;
  period: number;
  startTime: string;
  endTime: string;
  room?: string;
  class: {
    id: string;
    name: string;
    schoolYear: string;
  };
  subject: {
    id: string;
    name: string;
  };
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface Term {
  id: string;
  number: number;
  schoolYear: string;
  status: 'OPEN' | 'CLOSED';
  startsAt: string;
  endsAt: string;
}

export interface GradeEntry {
  id: string;
  schoolId: string;
  termId: string;
  groupId: string;
  studentId: string;
  teacherId: string;
  type: 'ORAL' | 'TEST' | 'HOMEWORK' | 'PROJECT' | 'THESIS';
  value: number;
  gradedAt: string;
  comment?: string;
  status: 'ACTIVE' | 'VOIDED';
  student?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  group?: {
    id: string;
    name: string;
  };
}

export interface AbsenceEntry {
  id: string;
  termId: string;
  studentId: string;
  groupId?: string;
  date: string;
  status: 'UNEXCUSED' | 'EXCUSED';
  excuseReason?: string;
  group?: {
    id: string;
    name: string;
  };
  student?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}
