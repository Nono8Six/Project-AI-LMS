import * as React from "react";
import type { ContainerProps } from "./Container.types";
import { cn } from "@/shared/lib/cn";

export function Container({ as: Tag = "div", className, children }: ContainerProps) {
  const Component = Tag as React.ElementType;
  return <Component className={cn("container mx-auto px-4 sm:px-6 lg:px-8", className)}>{children}</Component>;
}
