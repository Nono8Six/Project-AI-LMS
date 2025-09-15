"use client";

import Script from "next/script";
import { useCSPNonce } from "@/shared/utils/csp";
import type { ComponentProps } from "react";

type BaseProps = ComponentProps<typeof Script>;
type Props = BaseProps & { nonce?: string };

export default function NoncedScript(props: Props) {
  const nonce = useCSPNonce();
  const { nonce: provided, ...rest } = props;
  // Prefer explicit nonce from props; otherwise use the one from meta
  const effectiveNonce = provided ?? nonce ?? undefined;
  return <Script nonce={effectiveNonce} {...rest} />;
}

