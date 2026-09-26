"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";

type ConfirmSubmitButtonProps = ComponentProps<typeof Button> & {
  confirmMessage: string;
};

export function ConfirmSubmitButton({ confirmMessage, onClick, ...props }: ConfirmSubmitButtonProps) {
  return (
    <Button
      type="submit"
      {...props}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    />
  );
}