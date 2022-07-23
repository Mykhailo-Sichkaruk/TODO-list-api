import { User } from "@prisma/client";

export {};

declare global {
  namespace Express {
    interface Request {
      User?: User;
    }
  }
  type UserTest = {
  id: string;
  token: string;
};
  type ListTest = {
  id: string;
  title: string;
  authorId: string;
};
type List = {
  id: string;
  title: string;
  authorId: string;
  tasks: List[];
};
type Task = {
  id: string;
  title: string;
  body: string;
  listId: string;
  authorId: string;
  status: string;
  deadline: Date;
};
}
