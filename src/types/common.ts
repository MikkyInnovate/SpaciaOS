import type { ReactNode } from "react";

export type ChildrenProps = {
  children?: ReactNode;
};

export type ClassNameProps = {
  className?: string;
};

export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}
