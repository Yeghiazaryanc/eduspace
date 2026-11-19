// * Օգտատիրոջ դերերը համակարգում

export type UserRole = 'student' | 'admin';

//  Օգտատիրոջ (User) հիմնական կառուցվածքը
export interface User {
    id:number;
    name:string;
    email:string;
    role:UserRole;
};

//  Դասընթացի (Course) հիմնական կառուցվածքը

export interface Course {
    id:number;
    title:string;
    description:string;
};


export interface Comment {
  id: number;
  content: string;
  created_at: string;
  author_name: string;
  author_id: number;
  avatar_url?:string;
};


export interface Course {
  id: number;
  title: string;
  description: string;
  created_at: string;
  enrolled_count: number;
  total_likes: number;
  is_liked_by_user: boolean;
  comments_count?: number; 
  lessons_count?: number;
};

export interface Notification {
    id: number;
    message: string;
    is_read: boolean;
    created_at: string;
    course_id: number;
};

export interface CourseDetailsData {
    id: number;
    title: string;
    description: string;
    created_at: string;
};

export interface LessonData {
    id: number;
    course_id: number;
    title: string;
    video_url: string | null;
    content: string | null;
    order_index: number;
};